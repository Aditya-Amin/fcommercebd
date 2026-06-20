<?php

namespace App\Services\Facebook;

use App\Exceptions\FacebookException;
use Composer\CaBundle\CaBundle;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Psr\Http\Message\ResponseInterface;

/**
 * Thin wrapper around the Facebook Graph API.
 *
 * Responsibilities:
 *   - Build the OAuth dialog URL
 *   - Exchange code → short-lived → long-lived user access token
 *   - List the user's pages and their per-page access tokens
 *   - Publish text / photo / link posts to a page
 *   - Map Graph errors into a typed FacebookException
 *
 * It does NOT touch the database — persistence belongs in the controller.
 */
class FacebookGraphService
{
    private Client $http;
    private string $appId;
    private string $appSecret;
    private string $graphUrl;
    private string $oauthUrl;
    private string $version;
    private string $redirectUri;

    public function __construct(?Client $http = null)
    {
        $this->appId       = (string) config('facebook.app_id');
        $this->appSecret   = (string) config('facebook.app_secret');
        $this->graphUrl    = rtrim((string) config('facebook.graph_url'), '/');
        $this->oauthUrl    = rtrim((string) config('facebook.oauth_url'), '/');
        $this->version     = (string) config('facebook.graph_version');
        $this->redirectUri = (string) config('facebook.redirect_uri');

        // Resolve a CA bundle for HTTPS verification. On Windows PHP installs
        // curl.cainfo is often unset, making Guzzle's call to graph.facebook.com
        // fail with "cURL error 60". We try in order:
        //   1. SSL_CA_BUNDLE env var (explicit override)
        //   2. Composer-bundled CA bundle (when composer/ca-bundle is installed)
        //   3. PHP/system default (Guzzle's verify=true) — works on Linux/macOS
        $caCandidate = env('SSL_CA_BUNDLE');
        if (! $caCandidate && class_exists(CaBundle::class)) {
            $caCandidate = CaBundle::getBundledCaBundlePath();
        }

        $this->http = $http ?? new Client([
            'timeout'         => 20,
            'connect_timeout' => 5,
            'http_errors'     => false,
            'verify'          => $caCandidate ?: true,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OAuth
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Build the dialog URL the browser should be redirected to.
     */
    public function buildAuthorizeUrl(string $state): string
    {
        $scopes = implode(',', (array) config('facebook.scopes'));

        return $this->oauthUrl
            . '/' . $this->version
            . '/dialog/oauth?'
            . http_build_query([
                'client_id'     => $this->appId,
                'redirect_uri'  => $this->redirectUri,
                'state'         => $state,
                'scope'         => $scopes,
                'response_type' => 'code',
                'auth_type'     => 'rerequest',
            ]);
    }

    /**
     * Exchange the OAuth `code` for a short-lived user access token.
     *
     * @return array{access_token: string, token_type: string, expires_in?: int}
     */
    public function exchangeCodeForToken(string $code): array
    {
        $response = $this->http->get($this->endpoint('/oauth/access_token'), [
            'query' => [
                'client_id'     => $this->appId,
                'client_secret' => $this->appSecret,
                'redirect_uri'  => $this->redirectUri,
                'code'          => $code,
            ],
        ]);

        return $this->decode($response, 'oauth.exchange_code');
    }

    /**
     * Trade a short-lived user token for a long-lived (~60 day) user token.
     *
     * @return array{access_token: string, token_type: string, expires_in: int}
     */
    public function exchangeForLongLivedToken(string $shortLivedToken): array
    {
        $response = $this->http->get($this->endpoint('/oauth/access_token'), [
            'query' => [
                'grant_type'        => 'fb_exchange_token',
                'client_id'         => $this->appId,
                'client_secret'     => $this->appSecret,
                'fb_exchange_token' => $shortLivedToken,
            ],
        ]);

        return $this->decode($response, 'oauth.long_lived');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pages
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * List the pages this user manages, including the per-page access token.
     *
     * @return array<int, array{id:string,name:string,access_token:string,category?:string,tasks?:array<int,string>,picture?:array}>
     */
    public function getUserPages(string $userAccessToken): array
    {
        $response = $this->http->get($this->endpoint('/me/accounts'), [
            'query' => [
                'access_token' => $userAccessToken,
                'fields'       => 'id,name,category,tasks,access_token,picture{url},fan_count',
                'limit'        => 100,
            ],
        ]);

        $body = $this->decode($response, 'pages.list');
        return $body['data'] ?? [];
    }

    /**
     * Verify a token by hitting /me — used to detect revocation early.
     */
    public function verifyToken(string $accessToken): array
    {
        $response = $this->http->get($this->endpoint('/me'), [
            'query' => [
                'access_token' => $accessToken,
                'fields'       => 'id,name',
            ],
        ]);

        return $this->decode($response, 'token.verify');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Publishing
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /{page-id}/feed — text-only post.
     *
     * @return array{id:string, post_id?:string}
     */
    public function publishText(string $pageId, string $pageAccessToken, string $message): array
    {
        $response = $this->http->post($this->endpoint("/{$pageId}/feed"), [
            'form_params' => [
                'message'      => $message,
                'access_token' => $pageAccessToken,
            ],
        ]);

        return $this->decode($response, 'publish.text');
    }

    /**
     * POST /{page-id}/feed — link post (Graph builds preview from OG tags).
     *
     * @return array{id:string, post_id?:string}
     */
    public function publishLink(string $pageId, string $pageAccessToken, string $linkUrl, ?string $message = null): array
    {
        $form = [
            'link'         => $linkUrl,
            'access_token' => $pageAccessToken,
        ];
        if ($message !== null && $message !== '') {
            $form['message'] = $message;
        }

        $response = $this->http->post($this->endpoint("/{$pageId}/feed"), [
            'form_params' => $form,
        ]);

        return $this->decode($response, 'publish.link');
    }

    /**
     * POST /{page-id}/photos — single photo with caption.
     * Pass `published=true` to post immediately, or use uploadPhotoUnpublished()
     * for multi-photo posts.
     *
     * @return array{id:string, post_id?:string}
     */
    public function publishPhoto(string $pageId, string $pageAccessToken, string $imageUrl, ?string $caption = null): array
    {
        $form = [
            'url'          => $imageUrl,
            'published'    => 'true',
            'access_token' => $pageAccessToken,
        ];
        if ($caption !== null && $caption !== '') {
            $form['caption'] = $caption;
        }

        $response = $this->http->post($this->endpoint("/{$pageId}/photos"), [
            'form_params' => $form,
        ]);

        return $this->decode($response, 'publish.photo');
    }

    /**
     * Like publishPhoto(), but uploads the raw image bytes (multipart `source`)
     * instead of giving Facebook a URL to fetch. Use this when the image lives
     * on a host Facebook can't reach (e.g. localhost in dev, or a private box).
     *
     * @return array{id:string, post_id?:string}
     */
    public function publishPhotoBinary(string $pageId, string $pageAccessToken, string $filePath, ?string $caption = null): array
    {
        $multipart = [
            ['name' => 'access_token', 'contents' => $pageAccessToken],
            ['name' => 'published',    'contents' => 'true'],
            ['name' => 'source',       'contents' => fopen($filePath, 'r'), 'filename' => basename($filePath)],
        ];
        if ($caption !== null && $caption !== '') {
            $multipart[] = ['name' => 'caption', 'contents' => $caption];
        }

        $response = $this->http->post($this->endpoint("/{$pageId}/photos"), [
            'multipart' => $multipart,
        ]);

        return $this->decode($response, 'publish.photo_binary');
    }

    /**
     * Upload a photo without publishing. Returns the photo `id` to attach to a feed post.
     *
     * @return array{id:string}
     */
    public function uploadPhotoUnpublished(string $pageId, string $pageAccessToken, string $imageUrl): array
    {
        $response = $this->http->post($this->endpoint("/{$pageId}/photos"), [
            'form_params' => [
                'url'          => $imageUrl,
                'published'    => 'false',
                'access_token' => $pageAccessToken,
            ],
        ]);

        return $this->decode($response, 'publish.photo_unpublished');
    }

    /**
     * Binary variant of uploadPhotoUnpublished() — uploads raw bytes for
     * multi-photo posts whose images aren't on a Facebook-reachable URL.
     *
     * @return array{id:string}
     */
    public function uploadPhotoUnpublishedBinary(string $pageId, string $pageAccessToken, string $filePath): array
    {
        $response = $this->http->post($this->endpoint("/{$pageId}/photos"), [
            'multipart' => [
                ['name' => 'access_token', 'contents' => $pageAccessToken],
                ['name' => 'published',    'contents' => 'false'],
                ['name' => 'source',       'contents' => fopen($filePath, 'r'), 'filename' => basename($filePath)],
            ],
        ]);

        return $this->decode($response, 'publish.photo_unpublished_binary');
    }

    /**
     * Multi-photo feed post. `mediaIds` come from uploadPhotoUnpublished().
     *
     * @param  array<int,string>  $mediaIds
     * @return array{id:string, post_id?:string}
     */
    public function publishMultiPhoto(string $pageId, string $pageAccessToken, array $mediaIds, ?string $message = null): array
    {
        $form = [
            'access_token' => $pageAccessToken,
        ];
        if ($message !== null && $message !== '') {
            $form['message'] = $message;
        }
        foreach (array_values($mediaIds) as $i => $id) {
            $form["attached_media[{$i}]"] = json_encode(['media_fbid' => $id]);
        }

        $response = $this->http->post($this->endpoint("/{$pageId}/feed"), [
            'form_params' => $form,
        ]);

        return $this->decode($response, 'publish.multi_photo');
    }

    /**
     * Fetch the canonical permalink for a published post.
     */
    public function getPostPermalink(string $fbPostId, string $pageAccessToken): ?string
    {
        $response = $this->http->get($this->endpoint("/{$fbPostId}"), [
            'query' => [
                'fields'       => 'permalink_url',
                'access_token' => $pageAccessToken,
            ],
        ]);

        try {
            $body = $this->decode($response, 'post.permalink');
            return $body['permalink_url'] ?? null;
        } catch (FacebookException) {
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internals
    // ─────────────────────────────────────────────────────────────────────────

    private function endpoint(string $path): string
    {
        return $this->graphUrl . '/' . $this->version . '/' . ltrim($path, '/');
    }

    /**
     * @throws FacebookException
     */
    private function decode(ResponseInterface $response, string $context): array
    {
        $status = $response->getStatusCode();
        $raw    = (string) $response->getBody();
        $body   = json_decode($raw, true) ?: [];

        $this->log($context, $status, $body);

        if ($status >= 400 || isset($body['error'])) {
            throw FacebookException::fromGraphResponse($body, $status);
        }
        return $body;
    }

    private function log(string $context, int $status, array $body): void
    {
        // Strip secrets before logging.
        $scrub = function ($value) use (&$scrub) {
            if (is_array($value)) {
                $out = [];
                foreach ($value as $k => $v) {
                    if (in_array(strtolower((string) $k), ['access_token', 'client_secret', 'fb_exchange_token'], true)) {
                        $out[$k] = '***';
                    } else {
                        $out[$k] = $scrub($v);
                    }
                }
                return $out;
            }
            return $value;
        };

        Log::channel(config('logging.channels.facebook') ? 'facebook' : 'stack')
           ->info('fb.' . $context, [
               'status' => $status,
               'body'   => $scrub($body),
           ]);
    }

    /**
     * Convenience: short, readable random state token for the OAuth dance.
     */
    public static function freshState(): string
    {
        return Str::random(40);
    }

    /**
     * Wrap any Guzzle network failures so callers see a single exception type.
     *
     * @template T
     * @param  callable(): T  $fn
     * @return T
     */
    public function trap(callable $fn)
    {
        try {
            return $fn();
        } catch (ConnectException | RequestException $e) {
            throw new FacebookException(
                message:    'Network error talking to Facebook: ' . $e->getMessage(),
                statusCode: 0,
                previous:   $e,
            );
        }
    }
}
