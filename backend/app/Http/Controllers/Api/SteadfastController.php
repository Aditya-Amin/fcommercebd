<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\SteadfastException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Steadfast\CreateConsignmentRequest;
use App\Http\Requests\Steadfast\SaveCredentialsRequest;
use App\Http\Resources\SteadfastConsignmentResource;
use App\Models\SteadfastConsignment;
use App\Models\SteadfastCredential;
use App\Services\Steadfast\SteadfastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Steadfast Courier integration.
 *
 * Frontend flow:
 *   /integrations  → POST /api/steadfast/credentials  (validates via /get_balance)
 *                    GET  /api/steadfast/credentials  (returns { connected, isValid })
 *                    GET  /api/steadfast/balance      (current balance for sanity check)
 *                    DELETE /api/steadfast/credentials
 *   /orders        → POST /api/steadfast/consignments (book delivery for a confirmed order)
 *                    GET  /api/steadfast/consignments/{invoice} (read back saved row)
 *                    POST /api/steadfast/consignments/{invoice}/sync-status (refresh from Steadfast)
 */
class SteadfastController extends Controller
{
    public function __construct(private readonly SteadfastService $steadfast) {}

    // ────────────────────────────────────────── Credentials

    /** GET /api/steadfast/credentials */
    public function showCredentials(Request $request): JsonResponse
    {
        $cred = SteadfastCredential::where('user_id', $request->user()->id)->first();

        return response()->json([
            'data' => [
                'connected' => $cred !== null,
                'isValid'   => (bool) $cred?->is_valid,
                'lastValidatedAt' => optional($cred?->last_validated_at)->toIso8601String(),
            ],
        ]);
    }

    /** POST /api/steadfast/credentials */
    public function saveCredentials(SaveCredentialsRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        // Validate by hitting /get_balance with the supplied keys. If Steadfast
        // accepts them we know they work; otherwise return the actual upstream
        // error so the frontend can show "invalid keys".
        try {
            $balance = $this->steadfast->getBalance($data['api_key'], $data['secret_key']);
        } catch (SteadfastException $e) {
            Log::channel('steadfast')->warning('credentials_validation_failed', [
                'user' => $user->id,
                'http' => $e->httpStatus,
                'msg'  => $e->getMessage(),
            ]);
            return response()->json([
                'message' => $e->isAuthError()
                    ? 'Invalid API key or secret key.'
                    : 'Could not verify credentials with Steadfast. Try again.',
                'reason'  => $e->isAuthError() ? 'invalid_credentials' : 'transport_error',
            ], 422);
        }

        $cred = SteadfastCredential::updateOrCreate(
            ['user_id' => $user->id],
            [
                'api_key'           => $data['api_key'],
                'secret_key'        => $data['secret_key'],
                'is_valid'          => true,
                'last_validated_at' => now(),
            ],
        );

        return response()->json([
            'data' => [
                'connected'        => true,
                'isValid'          => true,
                'lastValidatedAt'  => optional($cred->last_validated_at)->toIso8601String(),
                'currentBalance'   => $balance['current_balance'] ?? null,
            ],
        ]);
    }

    /** DELETE /api/steadfast/credentials */
    public function deleteCredentials(Request $request): JsonResponse
    {
        SteadfastCredential::where('user_id', $request->user()->id)->delete();
        return response()->json(['data' => ['disconnected' => true]]);
    }

    // ────────────────────────────────────────── Balance

    /** GET /api/steadfast/balance */
    public function balance(Request $request): JsonResponse
    {
        $cred = $this->requireCredentials($request);
        if ($cred instanceof JsonResponse) return $cred;

        try {
            $resp = $this->steadfast->getBalance($cred->api_key, $cred->secret_key);
        } catch (SteadfastException $e) {
            return $this->mapException($e, $cred);
        }

        return response()->json([
            'data' => [
                'currentBalance' => $resp['current_balance'] ?? 0,
            ],
        ]);
    }

    // ────────────────────────────────────────── Consignments (booking)

