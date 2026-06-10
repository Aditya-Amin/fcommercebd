<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Sms\SmsBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Mock package activation — LOCAL DEVELOPMENT ONLY.
 *
 * Provides two endpoints used by the /test/activate-package Next.js page:
 *
 *   GET  /api/dev/packages          — list available plans
 *   POST /api/dev/activate-package  — instantly activate a plan for the current user
 *
 * Both endpoints abort with 403 when APP_ENV is not "local", so there is no
 * risk of accidentally shipping this to production.
 */
class PackageController extends Controller
{
    public function __construct(private readonly SmsBalanceService $smsBalance) {}

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/dev/packages
     *
     * Lists all active plans with their SMS limits, used by the test page
     * to render the activation buttons.
     */
    public function index(): JsonResponse
    {
        $this->requireLocalEnv();

        $plans = Plan::active()
            ->get()
            ->map(fn (Plan $p) => [
                'id'        => $p->id,
                'name'      => $p->name,
                'slug'      => $p->slug,
                'price'     => (float) $p->price,
                'currency'  => $p->currency,
                'sms_limit' => (int) ($p->limits['sms'] ?? 0),
                'features'  => $p->features ?? [],
            ]);

        return response()->json(['data' => $plans]);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/dev/activate-package
     *
     * Body: { "plan_id": 2 }
     *
     * Instantly activates the chosen plan for the authenticated user without
     * going through bKash. Creates a Subscription (status=active) and the
     * corresponding SmsBalance row.
     *
     * If the user already has an active subscription, it is cancelled first
     * so only one is ever active at a time.
     *
     * Response:
     * {
     *   "ok": true,
     *   "plan": "Growth",
     *   "sms_total": 300,
     *   "expires_at": "2026-07-09"
     * }
     */
    public function activate(Request $request): JsonResponse
    {
        $this->requireLocalEnv();

        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
        ]);

        $user = $request->user();
        $plan = Plan::active()->findOrFail($data['plan_id']);

        // Cancel any existing active subscriptions so the user has exactly one
        Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        // Create the new active subscription (no bKash payment needed in dev)
        $subscription = Subscription::create([
            'user_id'        => $user->id,
            'plan_id'        => $plan->id,
            'transaction_id' => 'DEV-' . $user->id . '-' . time(),
            'amount'         => $plan->price,
            'status'         => 'active',
            'start_date'     => now(),
            'expiry_date'    => now()->addDays($plan->duration_days),
        ]);

        // Eager-load plan on the subscription so SmsBalanceService can read limits
        $subscription->setRelation('plan', $plan);

        // Create the SMS balance for this subscription period
        $balance = $this->smsBalance->activate($subscription);

        return response()->json([
            'ok'        => true,
            'plan'      => $plan->name,
            'sms_total' => $balance->total_sms,
            'expires_at'=> $subscription->expiry_date->toDateString(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /** Abort with 403 when called outside local environment. */
    private function requireLocalEnv(): void
    {
        if (app()->environment('local')) return;

        abort(403, 'This endpoint is only available in local development.');
    }
}
