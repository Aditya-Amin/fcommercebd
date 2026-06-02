<?php

namespace App\Services\Ai;

use App\Models\Product;
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

        $provider = (string) config('facebook.ai.provider', 'stub');
        $apiKey   = (string) config('facebook.ai.api_key', '');

        try {
            if ($provider === 'anthropic' && $apiKey !== '') {
                return $this->generateWithAnthropic($product, $tone, $language, $withTags, $apiKey);
            }
            if ($provider === 'openai' && $apiKey !== '') {
                return $this->generateWithOpenAi($product, $tone, $language, $withTags, $apiKey);
            }
        } catch (\Throwable $e) {
            Log::warning('ai.generate.failed', [
                'provider' => $provider,
                'error'    => $e->getMessage(),
            ]);
            // fall through to stub on any provider failure
        }

        return $this->generateWithStub($product, $tone, $language, $withTags);
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
            'bn' => "{$tonePrefix}{$title} এখন মাত্র ৳{$price}!\n\n{$blurb}\n\nএখনই ইনবক্সে অর্ডার করুন।",
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

    private function generateWithAnthropic(Product $product, string $tone, string $language, bool $withTags, string $apiKey): array
    {
        $http  = $this->http ?? new Client(['timeout' => 30, 'http_errors' => false]);
        $model = (string) config('facebook.ai.model', 'claude-haiku-4-5');

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
            throw new \RuntimeException('Anthropic API error: ' . ($body['error']['message'] ?? 'unknown'));
        }
        $text = $body['content'][0]['text'] ?? '';
        return $this->parseAiOutput($text, $withTags);
    }

    private function generateWithOpenAi(Product $product, string $tone, string $language, bool $withTags, string $apiKey): array
    {
        $http  = $this->http ?? new Client(['timeout' => 30, 'http_errors' => false]);
        $model = (string) config('facebook.ai.model', 'gpt-4o-mini');

        $prompt = $this->buildPrompt($product, $tone, $language, $withTags);

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
