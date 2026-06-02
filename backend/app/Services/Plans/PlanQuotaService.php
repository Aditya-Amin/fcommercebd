<?php

namespace App\Services\Plans;

use App\Models\FacebookPost;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * Quota lookups + period accounting for plan-gated resources.
 *
 * The "current period" is defined as:
 *   1. The active subscription's [start_date, expiry_date) window, if any.
 *   2. Otherwise the calendar month (start of month → start of next month).
 *
 * Counts use the SAME table the resource lives in (e.g. facebook_posts) so
 * it stays in sync without a separate counter to keep accurate.
 */
class PlanQuotaService
{
    public function __construct(private readonly ?Plan $defaultPlan = null) {}

    /**
     * Resolve the user's effective plan: latest active subscription's plan,
     * else the default Starter plan as fallback.
     */
    public function planFor(User $user): ?Plan
    {
        $sub = $this->activeSubscription($user);
        if ($sub && $sub->plan) return $sub->plan;
        return $this->defaultPlan ?? Plan::where('slug', 'starter')->first();
    }

    public function activeSubscription(User $user): ?Subscription
    {
        return Subscription::query()
            ->where('user_id', $user->id)
            ->active()
            ->latest()
            ->first();
    }

    /** @return array{start: CarbonImmutable, end: CarbonImmutable} */
    public function currentPeriod(User $user): array
    {
        $sub = $this->activeSubscription($user);
        if ($sub && $sub->start_date) {
            return [
                'start' => CarbonImmutable::parse($sub->start_date),
                'end'   => $sub->expiry_date
                    ? CarbonImmutable::parse($sub->expiry_date)
                    : CarbonImmutable::parse($sub->start_date)->addDays((int) ($sub->plan->duration_days ?? 30)),
            ];
        }

        $now = CarbonImmutable::now();
        return [
            'start' => $now->startOfMonth(),
            'end'   => $now->startOfMonth()->addMonth(),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Facebook posts
    // ─────────────────────────────────────────────────────────────────────────

    public function fbPostsLimit(User $user): int
    {
        $plan = $this->planFor($user);
        return (int) ($plan?->limit('fbPosts') ?? 0);
    }

    /**
     * Posts the user has submitted in the current period that count toward
     * the quota: anything they intentionally created (queued, scheduled,
     * publishing, published). Cancelled/rejected/failed posts don't count.
     */
    public function fbPostsUsed(User $user): int
    {
        $period = $this->currentPeriod($user);

        return FacebookPost::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [
                FacebookPost::STATUS_QUEUED,
                FacebookPost::STATUS_SCHEDULED,
                FacebookPost::STATUS_PUBLISHING,
                FacebookPost::STATUS_PUBLISHED,
            ])
            ->whereBetween('created_at', [$period['start'], $period['end']])
            ->count();
    }

    public function fbPostsRemaining(User $user): int
    {
        return max(0, $this->fbPostsLimit($user) - $this->fbPostsUsed($user));
    }

    public function canCreateFbPost(User $user): bool
    {
        $limit = $this->fbPostsLimit($user);
        if ($limit <= 0) return false; // 0 = feature locked
        return $this->fbPostsUsed($user) < $limit;
    }

    /**
     * Snapshot for API responses / UI gating.
     *
     * @return array{limit:int, used:int, remaining:int, resetsAt:string, locked:bool}
     */
    public function fbPostsStatus(User $user): array
    {
        $limit  = $this->fbPostsLimit($user);
        $used   = $this->fbPostsUsed($user);
        $period = $this->currentPeriod($user);

        return [
            'limit'     => $limit,
            'used'      => $used,
            'remaining' => max(0, $limit - $used),
            'resetsAt'  => $period['end']->toIso8601String(),
            'locked'    => $limit === 0,
        ];
    }
}
