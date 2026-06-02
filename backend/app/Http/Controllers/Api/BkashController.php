<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\BkashException;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\BkashService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class BkashController extends Controller
{
    public function __construct(private readonly BkashService $bkash) {}

    /**
     * POST /api/bkash/token
     * Debug/admin: force a fresh id_token grant.
     */
    public function token(): JsonResponse
    {
        return response()->json([
            'token' => $this->bkash->getToken(force: true),
            'expires_in_hint_seconds' => 3600,
        ]);
    }

    /**
     * POST /api/bkash/create-payment
     * Body: { plan_id: int }
     * Returns: { paymentID, bkashURL }
     */
    public function createPayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
        ]);

        $user = $request->user();
        $plan = Plan::active()->findOrFail($data['plan_id']);

        if (empty($user->phone)) {
            return response()->json([
                'message' => 'A bKash-eligible phone number is required. Update your profile and try again.',
            ], 422);
        }

        // ── Simulate mode (BKASH_SIMULATE=true) ────────────────────────────
        // Skip the real bKash API. Generate a synthetic paymentID + URL that
        // points to our own /api/bkash/simulate-pay endpoint, which mimics
        // bKash's redirect-back behavior and finalizes the payment instantly.
        if (config('bkash.simulate')) {
            $paymentID = 'SIMTRX' . now()->format('YmdHis') . substr(bin2hex(random_bytes(3)), 0, 6);

            Payment::create([
                'user_id'             => $user->id,
                'plan_id'             => $plan->id,
                'payment_id'          => $paymentID,
                'merchant_invoice_no' => 'SIM-' . $user->id . '-' . time(),
                'amount'              => $plan->price,
                'currency'            => $plan->currency,
                'intent'              => 'sale',
                'status'              => 'initiated',
                'raw_response'        => ['simulated' => true],
            ]);

            return response()->json([
                'paymentID' => $paymentID,
                'bkashURL'  => url("/api/bkash/simulate-pay?paymentID={$paymentID}"),
                'amount'    => $plan->price,
                'currency'  => $plan->currency,
                'simulated' => true,
            ]);
        }

        try {
            $bkashResponse = $this->bkash->createPayment([
                'amount'         => $plan->price,
                'currency'       => $plan->currency,
                'payerReference' => $user->phone,
            ]);
        } catch (BkashException $e) {
            Log::channel('bkash')->error('create_payment_failed', [
                'user'     => $user->id,
                'plan'     => $plan->id,
                'message'  => $e->getMessage(),
                'response' => $e->response,
            ]);
            return response()->json([
                'message' => 'Could not initiate bKash payment',
                'error'   => $e->getMessage(),
                'code'    => $e->bkashStatusCode,
            ], 502);
        }

        Payment::create([
            'user_id'             => $user->id,
            'plan_id'             => $plan->id,
            'payment_id'          => $bkashResponse['paymentID'],
            'merchant_invoice_no' => $bkashResponse['merchantInvoiceNumber'] ?? null,
            'amount'              => $plan->price,
            'currency'            => $plan->currency,
            'intent'              => $bkashResponse['intent'] ?? 'sale',
            'status'              => 'initiated',
            'raw_response'        => $bkashResponse,
        ]);

        return response()->json([
            'paymentID' => $bkashResponse['paymentID'],
            'bkashURL'  => $bkashResponse['bkashURL'],
            'amount'    => $plan->price,
            'currency'  => $plan->currency,
        ]);
    }

    /**
     * GET /api/bkash/callback?paymentID=...&status=success|failure|cancel
     * bKash redirects the customer here after the wallet step.
     * We execute, persist, create subscription, then redirect to Next.js.
     */
    public function callback(Request $request): RedirectResponse
    {
        $paymentID = (string) $request->query('paymentID', '');
        $status    = (string) $request->query('status', 'failure');
        $frontend  = config('bkash.frontend_url');

        Log::channel('bkash')->info('callback_received', [
            'paymentID' => $paymentID,
            'status'    => $status,
            'query'     => $request->query(),
        ]);

        if ($paymentID === '') {
            return redirect("{$frontend}/payment/failed?reason=missing_payment_id");
        }

        $payment = Payment::where('payment_id', $paymentID)->first();
        if (! $payment) {
            Log::channel('bkash')->warning('callback_unknown_payment', ['paymentID' => $paymentID]);
            return redirect("{$frontend}/payment/failed?reason=unknown_payment");
        }

        // bKash retries this redirect on flaky networks. If we've already finalized
        // the payment, sending the customer back through Execute would error and
        // overwrite the success state — short-circuit to the success page instead.
        if ($payment->isCompleted()) {
            return redirect(
                "{$frontend}/payment/success"
                . '?paymentID=' . urlencode($paymentID)
                . '&trxID='     . urlencode($payment->trx_id ?? '')
                . '&plan='      . urlencode((string) ($payment->subscription?->plan_id ?? $payment->plan_id))
            );
        }

        if ($status !== 'success') {
            $payment->update([
                'status' => $status === 'cancel' ? 'cancelled' : 'failed',
            ]);
            return redirect("{$frontend}/payment/failed?reason={$status}");
        }

        try {
            $execute = $this->bkash->executePayment($paymentID);
        } catch (BkashException $e) {
            Log::channel('bkash')->warning('execute_failed_querying', [
                'paymentID' => $paymentID,
                'message'   => $e->getMessage(),
                'response'  => $e->response,
            ]);
            $execute = $this->queryAfterExecuteFailure($payment, $e);
            if ($execute === null) {
                return redirect("{$frontend}/payment/failed?reason=execute_failed");
            }
        }

        $statusCode  = $execute['statusCode'] ?? null;
        $trxStatus   = $execute['transactionStatus'] ?? null;

        if ($statusCode !== '0000' || $trxStatus !== 'Completed' || empty($execute['trxID'])) {
            $payment->update([
                'status'       => 'failed',
                'raw_response' => $execute,
            ]);
            $reason = $statusCode ?: 'execute_failed';
            return redirect("{$frontend}/payment/failed?reason={$reason}");
        }

        try {
            $subscription = $this->finalize($payment, $execute);
        } catch (Throwable $e) {
            Log::channel('bkash')->error('finalize_failed', [
                'paymentID' => $paymentID,
                'message'   => $e->getMessage(),
            ]);
            return redirect("{$frontend}/payment/failed?reason=server_error");
        }

        return redirect(
            "{$frontend}/payment/success"
                . '?paymentID=' . urlencode($paymentID)
                . '&trxID='     . urlencode($execute['trxID'])
                . '&plan='      . urlencode((string) $subscription->plan_id)
        );
    }

    /**
     * POST /api/bkash/execute-payment
     * Manual fallback if the callback is missed. Idempotent.
     * Body: { paymentID }
     */
    public function executePayment(Request $request): JsonResponse
    {
        $data = $request->validate(['paymentID' => ['required', 'string']]);

        $payment = Payment::where('payment_id', $data['paymentID'])->firstOrFail();

        if ($payment->isCompleted()) {
            return response()->json([
                'message' => 'Payment already completed',
                'payment' => $payment->fresh()->load('subscription'),
            ]);
        }

        try {
            $execute = $this->bkash->executePayment($data['paymentID']);
        } catch (BkashException $e) {
            $execute = $this->queryAfterExecuteFailure($payment, $e);
            if ($execute === null) {
                return response()->json(['error' => $e->getMessage(), 'code' => $e->bkashStatusCode], 502);
            }
        }

        if (($execute['statusCode'] ?? null) === '0000' && ($execute['transactionStatus'] ?? null) === 'Completed') {
            $this->finalize($payment, $execute);
            return response()->json(['ok' => true, 'execute' => $execute]);
        }

        $payment->update(['status' => 'failed', 'raw_response' => $execute]);
        return response()->json(['ok' => false, 'execute' => $execute], 422);
    }

    /**
     * POST /api/bkash/query-payment
     * Body: { paymentID }
     */
    public function queryPayment(Request $request): JsonResponse
    {
        $data = $request->validate(['paymentID' => ['required', 'string']]);

        try {
            return response()->json($this->bkash->queryPayment($data['paymentID']));
        } catch (BkashException $e) {
            return response()->json(['error' => $e->getMessage(), 'code' => $e->bkashStatusCode], 502);
        }
    }

    /**
     * POST /api/bkash/refund  (admin only — protect with appropriate middleware)
     * Body: { paymentID, trxID, amount, reason? }
     */
    public function refund(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paymentID' => ['required', 'string'],
            'trxID'     => ['required', 'string'],
            'amount'    => ['required', 'numeric', 'min:0.01'],
            'reason'    => ['nullable', 'string', 'max:255'],
        ]);

        $payment = Payment::where('payment_id', $data['paymentID'])->firstOrFail();

        try {
            $resp = $this->bkash->refund(
                $data['paymentID'],
                $data['trxID'],
                $data['amount'],
                $data['reason'] ?? 'Customer request',
            );
        } catch (BkashException $e) {
            return response()->json(['error' => $e->getMessage(), 'code' => $e->bkashStatusCode], 502);
        }

        if (($resp['statusCode'] ?? null) === '0000') {
            $payment->update(['status' => 'refunded']);
            if ($payment->subscription) {
                $payment->subscription->update(['status' => 'cancelled']);
            }
        }

        return response()->json($resp);
    }

    /**
     * GET /api/bkash/simulate-pay?paymentID=...
     *
     * Public endpoint used ONLY when BKASH_SIMULATE=true. Mimics what bKash
     * would do after the customer completes the wallet step:
     *   1. Marks the Payment as completed
     *   2. Calls finalize() to create the active subscription
     *   3. Redirects to the frontend success page
     *
     * Production must set BKASH_SIMULATE=false so this endpoint short-circuits.
     */
    public function simulatePay(Request $request): RedirectResponse
    {
        $frontend = config('bkash.frontend_url');

        if (! config('bkash.simulate')) {
            return redirect("{$frontend}/payment/failed?reason=simulate_disabled");
        }

        $paymentID = (string) $request->query('paymentID', '');
        $payment   = Payment::where('payment_id', $paymentID)->first();

        if (! $payment) {
            return redirect("{$frontend}/payment/failed?reason=unknown_payment");
        }

        if ($payment->isCompleted()) {
            return redirect(
                "{$frontend}/payment/success"
                . '?paymentID=' . urlencode($paymentID)
                . '&trxID='     . urlencode($payment->trx_id ?? '')
                . '&plan='      . urlencode((string) ($payment->subscription?->plan_id ?? $payment->plan_id))
            );
        }

        $synthetic = [
            'paymentID'         => $paymentID,
            'trxID'             => 'SIMBKT' . strtoupper(bin2hex(random_bytes(5))),
            'transactionStatus' => 'Completed',
            'statusCode'        => '0000',
            'amount'            => (string) $payment->amount,
            'currency'          => $payment->currency,
            'simulated'         => true,
        ];

        try {
            $subscription = $this->finalize($payment, $synthetic);
        } catch (Throwable $e) {
            Log::channel('bkash')->error('simulate_finalize_failed', [
                'paymentID' => $paymentID,
                'message'   => $e->getMessage(),
            ]);
            return redirect("{$frontend}/payment/failed?reason=server_error");
        }

        return redirect(
            "{$frontend}/payment/success"
            . '?paymentID=' . urlencode($paymentID)
            . '&trxID='     . urlencode($synthetic['trxID'])
            . '&plan='      . urlencode((string) $subscription->plan_id)
        );
    }

    /**
     * POST /api/bkash/webhook
     * Server-to-server async event from bKash. If BKASH_WEBHOOK_SECRET is set,
     * verifies an HMAC signature in the X-Bkash-Signature header.
     */
    public function webhook(Request $request): Response
    {
        $secret = config('bkash.webhook_secret');
        if ($secret) {
            $given    = $request->header('X-Bkash-Signature', '');
            $expected = hash_hmac('sha256', $request->getContent(), $secret);
            if (! hash_equals($expected, (string) $given)) {
                Log::channel('bkash')->warning('webhook_bad_signature', ['ip' => $request->ip()]);
                return response('Invalid signature', 401);
            }
        }

        $payload = $request->all();
        Log::channel('bkash')->info('webhook_received', $payload);

        $paymentID = $payload['paymentID'] ?? null;
        if ($paymentID) {
            $payment = Payment::where('payment_id', $paymentID)->first();
            if ($payment && ! $payment->isCompleted() && ($payload['transactionStatus'] ?? null) === 'Completed') {
                $this->finalize($payment, $payload);
            }
        }

        return response('OK', 200);
    }

    // ─────────────────────────────────────────── helpers

    /**
     * Doc-mandated fallback: when Execute transport-fails (timeout / 5xx) we
     * cannot assume the charge didn't happen — bKash may have completed it
     * server-side. Query Payment is the canonical source of truth.
     *
     * Returns a payload shaped like an Execute response (trxID,
     * transactionStatus, statusCode) when Query is conclusive, or null when
     * Query also fails — caller should treat that as a hard failure.
     */
    private function queryAfterExecuteFailure(Payment $payment, BkashException $executeError): ?array
    {
        try {
            $query = $this->bkash->queryPayment($payment->payment_id);
        } catch (BkashException $e) {
            Log::channel('bkash')->error('query_after_execute_failed', [
                'paymentID'   => $payment->payment_id,
                'execute_err' => $executeError->getMessage(),
                'query_err'   => $e->getMessage(),
            ]);
            $payment->update(['status' => 'failed']);
            return null;
        }

        Log::channel('bkash')->info('query_after_execute_recovered', [
            'paymentID'         => $payment->payment_id,
            'transactionStatus' => $query['transactionStatus'] ?? null,
        ]);

        return $query;
    }

    /**
     * Persist the executed payment + create/look-up the subscription atomically.
     */
    private function finalize(Payment $payment, array $execute): Subscription
    {
        return DB::transaction(function () use ($payment, $execute) {
            // Duplicate trxID? Reuse the existing subscription rather than double-charging the user.
            $existing = Subscription::where('transaction_id', $execute['trxID'])->lockForUpdate()->first();
            if ($existing) {
                $payment->update([
                    'trx_id'          => $execute['trxID'],
                    'status'          => 'completed',
                    'paid_at'         => now(),
                    'subscription_id' => $existing->id,
                    'raw_response'    => $execute,
                ]);
                return $existing;
            }

            $plan = $payment->plan;

            $subscription = Subscription::create([
                'user_id'        => $payment->user_id,
                'plan_id'        => $plan->id,
                'transaction_id' => $execute['trxID'],
                'amount'         => $plan->price,
                'status'         => 'active',
                'start_date'     => now(),
                'expiry_date'    => now()->addDays($plan->duration_days),
            ]);

            $payment->update([
                'trx_id'          => $execute['trxID'],
                'status'          => 'completed',
                'paid_at'         => now(),
                'subscription_id' => $subscription->id,
                'raw_response'    => $execute,
            ]);

            return $subscription;
        });
    }
}
