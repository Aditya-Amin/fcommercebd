<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Admin\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class SslCommerzController extends Controller
{
    /**
     * POST /api/sslcommerz/initiate   (auth:sanctum)
     * Body: { plan_id: int }
     *
     * Creates a pending Payment row, calls SSLCommerz, returns the gateway URL
     * for the frontend to redirect the user to.
     */
    public function initiate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
        ]);

        $user = $request->user();
        $plan = Plan::active()->findOrFail($data['plan_id']);

        $tranId = 'SSLCZ-' . $user->id . '-' . time() . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));

        $payment = Payment::create([
            'user_id'    => $user->id,
            'plan_id'    => $plan->id,
            'gateway'    => 'sslcommerz',
            'payment_id' => $tranId,
            'amount'     => $plan->price,
            'currency'   => $plan->currency ?? 'BDT',
            'intent'     => 'sale',
            'status'     => 'initiated',
            'raw_response' => [],
        ]);

        $postData = [
            'total_amount'    => number_format((float) $plan->price, 2, '.', ''),
            'currency'        => 'BDT',
            'tran_id'         => $tranId,
            'product_name'    => $plan->name . ' Subscription',
            'product_category'=> 'subscription',
            'product_profile' => 'non-physical-goods',
            'shipping_method' => 'NO',

            // Customer info
            'cus_name'        => $user->name,
            'cus_email'       => $user->email,
            'cus_phone'       => $user->phone ?? '01700000000',
            'cus_add1'        => 'Dhaka',
            'cus_country'     => 'Bangladesh',

            // Store payment + plan IDs in value_a/b for IPN recovery
            'value_a'         => (string) $payment->id,
            'value_b'         => (string) $plan->id,
            'value_c'         => (string) $user->id,
        ];

        try {
            $sslc    = new SslCommerzNotification();
            $result  = $sslc->makePayment($postData, 'checkout', 'json');
            $decoded = json_decode($result, true);
        } catch (Throwable $e) {
            Log::error('sslcommerz.initiate_failed', ['error' => $e->getMessage(), 'user' => $user->id]);
            $payment->update(['status' => 'failed']);
            return response()->json(['message' => 'Could not initiate SSLCommerz payment.'], 502);
        }

        if (empty($decoded['data']) || !in_array($decoded['status'] ?? '', ['success', 'SUCCESS'])) {
            $payment->update(['status' => 'failed']);
            return response()->json([
                'message' => $decoded['message'] ?? 'SSLCommerz gateway error.',
            ], 502);
        }

        return response()->json([
            'gateway_url' => $decoded['data'],
            'tran_id'     => $tranId,
            'amount'      => $plan->price,
            'currency'    => 'BDT',
        ]);
    }

    /**
     * POST /sslcommerz/success
     * SSLCommerz redirects the user here after successful payment.
     */
    public function success(Request $request): RedirectResponse
    {
        $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $tranId   = $request->input('tran_id');

        Log::info('sslcommerz.success', $request->all());

        $payment = Payment::where('payment_id', $tranId)->where('gateway', 'sslcommerz')->first();

        if (! $payment) {
            return redirect("{$frontend}/payment/failed?reason=unknown_payment&gateway=sslcommerz");
        }

        if ($payment->isCompleted()) {
            return redirect(
                "{$frontend}/payment/success"
                . '?paymentID=' . urlencode($tranId)
                . '&trxID='     . urlencode($payment->trx_id ?? '')
                . '&plan='      . urlencode((string) $payment->plan_id)
                . '&gateway=sslcommerz'
            );
        }

        try {
            $sslc       = new SslCommerzNotification();
            $validation = $sslc->orderValidate(
                $request->all(),
                $tranId,
                $payment->amount,
                'BDT'
            );
        } catch (Throwable $e) {
            Log::error('sslcommerz.validate_failed', ['tran_id' => $tranId, 'error' => $e->getMessage()]);
            return redirect("{$frontend}/payment/failed?reason=validation_error&gateway=sslcommerz");
        }

        if (! $validation) {
            $payment->update(['status' => 'failed', 'raw_response' => $request->all()]);
            return redirect("{$frontend}/payment/failed?reason=validation_failed&gateway=sslcommerz");
        }

        try {
            $subscription = $this->finalize($payment, $request->all());
        } catch (Throwable $e) {
            Log::error('sslcommerz.finalize_failed', ['tran_id' => $tranId, 'error' => $e->getMessage()]);
            return redirect("{$frontend}/payment/failed?reason=server_error&gateway=sslcommerz");
        }

        return redirect(
            "{$frontend}/payment/success"
            . '?paymentID=' . urlencode($tranId)
            . '&trxID='     . urlencode($request->input('bank_tran_id', ''))
            . '&plan='      . urlencode((string) $subscription->plan_id)
            . '&gateway=sslcommerz'
        );
    }

    /**
     * POST /sslcommerz/fail
     */
    public function fail(Request $request): RedirectResponse
    {
        $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $tranId   = $request->input('tran_id');

        Log::info('sslcommerz.fail', $request->all());

        $payment = Payment::where('payment_id', $tranId)->where('gateway', 'sslcommerz')->first();
        if ($payment && ! $payment->isCompleted()) {
            $payment->update(['status' => 'failed', 'raw_response' => $request->all()]);
        }

        return redirect("{$frontend}/payment/failed?reason=payment_failed&gateway=sslcommerz");
    }

    /**
     * POST /sslcommerz/cancel
     */
    public function cancel(Request $request): RedirectResponse
    {
        $frontend = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'));
        $tranId   = $request->input('tran_id');

        Log::info('sslcommerz.cancel', $request->all());

        $payment = Payment::where('payment_id', $tranId)->where('gateway', 'sslcommerz')->first();
        if ($payment && ! $payment->isCompleted()) {
            $payment->update(['status' => 'cancelled', 'raw_response' => $request->all()]);
        }

        return redirect("{$frontend}/payment/failed?reason=cancelled&gateway=sslcommerz");
    }

    /**
     * POST /sslcommerz/ipn
     * Server-to-server notification from SSLCommerz (no user session).
     */
    public function ipn(Request $request): \Illuminate\Http\Response
    {
        Log::info('sslcommerz.ipn', $request->all());

        $tranId = $request->input('tran_id');
        if (! $tranId) {
            return response('Invalid Data', 400);
        }

        $payment = Payment::where('payment_id', $tranId)->where('gateway', 'sslcommerz')->first();
        if (! $payment) {
            return response('Payment Not Found', 404);
        }

        if ($payment->isCompleted()) {
            return response('Already Completed', 200);
        }

        $sslc       = new SslCommerzNotification();
        $validation = $sslc->orderValidate(
            $request->all(),
            $tranId,
            $payment->amount,
            'BDT'
        );

        if ($validation) {
            try {
                $this->finalize($payment, $request->all());
                return response('Transaction Completed', 200);
            } catch (Throwable $e) {
                Log::error('sslcommerz.ipn_finalize_failed', ['tran_id' => $tranId, 'error' => $e->getMessage()]);
                return response('Server Error', 500);
            }
        }

        $payment->update(['status' => 'failed', 'raw_response' => $request->all()]);
        return response('Validation Failed', 400);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private function finalize(Payment $payment, array $sslData): Subscription
    {
        $isNew = false;

        $subscription = DB::transaction(function () use ($payment, $sslData, &$isNew) {
            $bankTranId = $sslData['bank_tran_id'] ?? ('SSLCZ-' . uniqid());

            $existing = Subscription::where('transaction_id', $bankTranId)->lockForUpdate()->first();
            if ($existing) {
                $payment->update([
                    'trx_id'          => $bankTranId,
                    'status'          => 'completed',
                    'paid_at'         => now(),
                    'subscription_id' => $existing->id,
                    'raw_response'    => $sslData,
                ]);
                return $existing;
            }

            $plan = $payment->plan;

            $subscription = Subscription::create([
                'user_id'        => $payment->user_id,
                'plan_id'        => $plan->id,
                'transaction_id' => $bankTranId,
                'amount'         => $plan->price,
                'status'         => 'active',
                'start_date'     => now(),
                'expiry_date'    => now()->addDays($plan->duration_days),
            ]);

            $payment->update([
                'trx_id'          => $bankTranId,
                'status'          => 'completed',
                'paid_at'         => now(),
                'subscription_id' => $subscription->id,
                'raw_response'    => $sslData,
            ]);

            $isNew = true;
            return $subscription;
        });

        if ($isNew) {
            $user = User::find($subscription->user_id);
            if ($user) {
                AdminNotificationService::planPurchased($user, $subscription->load('plan'));
            }
        }

        return $subscription;
    }
}
