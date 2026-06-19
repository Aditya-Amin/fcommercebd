<?php

namespace App\Jobs;

use App\Services\Ai\ImageGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class GenerateImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries   = 1;

    public function __construct(
        private readonly string  $jobId,
        private readonly string  $prompt,
        private readonly ?string $sourceImageUrl = null,
    ) {}

    public function handle(ImageGenerationService $service): void
    {
        try {
            $url = $this->sourceImageUrl
                ? $service->editProductImage($this->sourceImageUrl, $this->prompt)
                : $service->generateImage($this->prompt);

            Cache::put("img_job_{$this->jobId}", [
                'status' => 'done',
                'url'    => $url,
            ], now()->addHour());
        } catch (\Throwable $e) {
            Cache::put("img_job_{$this->jobId}", [
                'status'  => 'failed',
                'message' => $e->getMessage(),
            ], now()->addHour());
        }
    }

    public function failed(\Throwable $e): void
    {
        Cache::put("img_job_{$this->jobId}", [
            'status'  => 'failed',
            'message' => $e->getMessage(),
        ], now()->addHour());
    }
}
