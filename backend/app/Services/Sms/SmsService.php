<?php

namespace App\Services\Sms;

use App\Services\Sms\Drivers\GreenwebDriver;
use App\Services\Sms\Drivers\LogDriver;
use Illuminate\Support\Facades\Log;

/**
 * Resolves the configured SMS driver and delegates send().
 *
 * Add a new provider by writing a Drivers\<Name>Driver implementing SmsDriver
 * and adding a case below. No call site changes needed.
 */
class SmsService
{
    private SmsDriver $driver;

    public function __construct()
    {
        $config = config('sms');
        $this->driver = match ($config['driver']) {
            'greenweb' => new GreenwebDriver(
                endpoint: $config['greenweb']['endpoint'],
                token:    $config['greenweb']['token'] ?? null,
                timeoutSeconds: (int) $config['timeout'],
            ),
            'log', null => new LogDriver(),
            default => throw new \InvalidArgumentException("Unknown SMS driver: {$config['driver']}"),
        };
    }

    /**
     * Send one SMS. Returns true if accepted by the provider; false otherwise.
     * Never throws — callers can fire-and-log without try/catch.
     */
    public function send(?string $to, string $message): bool
    {
        $to = $this->normalizeBdNumber($to);
        if ($to === null) {
            Log::channel('sms')->warning('sms_skipped_invalid_number', ['to_raw' => $to]);
            return false;
        }
        return $this->driver->send($to, $message);
    }

    /**
     * Normalize a BD phone number to the form Greenweb (and most BD providers)
     * expect: 11 digits starting with 01. Strips +880 / 880 / spaces / dashes.
     * Returns null when the input doesn't look like a BD mobile.
     */
    private function normalizeBdNumber(?string $raw): ?string
    {
        if (empty($raw)) return null;
        $digits = preg_replace('/\D+/', '', $raw);
        if ($digits === null || $digits === '') return null;

        if (str_starts_with($digits, '880') && strlen($digits) === 13) {
            $digits = '0' . substr($digits, 3);
        }

        return preg_match('/^01[3-9]\d{8}$/', $digits) === 1 ? $digits : null;
    }
}
