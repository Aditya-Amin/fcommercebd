<?php

namespace App\Providers;

use App\Services\Ai\AiPostGenerator;
use App\Services\Ai\ImageGenerationService;
use App\Services\Sms\SmsBalanceService;
use App\Services\Sms\SmsService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // SmsService is a lightweight wrapper around the configured driver.
        // Bind as singleton so the driver is only instantiated once per request.
        $this->app->singleton(SmsService::class);

        // SmsBalanceService depends on SmsService — Laravel resolves it automatically.
        $this->app->singleton(SmsBalanceService::class);

        // Build AiPostGenerator with NO Guzzle client so it creates its own,
        // CA-pinned one. Otherwise the container auto-injects a default
        // GuzzleHttp\Client (Client is instantiable), which has no CA bundle and
        // fails every HTTPS call with cURL error 60 → silent stub fallback.
        $this->app->bind(AiPostGenerator::class, fn () => new AiPostGenerator());

        // Same reasoning for the image generator — let it build its own CA-pinned client.
        $this->app->bind(ImageGenerationService::class, fn () => new ImageGenerationService());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
