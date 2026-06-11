<?php

namespace App\Services\Plans;

use App\Models\AiGeneration;
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
    /**
     * Resolve the user's effective plan: the plan of their active subscription
     * (paid OR trial). Returns null when there's no active subscription — i.e.
     * the trial/plan expired — which means every quota resolves to 0 (locked).
     *
     * NOTE: there is intentionally NO "default Starter" fallback. A user only
     * gets quota while they hold an active or trial subscription; once it
     * expires, features lock until an admin or a payment activates a new one.
     */
    public function planFor(User $user): ?Plan
    {
        $sub = $this->activeSubscription($user);
        if ($sub && $sub->plan) return $sub->plan;
        return null;
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
        // Admin per-user override wins over the plan default (raise or lower a
        // single customer's cap from the user-activity screen).
        if ($user->fb_posts_limit_override !== null) {
            return (int) $user->fb_posts_limit_override;
        }

        $plan = $this->planFor($user);
        return (int) ($plan?->limit('fbPosts') ?? 0);
    }

    /**
     * Lower bound for counting usage in the current period. Normally the period
     * start, but an admin "reset" (fb_posts_reset_at) pushes it forward so prior
     * posts no longer count — giving the customer a fresh allowance without
     * deleting their post history.
     */
    private function usageSince(User $user, CarbonImmutable $periodStart): CarbonImmutable
    {
        $resetAt = $user->fb_posts_reset_at;
        if ($resetAt && CarbonImmutable::parse($resetAt)->greaterThan($periodStart)) {
            return CarbonImmutable::parse($resetAt);
        }
        return $periodStart;
    }

    /**
     * Posts the user has submitted in the current period that count toward
     * the quota: anything they intentionally created (queued, scheduled,
     * publishing, published). Cancelled/rejected/failed posts don't count.
     */
    public function fbPostsUsed(User $user): int
    {
        $period = $this->currentPeriod($user);
        $start  = $this->usageSince($user, $period['start']);

        return FacebookPost::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [
                FacebookPost::STATUS_QUEUED,
                FacebookPost::STATUS_SCHEDULED,
                FacebookPost::STATUS_PUBLISHING,
                FacebookPost::STATUS_PUBLISHED,
            ])
            ->whereBetween('created_at', [$start, $period['end']])
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

    // ─────────────────────────────────────────────────────────────────────────
    // AI generations
    // ─────────────────────────────────────────────────────────────────────────

    public function aiGenerationsLimit(User $user): int
    {
        if ($user->ai_generations_limit_override !== null) {
            return (int) $user->ai_generations_limit_override;
        }

        $plan = $this->planFor($user);
        return (int) ($plan?->limit('aiGenerations') ?? 0);
    }

    public function aiGenerationsUsed(User $user): int
    {
        $period = $this->currentPeriod($user);

        $start = $period['start'];
        $resetAt = $user->ai_generations_reset_at;
        if ($resetAt && CarbonImmutable::parse($resetAt)->greaterThan($start)) {
            $start = CarbonImmutable::parse($resetAt);
        }

        return AiGeneration::query()
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$start, $period['end']])
            ->count();
    }

    public function canGenerate(User $user): bool
    {
        $limit = $this->aiGenerationsLimit($user);
        if ($limit <= 0) return false; // 0 = feature locked
        return $this->aiGenerationsUsed($user) < $limit;
    }

    /**
     * @return array{limit:int, used:int, remaining:int, resetsAt:string, locked:bool}
     */
    public function aiGenerationsStatus(User $user): array
    {
        $limit  = $this->aiGenerationsLimit($user);
        $used   = $this->aiGenerationsUsed($user);
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
