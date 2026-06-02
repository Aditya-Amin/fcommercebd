<?php

namespace App\Services\Facebook;

use App\Models\FacebookPage;
use App\Models\FacebookPost;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Enforces conservative per-page posting limits.
 *
 *   - max_posts_per_day  : count in the rolling 24h
 *   - max_posts_per_hour : count in the rolling 60min (Meta spam safety)
 *   - min_gap_seconds    : minimum spacing between any two posts on the same page
 *
 * The numbers come from config/facebook.php. They are intentionally well
 * below Facebook's unpublished thresholds so a busy day never trips Graph
 * throttling or page-flagging heuristics. There is also a hardcoded
 * `MIN_GAP_FLOOR_SECONDS` so a misconfigured env can't bypass safety.
 */
class PostingRateLimiter
{
    /** Hardcoded safety floor — even if env says lower, we use this. */
    private const MIN_GAP_FLOOR_SECONDS = 120;

    public function __construct(
        private readonly int $maxPerDay,
        private readonly int $maxPerHour,
        private readonly int $minGapSeconds,
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            maxPerDay:     (int) config('facebook.rate_limit.max_posts_per_day', 25),
            maxPerHour:    (int) config('facebook.rate_limit.max_posts_per_hour', 6),
            minGapSeconds: max(
                self::MIN_GAP_FLOOR_SECONDS,
                (int) config('facebook.rate_limit.min_gap_seconds', 300)
            ),
        );
    }

    /**
     * Returns null if the post can be sent right now, otherwise the EARLIEST
     * allowed CarbonImmutable across all three constraints (gap + hour + day).
     *
     * Counts both already-published posts AND posts queued/scheduled in the
     * lookback window, so users can't queue past the cap.
     */
    public function nextAllowedAt(FacebookPage $page, ?CarbonImmutable $intendedAt = null): ?CarbonImmutable
    {
        $now = $intendedAt ?? CarbonImmutable::now();

        $gap   = $this->gapConstraint($page, $now);
        $hour  = $this->bucketConstraint($page, $now, hours: 1, max: $this->maxPerHour);
        $day   = $this->bucketConstraint($page, $now, hours: 24, max: $this->maxPerDay);

        $candidates = array_filter([$gap, $hour, $day]);
        if (empty($candidates)) return null;

        // Return the LATEST blocking time so the caller waits long enough
        // to satisfy every constraint at once.
        usort($candidates, fn ($a, $b) => $a->gt($b) ? -1 : 1);
        return $candidates[0];
    }

    /**
     * Min-gap check — uses COALESCE so we pick the truly latest reference
     * timestamp regardless of which lifecycle field is populated. Without
     * this, MySQL puts NULL `published_at` rows FIRST under DESC, making the
     * limiter pick a stale queued row's `created_at` and undercounting.
     */
    private function gapConstraint(FacebookPage $page, CarbonImmutable $now): ?CarbonImmutable
    {
        $latestTs = FacebookPost::query()
            ->where('facebook_page_id', $page->id)
            ->whereIn('status', [
                FacebookPost::STATUS_PUBLISHED,
                FacebookPost::STATUS_SCHEDULED,
                FacebookPost::STATUS_PUBLISHING,
                FacebookPost::STATUS_QUEUED,
            ])
            ->select(DB::raw('MAX(COALESCE(published_at, scheduled_at, created_at)) AS effective_ts'))
            ->value('effective_ts');

        if (! $latestTs) return null;

        $earliestNext = CarbonImmutable::parse($latestTs)->addSeconds($this->minGapSeconds);
        return $now->lt($earliestNext) ? $earliestNext : null;
    }

    /**
     * Rolling-bucket check — counts posts in [now - $hours, now]. If the count
     * has hit $max, returns when the OLDEST post in the bucket exits the
     * window (so caller knows when one slot frees up).
     */
    private function bucketConstraint(
        FacebookPage $page,
        CarbonImmutable $now,
        int $hours,
        int $max,
    ): ?CarbonImmutable {
        $windowStart = $now->subHours($hours);

        $rows = FacebookPost::query()
            ->where('facebook_page_id', $page->id)
            ->whereIn('status', [
                FacebookPost::STATUS_PUBLISHED,
                FacebookPost::STATUS_SCHEDULED,
                FacebookPost::STATUS_PUBLISHING,
                FacebookPost::STATUS_QUEUED,
            ])
            ->select(DB::raw('COALESCE(published_at, scheduled_at, created_at) AS effective_ts'))
            ->orderBy('effective_ts')
            ->get()
            ->pluck('effective_ts')
            ->map(fn ($ts) => CarbonImmutable::parse($ts))
            ->filter(fn (CarbonImmutable $ts) => $ts->gte($windowStart) && $ts->lte($now))
            ->values();

        if ($rows->count() < $max) return null;

        // The (count-max+1)th oldest entry leaving the window frees the slot
        // we need. With max=6 and 6 entries already in the bucket, the OLDEST
        // (index 0) leaving frees one slot.
        $blockingTs = $rows->first();
        return $blockingTs->addHours($hours);
    }

    public function maxPerDay(): int
    {
        return $this->maxPerDay;
    }

    public function maxPerHour(): int
    {
        return $this->maxPerHour;
    }

    public function minGapSeconds(): int
    {
        return $this->minGapSeconds;
    }
}
