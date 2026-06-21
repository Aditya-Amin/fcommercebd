<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsDriver;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

/**
 * BDBulkSMS HTTP API driver.
 *
 * Doc: https://bdbulksms.com/bd-bulk-sms-api.php
 *
 * Request:  POST {endpoint}?json
 *           Content-Type: application/x-www-form-urlencoded
 *           form params: token, to, message
 *
 * Response (JSON mode, single recipient):
 *   [{"to":"+880…","message":"…","status":"SENT"|"FAILED","statusmsg":"…"}]
 *
 * Demo token for testing (does NOT send real SMS): 1234567890123456789
 * Generate a real token at: https://bdbulksms.com (Developer section)
 */
class BdbulksmsDriver implements SmsDriver
{
    public function __construct(
        private readonly string $endpoint,
        private readonly ?string $token,
        private readonly int $timeoutSeconds,
    ) {}

    public function send(string $to, string $message): bool
    {
        if (empty($this->token)) {
            Log::channel('sms')->warning('bdbulksms_send_skipped_no_token', ['to' => $to]);
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

            Log::channel('sms')->info($ok ? 'bdbulksms_send_ok' : 'bdbulksms_send_failed', [
                'to'             => $to,
                'http'           => $http,
                'providerStatus' => $providerStatus,
                'body'           => mb_substr($body, 0, 300),
                'length'         => mb_strlen($message),
            ]);

            return $ok;
        } catch (\Throwable $e) {
            Log::channel('sms')->error('bdbulksms_send_exception', [
                'to'  => $to,
                'err' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Extracts "SENT" / "FAILED" from the JSON response.
     * The provider returns an array even for single-recipient sends.
     * Falls back to text-mode "Ok:" / "Error:" prefix sniffing.
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

        $trimmed = ltrim($body);
        if (str_starts_with($trimmed, 'Ok:'))    return 'SENT';
        if (str_starts_with($trimmed, 'Error:')) return 'FAILED';
        return null;
    }
}
