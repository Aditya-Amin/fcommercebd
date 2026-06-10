<?php

namespace App\Providers;

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
