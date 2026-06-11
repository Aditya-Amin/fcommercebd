<?php

namespace App\Services\Ai;

use App\Exceptions\AiUnavailableException;
use App\Models\Product;
use App\Models\Setting;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

/**
 * Generates a Facebook-ready post (caption + hashtags) from a product.
 *
 * Three providers, configured via FACEBOOK / AI_* env vars:
 *
 *   - "stub"      : deterministic local generator (default; works without an API key)
 *   - "anthropic" : calls Claude via the official Messages API
 *   - "openai"    : calls OpenAI Chat Completions
 *
 * The output is the same shape regardless of provider so the caller does not
 * need a switch statement.
 */
class AiPostGenerator
{
    public function __construct(private readonly ?Client $http = null) {}

    /**
     * @param  array{tone?:string, language?:string, includeHashtags?:bool}  $options
     * @return array{caption:string, hashtags:list<string>}
     */
    public function generateForProduct(Product $product, array $options = []): array
    {
        $tone     = $options['tone']     ?? 'friendly';
        $language = $options['language'] ?? 'en';
        $withTags = $options['includeHashtags'] ?? true;

        // DB settings take priority over config/env so admin can switch live.
        $provider = (string) (Setting::get('facebook_post.provider') ?: config('facebook.ai.provider', 'stub'));
        $apiKey   = (string) (Setting::get('facebook_post.api_key')  ?: config('facebook.ai.api_key', ''));
        $model    = (string) (Setting::get('facebook_post.ai_model') ?: config('facebook.ai.model', ''));

        // Stub provider: deterministic local template, no external call.
        if ($provider === 'stub') {
            $this->recordStatus('ok', null);
            return $this->generateWithStub($product, $tone, $language, $withTags);
        }

        // Real provider selected but no key configured — that's an admin
        // misconfiguration. Flag it for the admin but still serve a caption
        // (don't hard-fail the customer just because the key is missing).
        if ($apiKey === '') {
            $this->recordStatus('auth_error', 'No API key is configured for the selected AI provider.');
            return $this->generateWithStub($product, $tone, $language, $withTags);
        }

        try {
            $result = match ($provider) {
                'anthropic' => $this->generateWithAnthropic($product, $tone, $language, $withTags, $apiKey, $model ?: 'claude-haiku-4-5'),
                'openai'    => $this->generateWithOpenAi($product, $tone, $language, $withTags, $apiKey, $model ?: 'gpt-4o-mini'),
                'deepseek'  => $this->generateWithDeepSeek($product, $tone, $language, $withTags, $apiKey, $model ?: 'deepseek-chat'),
                default     => null,
            };

            if ($result !== null) {
                $this->recordStatus('ok', null);
                return $result;
            }
        } catch (AiUnavailableException $e) {
            // Provider refused for a reason the customer can't fix (no credit,
            // rate limit, bad key). Record it for the admin and re-throw so the
            // controller can tell the customer to try later — never silently stub.
            $this->recordStatus($e->reason, $e->getMessage());
            Log::warning('ai.generate.unavailable', [
                'provider' => $provider,
                'reason'   => $e->reason,
                'error'    => $e->getMessage(),
            ]);
            throw $e;
        } catch (\Throwable $e) {
            // Unexpected/transient failure (network, JSON, unknown 5xx). Fall back
            // to the stub so the customer still gets a usable caption.
            Log::warning('ai.generate.failed', [
                'provider' => $provider,
                'error'    => $e->getMessage(),
            ]);
        }

        return $this->generateWithStub($product, $tone, $language, $withTags);
    }

    /**
     * Persist the latest AI provider health so the admin UI can surface
     * "limit reached" / "key invalid" without making its own API call.
     *
     * @param  'ok'|'limit_reached'|'rate_limited'|'auth_error'|'unavailable'  $status
     */
    private function recordStatus(string $status, ?string $message): void
    {
        try {
            Setting::set('facebook_post.ai_status', $status);
            Setting::set('facebook_post.ai_status_message', (string) $message);
            Setting::set('facebook_post.ai_status_at', now()->toIso8601String());
        } catch (\Throwable) {
            // Status bookkeeping must never break generation.
        }
    }

