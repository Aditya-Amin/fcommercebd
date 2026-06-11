<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\AiUnavailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Facebook\GenerateCaptionRequest;
use App\Models\AiGeneration;
use App\Models\Product;
use App\Models\Setting;
use App\Services\Ai\AiPostGenerator;
use App\Services\Plans\PlanQuotaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AI-assisted Facebook post generation.
 *
 * Takes a product the user owns and produces a caption + hashtags ready for
 * the Facebook posting endpoint. Image URLs come straight from the product —
 * we don't ask AI to invent images.
 */
class AiGenerateController extends Controller
{
    public function __construct(
        private readonly AiPostGenerator $generator,
        private readonly PlanQuotaService $quota,
    ) {}

    /**
     * GET /api/ai/usage — current-period AI generation quota for the SPA.
     */
    public function usage(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->quota->aiGenerationsStatus($request->user())]);
    }

    /**
     * POST /api/ai/generate-post
     *
     * Body:
     *   product_id       : int   (required, must belong to user)
     *   tone?            : friendly|professional|promo|festive
     *   language?        : en|bn|mixed
     *   include_hashtags?: bool  (default true)
     */
    public function generate(GenerateCaptionRequest $request): JsonResponse
    {
        $product = Product::with('images')
            ->where('id', $request->validated('product_id'))
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        $user = $request->user();

        // Enforce the AI-generation quota on the server — the browser counter is
        // no longer the source of truth.
        if (! $this->quota->canGenerate($user)) {
            $status = $this->quota->aiGenerationsStatus($user);
            return response()->json([
                'message' => $status['locked']
                    ? 'AI generation is not available on your current plan.'
                    : "Monthly AI generation limit reached ({$status['used']}/{$status['limit']}).",
                'reason'  => $status['locked'] ? 'plan_locked' : 'ai_limit_reached',
                'quota'   => $status,
            ], 429);
        }

        $tone     = $request->validated('tone', 'friendly');
        $language = $request->validated('language', 'en');

        try {
            $result = $this->generator->generateForProduct($product, [
                'tone'            => $tone,
                'language'        => $language,
                'includeHashtags' => $request->validated('include_hashtags', true),
            ]);
        } catch (AiUnavailableException $e) {
            // Provider is out of credit / rate limited / mis-keyed. Tell the
            // customer to try later; the admin sees the real reason in settings.
            return response()->json([
                'message' => $e->getMessage(),
                'reason'  => $e->reason,
            ], 503);
        }

        // Record the generation so usage is backend-tracked (replaces the old
        // localStorage-only counter). Only successful generations count.
        AiGeneration::create([
            'user_id'    => $user->id,
            'product_id' => $product->id,
            'provider'   => (string) (Setting::get('facebook_post.provider') ?: config('facebook.ai.provider', 'stub')),
            'language'   => $language,
            'tone'       => $tone,
        ]);

        // Pull image URLs straight from the product so the SPA can post them as-is.
        $imageUrls = $product->images->pluck('url')->values()->all();

        return response()->json([
            'data' => [
                'productId' => (string) $product->id,
                'caption'   => $result['caption'],
                'hashtags'  => $result['hashtags'],
                'images'    => $imageUrls,
                'primary'   => $product->primaryImage()?->url,
                'usage'     => $this->quota->aiGenerationsStatus($user),
            ],
        ]);
    }
}
