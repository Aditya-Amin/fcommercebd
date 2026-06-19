<?php

namespace App\Services\Ai;

use App\Models\Setting;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Generates images from a text prompt using the configured image provider.
 * Also generates a refined prompt from a user topic using the text AI provider.
 *
 * Providers (configured in admin → Settings → Image Generation):
 *   stub      — returns a deterministic placeholder URL (no API key needed)
 *   openai    — DALL-E 3 via OpenAI Images API
 *   replicate — Stable Diffusion via Replicate API
 */
class ImageGenerationService
{
    public function __construct(private readonly ?Client $http = null) {}

    private function http(): Client
    {
        return $this->http ?? new Client(['timeout' => 60]);
    }

    /**
     * Build a detailed image-generation prompt from a short user topic.
     * Uses the text AI provider (facebook_post settings) so no separate key needed.
     */
    public function generatePrompt(string $topic, string $language): string
    {
        $provider = (string) (Setting::get('facebook_post.provider') ?: config('facebook.ai.provider', 'stub'));
        $apiKey   = (string) (Setting::get('facebook_post.api_key')  ?: config('facebook.ai.api_key', ''));
        $model    = (string) (Setting::get('facebook_post.ai_model') ?: config('facebook.ai.model', ''));

        $langLabel = $language === 'bn' ? 'Bengali' : 'English';

        $textNote = $language === 'bn'
            ? ' IMPORTANT: Any text, labels, badges, or overlays that must appear in the edited image should be written in Bengali (Bangla) script. For example, if the instruction asks for a discount badge or price label, 
            the text on that element must be in Bangla characters.'
            : '';

        $sysPrompt = "You are an expert at writing concise, vivid image editing prompts for AI image models like DALL-E. Given a user's edit instruction in {$langLabel} describing how to modify an existing product photo (e.g. 'add a 20% discount badge', 'change background to white', 'add festive decorations'), 
        write a single, detailed English image edit prompt (max 200 words) 
        suitable for an AI image editing API. Describe the desired final state of the image clearly.
        {$textNote} Respond with only the prompt text, no explanation.";
        $userMsg   = "Edit instruction: {$topic}";

        if ($provider === 'stub' || $apiKey === '') {
            return $this->fallbackPrompt($topic, $language);
        }

        try {
            $text = match ($provider) {
                'anthropic' => $this->promptWithAnthropic($sysPrompt, $userMsg, $apiKey, $model ?: 'claude-haiku-4-5'),
                'openai'    => $this->promptWithOpenAi($sysPrompt, $userMsg, $apiKey, $model ?: 'gpt-4o-mini'),
                'deepseek'  => $this->promptWithDeepSeek($sysPrompt, $userMsg, $apiKey, $model ?: 'deepseek-chat'),
                default     => null,
            };
            return $text ?? $this->fallbackPrompt($topic, $language);
        } catch (\Throwable $e) {
            Log::warning('image.generate_prompt.failed', ['error' => $e->getMessage()]);
            return $this->fallbackPrompt($topic, $language);
        }
    }

    /**
     * Generate a brand-new image from a prompt. Returns the public URL.
     */
    public function generateImage(string $prompt): string
    {
        $provider = (string) (Setting::get('image.provider') ?: config('image.provider', 'stub'));
        $apiKey   = (string) (Setting::get('image.api_key')  ?: config('image.api_key', ''));
        $size     = (string) (Setting::get('image.image_size') ?: '1024x1024');

        if ($provider === 'stub' || $apiKey === '') {
            return $this->stubImageUrl($prompt);
        }

        try {
            return match ($provider) {
                'openai'    => $this->generateWithOpenAi($prompt, $apiKey, $size),
                'replicate' => $this->generateWithReplicate($prompt, $apiKey),
                default     => $this->stubImageUrl($prompt),
            };
        } catch (\Throwable $e) {
            Log::warning('image.generate.failed', ['provider' => $provider, 'error' => $e->getMessage()]);
            return $this->stubImageUrl($prompt);
        }
    }

