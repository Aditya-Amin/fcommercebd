<?php

namespace App\Jobs;

use App\Exceptions\FacebookException;
use App\Models\FacebookPost;
use App\Services\Facebook\FacebookGraphService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Publishes one FacebookPost row to Facebook via the Graph API.
 *
 * Lifecycle written to the row:
 *   queued|scheduled  →  publishing  →  published | failed
 *
 * Retries:
 *   - up to 5 attempts on transient errors (5xx, code 1, code 2)
 *   - rate-limit hits (4, 17, 32, 613) reschedule for `min_gap_seconds * 2` later
 *   - auth errors (190, 102, 200, 459, 463) mark the page inactive and stop retrying
 */
class PublishToFacebookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $maxExceptions = 5;
    public int $backoff = 60; // seconds; doubled per attempt

    public function __construct(public readonly int $postId) {}

    /** Exponential backoff: 60s, 120s, 240s, 480s, 960s */
    public function backoff(): array
    {
        return [60, 120, 240, 480, 960];
    }

    public function handle(FacebookGraphService $graph): void
    {
        $post = FacebookPost::with('page')->find($this->postId);
        if (! $post) {
            Log::warning('fb.publish.missing_post', ['post_id' => $this->postId]);
            return;
        }

        // Idempotency: someone else may have already pushed this row.
        if (in_array($post->status, [FacebookPost::STATUS_PUBLISHED, FacebookPost::STATUS_CANCELLED, FacebookPost::STATUS_REJECTED], true)) {
            return;
        }

        $page = $post->page;
        if (! $page || ! $page->is_active) {
            $this->fail($post, 'page_inactive', 'The connected Facebook page is no longer active.');
            return;
        }

        $post->forceFill([
            'status'   => FacebookPost::STATUS_PUBLISHING,
            'attempts' => $post->attempts + 1,
        ])->save();

        try {
            $result = match ($post->type) {
                FacebookPost::TYPE_PHOTO       => $graph->publishPhoto($page->page_id, $page->access_token, (string) $post->image_url, $post->message),
                FacebookPost::TYPE_LINK        => $graph->publishLink($page->page_id, $page->access_token, (string) $post->link_url, $post->message),
                FacebookPost::TYPE_MULTI_PHOTO => $this->publishMulti($graph, $post),
                default                        => $graph->publishText($page->page_id, $page->access_token, (string) $post->message),
            };

            $fbPostId  = $result['post_id'] ?? $result['id'] ?? null;
            $permalink = $fbPostId ? $graph->getPostPermalink($fbPostId, $page->access_token) : null;

            $post->forceFill([
                'status'        => FacebookPost::STATUS_PUBLISHED,
                'fb_post_id'    => $fbPostId,
                'fb_permalink'  => $permalink,
                'published_at'  => now(),
                'error_code'    => null,
                'error_message' => null,
            ])->save();

            Log::channel('facebook')->info('fb.publish.success', [
                'post_id'     => $post->id,
                'fb_post_id'  => $fbPostId,
                'page_id'     => $page->page_id,
            ]);
        } catch (FacebookException $e) {
            $this->handleGraphError($post, $e);
        } catch (Throwable $e) {
            Log::channel('facebook')->error('fb.publish.unexpected', [
                'post_id' => $post->id,
                'error'   => $e->getMessage(),
            ]);
            $this->fail($post, 'unexpected', $e->getMessage());
            throw $e;
        }
    }

    private function publishMulti(FacebookGraphService $graph, FacebookPost $post): array
    {
        $mediaIds = [];
        foreach ((array) $post->image_urls as $url) {
            if (! is_string($url) || $url === '') continue;
            $upload     = $graph->uploadPhotoUnpublished($post->page->page_id, $post->page->access_token, $url);
            $mediaIds[] = $upload['id'];
        }
        if (empty($mediaIds)) {
            throw new FacebookException('No images supplied for multi-photo post.');
        }
        return $graph->publishMultiPhoto($post->page->page_id, $post->page->access_token, $mediaIds, $post->message);
    }

    private function handleGraphError(FacebookPost $post, FacebookException $e): void
    {
        $post->error_code    = $e->fbCode;
        $post->error_message = $e->getMessage();

        if ($e->isAuthError()) {
            // Token revoked / permissions removed — disable the page so user re-connects.
            $post->page->update(['is_active' => false]);
            $this->fail($post, $e->fbCode, $e->getMessage(), markRejected: true);
            return;
        }

        if ($e->isRateLimited()) {
            // Push out beyond the configured min-gap and let the queue re-run.
            $delay = max(600, (int) config('facebook.rate_limit.min_gap_seconds') * 2);
            $post->update(['status' => FacebookPost::STATUS_QUEUED]);
            Log::channel('facebook')->warning('fb.publish.rate_limited', [
                'post_id'      => $post->id,
                'delay_secs'   => $delay,
                'fb_code'      => $e->fbCode,
            ]);
            $this->release($delay);
            return;
        }

        if ($e->isTransient() && $this->attempts() < $this->tries) {
            $post->update(['status' => FacebookPost::STATUS_QUEUED]);
            throw $e; // Laravel will retry per the backoff() schedule
        }

        $this->fail($post, $e->fbCode, $e->getMessage());
    }

    private function fail(FacebookPost $post, ?string $code, string $message, bool $markRejected = false): void
    {
        $post->forceFill([
            'status'        => $markRejected ? FacebookPost::STATUS_REJECTED : FacebookPost::STATUS_FAILED,
            'error_code'    => $code,
            'error_message' => $message,
        ])->save();

        Log::channel('facebook')->error('fb.publish.failed', [
            'post_id' => $post->id,
            'code'    => $code,
            'message' => $message,
        ]);
    }

    /** Called automatically when retries are exhausted. */
    public function failed(Throwable $exception): void
    {
        $post = FacebookPost::find($this->postId);
        if ($post && $post->status !== FacebookPost::STATUS_PUBLISHED) {
            $this->fail($post, 'retries_exhausted', $exception->getMessage());
        }
    }
}
