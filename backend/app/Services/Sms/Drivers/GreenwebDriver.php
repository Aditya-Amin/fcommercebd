<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsDriver;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

/**
 * bdbulksms.net (Greenweb) SMS HTTP API driver.
 *
 * Doc: https://bdbulksms.net/bd-bulk-sms-api.php
 *
 * Request:  POST {endpoint}?json
 *           Content-Type: application/x-www-form-urlencoded
 *           form params: token, to, message
 *
 * Response (JSON mode, single recipient):
 *   [{"to":"+880…", "message":"…", "status":"SENT" | "FAILED", "statusmsg":"…"}]
 *
 * Success when status === "SENT". Anything else (including HTTP non-200) is a failure.
 *
 * Demo token from the docs (does NOT actually send): 1234567890123456789
 */
class GreenwebDriver implements SmsDriver
{
    public function __construct(
        private readonly string $endpoint,
        private readonly ?string $token,
        private readonly int $timeoutSeconds,
    ) {}

    public function send(string $to, string $message): bool
    {
        if (empty($this->token)) {
            Log::channel('sms')->warning('greenweb_send_skipped_no_token', ['to' => $to]);
            return false;
        }

        $url = $this->endpoint . (str_contains($this->endpoint, '?') ? '&json' : '?json');

        try {
            $client = new Client([
                'timeout'     => $this->timeoutSeconds,
                'http_errors' => false,
            ]);

            $response = $client->post($url, [
                'form_params' => [
                    'token'   => $this->token,
                    'to'      => $to,
                    'message' => $message,
                ],
            ]);

            $body = (string) $response->getBody();
            $http = $response->getStatusCode();

            $providerStatus = $this->extractProviderStatus($body);
            $ok = $http === 200 && $providerStatus === 'SENT';

            Log::channel('sms')->info($ok ? 'greenweb_send_ok' : 'greenweb_send_failed', [
                'to'             => $to,
                'http'           => $http,
                'providerStatus' => $providerStatus,
                'body'           => mb_substr($body, 0, 300),
                'length'         => mb_strlen($message),
            ]);

            return $ok;
        } catch (\Throwable $e) {
            Log::channel('sms')->error('greenweb_send_exception', [
                'to'  => $to,
                'err' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Pulls "SENT" / "FAILED" out of the JSON response. The provider returns
     * an array even for single-recipient sends; we accept either an array of
     * one or a bare object as belt-and-braces.
     *
     * Falls back to text-mode `Ok:` / `Error:` prefix sniffing when the body
     * isn't JSON — happens if someone overrides GREENWEB_SMS_ENDPOINT to a
     * non-?json URL.
     */
    private function extractProviderStatus(string $body): ?string
    {
        $decoded = json_decode($body, true);
        if (is_array($decoded)) {
            $first = isset($decoded['status']) ? $decoded : ($decoded[0] ?? null);
            if (is_array($first) && isset($first['status'])) {
                return is_string($first['status']) ? strtoupper($first['status']) : null;
            }
        }

        // Text-mode fallback (success line starts with "Ok:", failure with "Error:")
        $trimmed = ltrim($body);
        if (str_starts_with($trimmed, 'Ok:'))    return 'SENT';
        if (str_starts_with($trimmed, 'Error:')) return 'FAILED';
        return null;
    }
}
