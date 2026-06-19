<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateImageJob;
use App\Services\Ai\ImageGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Image generation — async via queue so the PHP process is never blocked.
 *
 *   POST /api/image/generate-prompt  → returns a refined prompt (fast, sync)
 *   POST /api/image/generate         → dispatches a background job, returns job_id
 *   GET  /api/image/status/{jobId}   → { status: pending|done|failed, url?, message? }
 */
class ImageGenerateController extends Controller
{
    public function __construct(private readonly ImageGenerationService $service) {}

    /**
     * POST /api/image/generate-prompt
     * Body: { topic: string, language: "en"|"bn" }
     */
    public function generatePrompt(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic'    => ['required', 'string', 'max:500'],
            'language' => ['required', 'in:en,bn'],
        ]);

        $prompt = $this->service->generatePrompt($data['topic'], $data['language']);

        return response()->json(['data' => ['prompt' => $prompt]]);
    }

    /**
     * POST /api/image/generate
     * Body: { prompt: string, image_url?: string }
     *
     * Dispatches a background job and returns a job_id immediately so the
     * PHP process is not blocked while the image provider does its work.
     */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'prompt'    => ['required', 'string', 'max:1000'],
            'image_url' => ['sometimes', 'nullable', 'string', 'url'],
        ]);

        $jobId = Str::uuid()->toString();

        Cache::put("img_job_{$jobId}", ['status' => 'pending'], now()->addHour());

        GenerateImageJob::dispatch(
            $jobId,
            $data['prompt'],
            $data['image_url'] ?? null,
        );

        return response()->json(['data' => ['job_id' => $jobId]]);
    }

    /**
     * GET /api/image/status/{jobId}
     * Returns { status: "pending"|"done"|"failed", url?: string, message?: string }
     */
    public function status(string $jobId): JsonResponse
    {
        $result = Cache::get("img_job_{$jobId}");

        if (! $result) {
            return response()->json(['data' => ['status' => 'not_found']], 404);
        }

        return response()->json(['data' => $result]);
    }
}