    /**
     * Edit an existing product image according to the prompt.
     * Downloads the product image, sends it to the image provider's edit API,
     * saves the result to public storage and returns the public URL.
     */
    public function editProductImage(string $sourceImageUrl, string $prompt): string
    {
        $provider = (string) (Setting::get('image.provider') ?: config('image.provider', 'stub'));
        $apiKey   = (string) (Setting::get('image.api_key')  ?: config('image.api_key', ''));
        $size     = (string) (Setting::get('image.image_size') ?: '1024x1024');

        if ($provider === 'stub' || $apiKey === '') {
            // Stub: return the original image unchanged — no real editing without an API key.
            return $sourceImageUrl;
        }

        try {
            // Download the source image bytes.
            $imageBytes = $this->http()->get($sourceImageUrl)->getBody()->getContents();

            $resultB64 = match ($provider) {
                'openai'    => $this->editWithOpenAi($imageBytes, $prompt, $apiKey, $size),
                'replicate' => $this->editWithReplicate($imageBytes, $prompt, $apiKey),
                default     => null,
            };

            if ($resultB64 === null) {
                return $sourceImageUrl;
            }

            // Save base64 result to public disk and return its URL.
            return $this->saveBase64Image($resultB64);
        } catch (\Throwable $e) {
            Log::warning('image.edit.failed', ['provider' => $provider, 'error' => $e->getMessage()]);
            return $sourceImageUrl;
        }
    }

    // ── Text AI helpers (prompt generation) ───────────────────────────────────

    private function promptWithAnthropic(string $system, string $user, string $key, string $model): string
    {
        $res = $this->http()->post('https://api.anthropic.com/v1/messages', [
            'headers' => [
                'x-api-key'         => $key,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ],
            'json' => [
                'model'      => $model,
                'max_tokens' => 300,
                'system'     => $system,
                'messages'   => [['role' => 'user', 'content' => $user]],
            ],
        ]);
        $body = json_decode($res->getBody()->getContents(), true);
        return trim($body['content'][0]['text'] ?? '');
    }

