<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Facebook\GenerateCaptionRequest;
use App\Models\Product;
use App\Services\Ai\AiPostGenerator;
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
    public function __construct(private readonly AiPostGenerator $generator) {}

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

        $result = $this->generator->generateForProduct($product, [
            'tone'            => $request->validated('tone', 'friendly'),
            'language'        => $request->validated('language', 'en'),
            'includeHashtags' => $request->validated('include_hashtags', true),
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
            ],
        ]);
    }
}
