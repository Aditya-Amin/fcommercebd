<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\FacebookException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Facebook\CreatePostRequest;
use App\Http\Resources\FacebookPageResource;
use App\Http\Resources\FacebookPostResource;
use App\Jobs\PublishToFacebookJob;
use App\Models\FacebookPage;
use App\Models\FacebookPost;
use App\Services\Facebook\ContentModerator;
use App\Services\Facebook\FacebookGraphService;
use App\Services\Facebook\PostingRateLimiter;
use App\Services\Notifications\NotificationService;
use App\Services\Plans\PlanQuotaService;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Facebook Page integration: OAuth + listing + posting.
 *
 * OAuth flow:
 *   POST /api/facebook/connect    → returns the dialog URL the SPA should redirect to
 *   GET  /api/facebook/callback   → Facebook redirects here; we exchange code → token,
 *                                    fetch the user's pages, persist them, then 302 the
 *                                    browser back to the frontend
 *
 * Posting flow:
 *   POST /api/facebook/post       → validates, moderates, rate-limits, then either
 *                                    dispatches PublishToFacebookJob (immediate) or
 *                                    schedules it via `delay` (scheduled_at).
 */
class FacebookController extends Controller
{
    public function __construct(
        private readonly FacebookGraphService $graph,
        private readonly ContentModerator $moderator,
        private readonly PlanQuotaService $quota,
        private readonly NotificationService $notifications,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Pages
    // ─────────────────────────────────────────────────────────────────────────

    /** GET /api/facebook/pages — list this user's connected Facebook pages. */
    public function pages(Request $request): JsonResponse
    {
        $pages = FacebookPage::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('is_active')
            ->orderBy('page_name')
            ->get();

        return response()->json(['data' => FacebookPageResource::collection($pages)]);
    }

    /** DELETE /api/facebook/pages/{page} — disconnect a page. */
    public function disconnect(Request $request, FacebookPage $page): JsonResponse
    {
        abort_if($page->user_id !== $request->user()->id, 403);
        $page->delete();
        return response()->json(['data' => ['disconnected' => true]]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OAuth
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/facebook/connect
     *
     * Generates an OAuth state, stashes (state → user_id) in cache for 10min,
     * and returns the dialog URL for the SPA to redirect to.
     */
    public function connect(Request $request): JsonResponse
    {
        $state = FacebookGraphService::freshState();

        Cache::put(
            "fb_oauth_state:{$state}",
            ['user_id' => $request->user()->id],
            now()->addMinutes(10)
        );

        Log::channel('facebook')->info('fb.connect.state_stored', [
            'state'        => $state,
            'state_prefix' => substr($state, 0, 8),
            'user_id'      => $request->user()->id,
            'expires_in'   => 600,
        ]);

        return response()->json([
            'data' => [
                'state' => $state,
                'url'   => $this->graph->buildAuthorizeUrl($state),
            ],
        ]);
    }

    /**
     * GET /api/facebook/callback?code=&state=
     *
     * Facebook redirects here. We exchange the code, fetch pages, persist them,
     * then 302 the browser to the frontend success/failure page.
     *
     * NOTE: this endpoint MUST be public (no `auth:sanctum` middleware) because
     * Facebook hits it directly without our session/cookie. We resolve the user
     * from the state cache entry instead.
     */
    public function callback(Request $request): RedirectResponse
    {
        // Debug breadcrumb — we want to KNOW Laravel received the callback,
        // even before we touch any of the OAuth logic.
        Log::channel('facebook')->info('fb.callback.entered', [
            'has_code'    => $request->filled('code'),
            'has_state'   => $request->filled('state'),
            'has_error'   => $request->filled('error'),
            'query_keys'  => array_keys($request->query()),
            'host'        => $request->getHost(),
        ]);

        $successUrl = (string) config('facebook.frontend_success');
        $failureUrl = (string) config('facebook.frontend_failure');

        // Did the user cancel / deny?
        if ($request->filled('error')) {
            $reason = $request->input('error_reason') ?? $request->input('error');
            Log::channel('facebook')->warning('fb.oauth.user_denied', ['reason' => $reason]);
            return redirect()->to($failureUrl . '&reason=' . urlencode((string) $reason));
        }

        $code  = (string) $request->query('code', '');
        $state = (string) $request->query('state', '');

        if ($code === '' || $state === '') {
            return redirect()->to($failureUrl . '&reason=missing_params');
        }

        $cacheKey = "fb_oauth_state:{$state}";
        $stash    = Cache::pull($cacheKey);

        Log::channel('facebook')->info('fb.callback.state_lookup', [
            'state'        => $state,
            'state_prefix' => substr($state, 0, 8),
            'cache_hit'    => $stash !== null,
            'has_user_id'  => $stash && !empty($stash['user_id']),
        ]);

        if (! $stash || empty($stash['user_id'])) {
            return redirect()->to($failureUrl . '&reason=invalid_state');
        }

        try {
            $short = $this->graph->exchangeCodeForToken($code);
            $long  = $this->graph->exchangeForLongLivedToken($short['access_token']);

            $pages = $this->graph->getUserPages($long['access_token']);

            if (empty($pages)) {
                return redirect()->to($failureUrl . '&reason=no_pages');
            }

            DB::transaction(function () use ($stash, $long, $pages) {
                foreach ($pages as $p) {
                    if (empty($p['access_token']) || empty($p['id'])) continue;

                    FacebookPage::updateOrCreate(
                        [
                            'user_id' => $stash['user_id'],
                            'page_id' => (string) $p['id'],
                        ],
                        [
                            'page_name'        => (string) ($p['name'] ?? ''),
                            'category'         => $p['category'] ?? null,
                            'picture_url'      => $p['picture']['data']['url'] ?? null,
                            'fan_count'        => $p['fan_count'] ?? null,
                            'access_token'     => $p['access_token'],
                            'user_access_token'=> $long['access_token'],
                            // Page tokens derived from a long-lived user token are typically
                            // long-lived and don't expire — we still record the user-token expiry
                            // so we can warn the user when it's time to re-auth.
                            'token_expiry'     => isset($long['expires_in'])
                                ? Carbon::now()->addSeconds((int) $long['expires_in'])
                                : null,
                            'permissions'      => $p['tasks'] ?? [],
                            'is_active'        => true,
                            'last_synced_at'   => now(),
                        ]
                    );
                }
            });

            return redirect()->to($successUrl);
        } catch (FacebookException $e) {
            Log::channel('facebook')->error('fb.oauth.failed', [
                'message' => $e->getMessage(),
                'code'    => $e->fbCode,
            ]);
            return redirect()->to($failureUrl . '&reason=oauth_failed');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Posting
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/facebook/post
     *
     * Body:
     *   facebook_page_id : ID of a connected page (must belong to user)
     *   product_id?      : Product reference (optional, for analytics)
     *   type             : text | photo | link | multi_photo
     *   message?         : caption
     *   link_url?        : (link)
     *   image_url?       : (photo)
     *   image_urls?      : (multi_photo, max 10)
     *   hashtags?        : appended to message
     *   scheduled_at?    : ISO 8601 (future) — if omitted, posts immediately
     */
    public function post(CreatePostRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $page = FacebookPage::query()
            ->where('id', $data['facebook_page_id'])
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (! $page) {
            return response()->json(['message' => 'Facebook page not found or disconnected.'], 404);
        }

        // ── Plan-level monthly quota (hard cap based on subscription) ──
        // This runs BEFORE per-page rate limiting so users see the upgrade
        // prompt rather than a "wait 5 minutes" message when they're out.
        $quotaStatus = $this->quota->fbPostsStatus($user);

        if ($quotaStatus['locked']) {
            return response()->json([
                'message' => 'Facebook posting is not available on your current plan.',
                'reason'  => 'plan_feature_locked',
                'quota'   => $quotaStatus,
            ], 403);
        }

        if ($quotaStatus['remaining'] <= 0) {
            // Notify once when they hit the cap so the bell rings.
            $this->notifications->notify(
                user:      $user,
                type:      \App\Models\Notification::TYPE_PLAN_LIMIT,
                title:     'Monthly Facebook post limit reached',
                message:   "You've used all {$quotaStatus['limit']} Facebook posts for this billing period. Upgrade for more.",
                data:      ['feature' => 'fbPosts', 'limit' => $quotaStatus['limit']],
                actionUrl: '/settings',
                icon:      'sparkles',
                priority:  \App\Models\Notification::PRIORITY_NORMAL,
            );

            return response()->json([
                'message' => "Monthly Facebook post limit reached ({$quotaStatus['used']}/{$quotaStatus['limit']}).",
                'reason'  => 'plan_limit_reached',
                'quota'   => $quotaStatus,
            ], 429);
        }

        // Build the final message: caption + hashtag block.
        $message = $this->composeMessage($data['message'] ?? null, $data['hashtags'] ?? []);

        // Content moderation.
        $textViolations  = $this->moderator->checkText($message);
        $imageViolations = match ($data['type']) {
            'photo'       => $this->moderator->checkImages([['url' => $data['image_url']]]),
            'multi_photo' => $this->moderator->checkImages(array_map(fn ($u) => ['url' => $u], $data['image_urls'])),
            default       => [],
        };
        $violations = array_merge($textViolations, $imageViolations);

        if (! empty($violations)) {
            return response()->json([
                'message'    => 'Post rejected by content moderation.',
                'violations' => $violations,
            ], 422);
        }

        // Rate limiting.
        $rateLimiter = PostingRateLimiter::fromConfig();
        $intendedAt  = isset($data['scheduled_at'])
            ? CarbonImmutable::parse($data['scheduled_at'])
            : CarbonImmutable::now();

        if ($earliest = $rateLimiter->nextAllowedAt($page, $intendedAt)) {
            return response()->json([
                'message'         => 'Posting too soon — minimum gap or hourly/daily cap not met.',
                'reason'          => 'rate_limited',
                'next_allowed_at' => $earliest->toIso8601String(),
                'max_per_hour'    => $rateLimiter->maxPerHour(),
                'max_per_day'     => $rateLimiter->maxPerDay(),
                'min_gap_seconds' => $rateLimiter->minGapSeconds(),
            ], 429);
        }

        // Persist the post row.
        $post = FacebookPost::create([
            'user_id'          => $user->id,
            'facebook_page_id' => $page->id,
            'product_id'       => $data['product_id'] ?? null,
            'type'             => $data['type'],
            'message'          => $message,
            'link_url'         => $data['link_url'] ?? null,
            'image_url'        => $data['image_url'] ?? null,
            'image_urls'       => $data['image_urls'] ?? null,
            'hashtags'         => $data['hashtags'] ?? [],
            'status'           => isset($data['scheduled_at'])
                ? FacebookPost::STATUS_SCHEDULED
                : FacebookPost::STATUS_QUEUED,
            'scheduled_at'     => $data['scheduled_at'] ?? null,
        ]);

        // Dispatch immediately or with delay.
        $job = new PublishToFacebookJob($post->id);
        if (isset($data['scheduled_at'])) {
            dispatch($job)->delay(CarbonImmutable::parse($data['scheduled_at']));
        } else {
            dispatch($job);
        }

        return response()->json([
            'data' => new FacebookPostResource($post),
        ], 202);
    }

    /**
     * GET /api/facebook/quota — current period usage + limit for FB posts.
     *
     * SPA polls this on /ai-generate to show the meter and disable the
     * publish button when remaining = 0.
     */
    public function quota(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->quota->fbPostsStatus($request->user()),
        ]);
    }

    /** GET /api/facebook/posts — recent posts for the current user. */
    public function posts(Request $request): JsonResponse
    {
        $posts = FacebookPost::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => FacebookPostResource::collection($posts),
        ]);
    }

    /** DELETE /api/facebook/posts/{post} — cancel a queued/scheduled post. */
    public function cancelPost(Request $request, FacebookPost $post): JsonResponse
    {
        abort_if($post->user_id !== $request->user()->id, 403);

        if (! in_array($post->status, [FacebookPost::STATUS_QUEUED, FacebookPost::STATUS_SCHEDULED], true)) {
            return response()->json(['message' => 'Only queued or scheduled posts can be cancelled.'], 422);
        }

        $post->update(['status' => FacebookPost::STATUS_CANCELLED]);
        return response()->json(['data' => new FacebookPostResource($post)]);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function composeMessage(?string $caption, array $hashtags): string
    {
        $caption = trim((string) $caption);
        $tags    = array_values(array_filter(array_map(
            fn ($t) => Str::startsWith($t, '#') ? $t : '#' . preg_replace('/\s+/', '', (string) $t),
            $hashtags
        )));

        if ($caption === '' && empty($tags)) return '';
        if (empty($tags)) return $caption;
        return $caption === '' ? implode(' ', $tags) : $caption . "\n\n" . implode(' ', $tags);
    }
}