    /**
     * Map an HTTP error body from any provider to an AiUnavailableException when
     * it's a customer-unfixable condition (billing/quota, rate limit, auth).
     * Returns null for errors that should fall through to the stub instead.
     */
    private function classifyHttpError(int $status, array $body): ?AiUnavailableException
    {
        $message = strtolower((string) ($body['error']['message'] ?? $body['message'] ?? ''));
        $type    = strtolower((string) ($body['error']['type'] ?? $body['error']['code'] ?? ''));

        // Billing / credit / quota exhausted → "limit reached"
        if (str_contains($message, 'credit balance')
            || str_contains($message, 'billing')
            || str_contains($message, 'quota')
            || str_contains($message, 'insufficient')
            || str_contains($type, 'billing')
            || str_contains($type, 'insufficient_quota')) {
            return new AiUnavailableException(
                'AI post generation is temporarily unavailable. Please try again later.',
                'limit_reached'
            );
        }

        // Rate limited / model overloaded → transient, ask to retry shortly
        if ($status === 429 || str_contains($type, 'rate_limit') || str_contains($type, 'overloaded')) {
            return new AiUnavailableException(
                'AI post generation is busy right now. Please try again in a moment.',
                'rate_limited'
            );
        }

        // Bad / expired / revoked key → admin must fix; customer just retries later
        if (in_array($status, [401, 403], true)
            || str_contains($type, 'authentication')
            || str_contains($message, 'api key')) {
            return new AiUnavailableException(
                'AI post generation is temporarily unavailable. Please try again later.',
                'auth_error'
            );
        }

        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function generateWithStub(Product $product, string $tone, string $language, bool $withTags): array
    {
        $price   = number_format((float) $product->price, 0);
        $title   = $product->title;
        $blurb   = $product->short_description ?? trim((string) $product->description);

        $tonePrefix = match ($tone) {
            'professional' => '',
            'promo'        => 'Limited offer! ',
            'festive'      => 'This Eid, ',
            default        => '',
        };

        $caption = match ($language) {
            'bn'    => "{$tonePrefix}{$title} এখন মাত্র ৳{$price}!\n\n{$blurb}\n\nএখনই ইনবক্সে অর্ডার করুন।",
            'mixed' => "{$tonePrefix}{$title} matro ৳{$price} e!\n\n{$blurb}\n\nOrder korte inbox koren.",
            default => "{$tonePrefix}{$title} — only ৳{$price}!\n\n{$blurb}\n\nDM us to order today.",
        };

        $hashtags = [];
        if ($withTags) {
            $hashtags = array_slice(array_unique(array_merge(
                ['#FcommerceBD', '#OnlineShoppingBD'],
                array_map(fn ($t) => '#' . preg_replace('/\s+/', '', $t), $product->tags ?? [])
            )), 0, 6);
        }

        return ['caption' => $caption, 'hashtags' => $hashtags];
    }

    private function generateWithAnthropic(Product $product, string $tone, string $language, bool $withTags, string $apiKey, string $model = 'claude-haiku-4-5'): array
    {
        $http  = $this->http ?? new Client(['timeout' => 30, 'http_errors' => false]);

        $prompt = $this->buildPrompt($product, $tone, $language, $withTags);

        $response = $http->post('https://api.anthropic.com/v1/messages', [
            'headers' => [
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
            'json' => [
                'model'      => $model,
                'max_tokens' => 600,
                'messages'   => [['role' => 'user', 'content' => $prompt]],
            ],
        ]);

        $body = json_decode((string) $response->getBody(), true) ?: [];
        if ($response->getStatusCode() >= 400) {
            if ($ex = $this->classifyHttpError($response->getStatusCode(), $body)) {
                throw $ex;
            }
            throw new \RuntimeException('Anthropic API error: ' . ($body['error']['message'] ?? 'unknown'));
        }
        $text = $body['content'][0]['text'] ?? '';
        return $this->parseAiOutput($text, $withTags);
    }

    private function generateWithDeepSeek(Product $product, string $tone, string $language, bool $withTags, string $apiKey, string $model = 'deepseek-chat'): array
    {
        $http   = $this->http ?? new Client(['timeout' => 30, 'http_errors' => false]);
        $prompt = $this->buildPrompt($product, $tone, $language, $withTags);

        $response = $http->post('https://api.deepseek.com/chat/completions', [
            'headers' => [
                'authorization' => 'Bearer ' . $apiKey,
                'content-type'  => 'application/json',
            ],
            'json' => [
                'model'    => $model,
                'messages' => [['role' => 'user', 'content' => $prompt]],
            ],
        ]);

        $body = json_decode((string) $response->getBody(), true) ?: [];
        if ($response->getStatusCode() >= 400) {
            if ($ex = $this->classifyHttpError($response->getStatusCode(), $body)) {
                throw $ex;
            }
            throw new \RuntimeException('DeepSeek API error: ' . ($body['error']['message'] ?? 'unknown'));
        }
        $text = $body['choices'][0]['message']['content'] ?? '';
        return $this->parseAiOutput($text, $withTags);
    }

    private function generateWithOpenAi(Product $product, string $tone, string $language, bool $withTags, string $apiKey, string $model = 'gpt-4o-mini'): array
    {
        $http  = $this->http ?? new Client(['timeout' => 30, 'http_errors' => false]);

        $prompt   = $this->buildPrompt($product, $tone, $language, $withTags);
        $response = $http->post('https://api.openai.com/v1/chat/completions', [
            'headers' => [
                'authorization' => 'Bearer ' . $apiKey,
                'content-type'  => 'application/json',
            ],
            'json' => [
                'model'    => $model,
                'messages' => [['role' => 'user', 'content' => $prompt]],
            ],
        ]);

        $body = json_decode((string) $response->getBody(), true) ?: [];
        if ($response->getStatusCode() >= 400) {
            if ($ex = $this->classifyHttpError($response->getStatusCode(), $body)) {
                throw $ex;
            }
            throw new \RuntimeException('OpenAI API error: ' . ($body['error']['message'] ?? 'unknown'));
        }
        $text = $body['choices'][0]['message']['content'] ?? '';
        return $this->parseAiOutput($text, $withTags);
    }

    private function buildPrompt(Product $product, string $tone, string $language, bool $withTags): string
    {
        $info = [
            'title'             => $product->title,
            'short_description' => $product->short_description,
            'description'       => $product->description,
            'price'             => $product->price,
            'currency'          => $product->currency ?? 'BDT',
            'tags'              => $product->tags ?? [],
        ];
        $json = json_encode($info, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $langInstr = match ($language) {
            'bn'    => 'Write the caption in Bengali (Bangla).',
            'mixed' => 'Write the caption in Banglish — Bengali words written in Latin script, mixed with English.',
            default => 'Write the caption in clear, simple English.',
        };

        $tagsInstr = $withTags
            ? "Then list 4-6 relevant hashtags on a new line, prefixed with `#`."
            : "Do NOT include hashtags.";

        return <<<PROMPT
You are a social-media copywriter writing a Facebook Page post for a small Bangladeshi
e-commerce seller. Strictly follow Meta's content policies: no engagement bait
("like and share to win"), no misleading claims, no excessive emojis (max 4),
no all-caps shouting.

Tone: {$tone}.
{$langInstr}
{$tagsInstr}

Keep the caption under 600 characters. End with a clear call to action telling
the customer to message the page to order.

Product:
{$json}

Return ONLY the caption text, then a blank line, then the hashtags (if any).
No commentary, no markdown.
PROMPT;
    }

    private function parseAiOutput(string $text, bool $withTags): array
    {
        $text = trim($text);
        if (! $withTags) {
            return ['caption' => $text, 'hashtags' => []];
        }

        // Split on the last hashtag block.
        if (preg_match('/(.*?)\n+\s*((?:#\S+\s*)+)\s*$/su', $text, $m)) {
            $caption  = trim($m[1]);
            $hashtags = array_values(array_filter(array_map(
                fn ($s) => '#' . ltrim($s, '#'),
                preg_split('/\s+/', $m[2]) ?: []
            )));
            return ['caption' => $caption, 'hashtags' => array_slice($hashtags, 0, 8)];
        }
        return ['caption' => $text, 'hashtags' => []];
    }
}