    /** POST /api/steadfast/consignments */
    public function createConsignment(CreateConsignmentRequest $request): JsonResponse
    {
        $cred = $this->requireCredentials($request);
        if ($cred instanceof JsonResponse) return $cred;

        $data = $request->validated();
        $user = $request->user();

        // If we already booked this invoice and got a consignment back,
        // re-return that record instead of double-booking. Same idempotency
        // pattern as the bKash callback.
        $existing = SteadfastConsignment::where('user_id', $user->id)
            ->where('invoice', $data['invoice'])
            ->whereNotNull('consignment_id')
            ->first();
        if ($existing) {
            return response()->json([
                'data' => new SteadfastConsignmentResource($existing),
            ]);
        }

        try {
            $resp = $this->steadfast->createOrder($cred->api_key, $cred->secret_key, $data);
        } catch (SteadfastException $e) {
            return $this->mapException($e, $cred);
        }

        $c = $resp['consignment'] ?? null;
        if (! is_array($c) || empty($c['consignment_id']) || empty($c['tracking_code'])) {
            Log::channel('steadfast')->error('create_order_unexpected_shape', ['response' => $resp]);
            return response()->json([
                'message' => 'Steadfast accepted the request but returned an unexpected response.',
            ], 502);
        }

        $row = SteadfastConsignment::updateOrCreate(
            ['user_id' => $user->id, 'invoice' => $data['invoice']],
            [
                'consignment_id'    => (int) $c['consignment_id'],
                'tracking_code'     => (string) $c['tracking_code'],
                'status'            => $c['status'] ?? SteadfastConsignment::STATUS_IN_REVIEW,
                'recipient_name'    => $data['recipient_name'],
                'recipient_phone'   => $data['recipient_phone'],
                'alternative_phone' => $data['alternative_phone'] ?? null,
                'recipient_email'   => $data['recipient_email'] ?? null,
                'recipient_address' => $data['recipient_address'],
                'cod_amount'        => $data['cod_amount'],
                'note'              => $data['note'] ?? null,
                'item_description'  => $data['item_description'] ?? null,
                'delivery_type'     => $data['delivery_type'] ?? null,
                'raw_response'      => $resp,
                'last_synced_at'    => now(),
            ],
        );

        return response()->json([
            'data' => new SteadfastConsignmentResource($row),
        ], 201);
    }

    /** GET /api/steadfast/consignments — list every consignment for this user */
    public function listConsignments(Request $request): JsonResponse
    {
        $rows = SteadfastConsignment::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(500)
            ->get();

        return response()->json([
            'data' => SteadfastConsignmentResource::collection($rows),
        ]);
    }

    /** GET /api/steadfast/consignments/{invoice} */
    public function showConsignment(Request $request, string $invoice): JsonResponse
    {
        $row = SteadfastConsignment::where('user_id', $request->user()->id)
            ->where('invoice', $invoice)
            ->first();

        if (! $row) {
            return response()->json(['message' => 'No consignment for this invoice.'], 404);
        }

        return response()->json(['data' => new SteadfastConsignmentResource($row)]);
    }

    /** POST /api/steadfast/consignments/{invoice}/sync-status */
    public function syncStatus(Request $request, string $invoice): JsonResponse
    {
        $cred = $this->requireCredentials($request);
        if ($cred instanceof JsonResponse) return $cred;

        $row = SteadfastConsignment::where('user_id', $request->user()->id)
            ->where('invoice', $invoice)
            ->first();
        if (! $row) {
            return response()->json(['message' => 'No consignment for this invoice.'], 404);
        }

        try {
            $resp = $row->tracking_code
                ? $this->steadfast->statusByTrackingCode($cred->api_key, $cred->secret_key, $row->tracking_code)
                : $this->steadfast->statusByInvoice($cred->api_key, $cred->secret_key, $row->invoice);
        } catch (SteadfastException $e) {
            return $this->mapException($e, $cred);
        }

        $newStatus = $resp['delivery_status'] ?? $row->status;
        $row->forceFill([
            'status'         => $newStatus,
            'last_synced_at' => now(),
        ])->save();

        return response()->json([
            'data' => new SteadfastConsignmentResource($row),
        ]);
    }

    // ────────────────────────────────────────── helpers

    /** @return SteadfastCredential|JsonResponse  Credential row or 412 JSON */
    private function requireCredentials(Request $request)
    {
        $cred = SteadfastCredential::where('user_id', $request->user()->id)->first();
        if (! $cred) {
            return response()->json([
                'message' => 'Steadfast credentials are not saved. Add them in Integrations.',
                'reason'  => 'no_credentials',
            ], 412);
        }
        return $cred;
    }

    private function mapException(SteadfastException $e, SteadfastCredential $cred): JsonResponse
    {
        if ($e->isAuthError()) {
            // Surface Steadfast's verbatim message — a 401 on `/create_order`
            // often means "account not activated" or "pickup area not set",
            // not bad credentials. We do NOT flip is_valid to false here
            // because the same keys may still work for /get_balance.
            $upstreamMessage = is_array($e->response) && !empty($e->response['message'])
                ? (string) $e->response['message']
                : 'Steadfast rejected the request.';

            return response()->json([
                'message' => $upstreamMessage . ' Check your Steadfast portal — your account may need approval, a pickup area, or top-up.',
                'reason'  => 'upstream_unauthorized',
                'upstream' => $e->response,
            ], 401);
        }

        return response()->json([
            'message' => $e->getMessage(),
            'reason'  => $e->isTransient() ? 'transient' : 'upstream_error',
        ], $e->httpStatus && $e->httpStatus >= 400 ? min($e->httpStatus, 502) : 502);
    }
}