    private function promptWithOpenAi(string $system, string $user, string $key, string $model): string
    {
        $res = $this->http()->post('https://api.openai.com/v1/chat/completions', [
            'headers' => ['Authorization' => "Bearer {$key}", 'Content-Type' => 'application/json'],
            'json'    => [
                'model'       => $model,
                'max_tokens'  => 300,
                'messages'    => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user',   'content' => $user],
                ],
            ],
        ]);
        $body = json_decode($res->getBody()->getContents(), true);
        return trim($body['choices'][0]['message']['content'] ?? '');
    }

    private function promptWithDeepSeek(string $system, string $user, string $key, string $model): string
    {
        $res = $this->http()->post('https://api.deepseek.com/chat/completions', [
            'headers' => ['Authorization' => "Bearer {$key}", 'Content-Type' => 'application/json'],
            'json'    => [
                'model'    => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user',   'content' => $user],
                ],
            ],
        ]);
        $body = json_decode($res->getBody()->getContents(), true);
        return trim($body['choices'][0]['message']['content'] ?? '');
    }

    // ── Image generation helpers ───────────────────────────────────────────────

    private function generateWithOpenAi(string $prompt, string $key, string $size): string
    {
        $res = $this->http()->post('https://api.openai.com/v1/images/generations', [
            'headers' => ['Authorization' => "Bearer {$key}", 'Content-Type' => 'application/json'],
            'json'    => [
                'model'   => 'dall-e-3',
                'prompt'  => $prompt,
                'n'       => 1,
                'size'    => in_array($size, ['1024x1024', '1024x1792', '1792x1024']) ? $size : '1024x1024',
            ],
        ]);
        $body = json_decode($res->getBody()->getContents(), true);
        return $body['data'][0]['url'] ?? $this->stubImageUrl($prompt);
    }

    private function generateWithReplicate(string $prompt, string $key): string
    {
        // Start prediction
        $res = $this->http()->post('https://api.replicate.com/v1/models/stability-ai/stable-diffusion/predictions', [
            'headers' => ['Authorization' => "Token {$key}", 'Content-Type' => 'application/json'],
            'json'    => ['input' => ['prompt' => $prompt, 'width' => 1024, 'height' => 1024]],
        ]);
        $body = json_decode($res->getBody()->getContents(), true);
        $predictionUrl = $body['urls']['get'] ?? null;
        if (! $predictionUrl) return $this->stubImageUrl($prompt);

        // Poll for completion (max 30s)
        for ($i = 0; $i < 15; $i++) {
            sleep(2);
            $poll = $this->http()->get($predictionUrl, [
                'headers' => ['Authorization' => "Token {$key}"],
            ]);
            $status = json_decode($poll->getBody()->getContents(), true);
            if (($status['status'] ?? '') === 'succeeded') {
                return $status['output'][0] ?? $this->stubImageUrl($prompt);
            }
            if (in_array($status['status'] ?? '', ['failed', 'canceled'])) break;
        }
        return $this->stubImageUrl($prompt);
    }

    // ── Image edit helpers ────────────────────────────────────────────────────

    /**
     * Edit a product image using OpenAI gpt-image-1.
     * Sends the raw image bytes as multipart; receives base64-encoded result.
     */
    private function editWithOpenAi(string $imageBytes, string $prompt, string $key, string $size): string
    {
        $validSize = in_array($size, ['1024x1024', '1024x1792', '1792x1024']) ? $size : '1024x1024';

        $res = $this->http()->post('https://api.openai.com/v1/images/edits', [
            'headers'    => ['Authorization' => "Bearer {$key}"],
            'multipart'  => [
                ['name' => 'model',           'contents' => 'gpt-image-1'],
                ['name' => 'image[]',         'contents' => $imageBytes, 'filename' => 'product.png', 'headers' => ['Content-Type' => 'image/png']],
                ['name' => 'prompt',          'contents' => $prompt],
                ['name' => 'n',               'contents' => '1'],
                ['name' => 'size',            'contents' => $validSize],
                ['name' => 'response_format', 'contents' => 'b64_json'],
            ],
        ]);

        $body = json_decode($res->getBody()->getContents(), true);
        return $body['data'][0]['b64_json'] ?? '';
    }

    /**
     * Edit a product image using Replicate's img2img (Stable Diffusion).
     * Returns base64 of the result image.
     */
    private function editWithReplicate(string $imageBytes, string $prompt, string $key): string
    {
        // Upload image as data URI for Replicate input.
        $dataUri = 'data:image/png;base64,' . base64_encode($imageBytes);

        $res = $this->http()->post('https://api.replicate.com/v1/models/stability-ai/stable-diffusion-img2img/predictions', [
            'headers' => ['Authorization' => "Token {$key}", 'Content-Type' => 'application/json'],
            'json'    => [
                'input' => [
                    'image'          => $dataUri,
                    'prompt'         => $prompt,
                    'strength'       => 0.5,
                    'guidance_scale' => 7.5,
                ],
            ],
        ]);
        $body          = json_decode($res->getBody()->getContents(), true);
        $predictionUrl = $body['urls']['get'] ?? null;
        if (! $predictionUrl) return '';

        // Poll for completion (max 30 s).
        for ($i = 0; $i < 15; $i++) {
            sleep(2);
            $poll   = $this->http()->get($predictionUrl, ['headers' => ['Authorization' => "Token {$key}"]]);
            $status = json_decode($poll->getBody()->getContents(), true);
            if (($status['status'] ?? '') === 'succeeded') {
                $outputUrl = $status['output'][0] ?? null;
                if (! $outputUrl) return '';
                // Fetch output and return as base64 so saveBase64Image can store it.
                return base64_encode($this->http()->get($outputUrl)->getBody()->getContents());
            }
            if (in_array($status['status'] ?? '', ['failed', 'canceled'])) break;
        }
        return '';
    }

    /**
     * Decode base64 image bytes, persist to public storage, and return the URL.
     */
    private function saveBase64Image(string $b64): string
    {
        $bytes    = base64_decode($b64, true);
        if ($bytes === false || $bytes === '') {
            throw new \RuntimeException('Invalid base64 image data from provider.');
        }

        $filename = 'generated/' . Str::uuid() . '.png';
        Storage::disk('public')->put($filename, $bytes);

        return asset('storage/' . $filename);
    }

    // ── Misc helpers ──────────────────────────────────────────────────────────

    private function fallbackPrompt(string $topic, string $language = 'en'): string
    {
        $textNote = $language === 'bn'
            ? ' Any text, labels, or overlays in the image must use Bengali (Bangla) script.'
            : '';
        return "Edit the product image to: {$topic}. Keep the product clearly visible.{$textNote} Professional studio lighting, sharp focus, commercial photography style.";
    }

    private function stubImageUrl(string $prompt): string
    {
        $encoded = urlencode(mb_substr($prompt, 0, 40));
        return "https://placehold.co/1024x1024/6366f1/ffffff?text={$encoded}";
    }
}
