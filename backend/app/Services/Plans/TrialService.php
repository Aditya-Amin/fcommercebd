<?php

namespace App\Services\Plans;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Sms\SmsBalanceService;
use Illuminate\Support\Facades\Log;

/**
 * Grants a new signup a free 30-day trial so they can try the product before
 * paying. The trial is a real Subscription with status 'trial' on the Starter
 * plan — so it flows through every existing access check (EnsureSubscriptionActive
 * middleware + PlanQuotaService) and locks automatically when it expires.
 *
 * Trial perks (= Starter plan limits): 5 AI generations, 10 SMS, 30 FB posts,
 * plus Facebook + courier connection. After 30 days all of it locks until a
 * payment or an admin activates a paid plan.
 */
class TrialService
{
    public const DURATION_DAYS = 30;
    public const PLAN_SLUG = 'starter';

    public function __construct(private readonly SmsBalanceService $smsBalance) {}

    /**
     * Start a trial for a user that has no subscription yet. Idempotent: returns
     * null (and does nothing) if they already have any subscription.
     */
    public function startTrialFor(User $user): ?Subscription
    {
        if (Subscription::where('user_id', $user->id)->exists()) {
            return null;
        }

        $plan = Plan::where('slug', self::PLAN_SLUG)->first();
        if (! $plan) {
            Log::warning('trial.start.no_plan', ['slug' => self::PLAN_SLUG]);
            return null;
        }

        $subscription = Subscription::create([
            'user_id'        => $user->id,
            'plan_id'        => $plan->id,
            'transaction_id' => null,
            'amount'         => 0,
            'status'         => 'trial',
            'start_date'     => now(),
            'expiry_date'    => now()->addDays(self::DURATION_DAYS),
        ]);

        // SmsBalanceService reads limits off the plan relation.
        $subscription->setRelation('plan', $plan);
        $this->smsBalance->activate($subscription);

        Log::info('trial.started', [
            'user_id'         => $user->id,
            'subscription_id' => $subscription->id,
            'expires_at'      => $subscription->expiry_date->toIso8601String(),
        ]);

        return $subscription;
    }
}
