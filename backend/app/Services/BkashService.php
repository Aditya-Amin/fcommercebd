<?php

namespace App\Services;

use App\Exceptions\BkashException;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * bKash Tokenized Checkout (PGW v1.2.0-beta) service.
 *
 * Endpoints used:
 *   POST /tokenized/checkout/token/grant         — get id_token
 *   POST /tokenized/checkout/token/refresh       — refresh expired token
 *   POST /tokenized/checkout/create              — create payment, get bkashURL
 *   POST /tokenized/checkout/execute             — finalize after callback
 *   POST /tokenized/checkout/payment/status      — query payment status
 *   POST /tokenized/checkout/payment/refund      — full or partial refund
 */
class BkashService
{
    private Client $http;
    private array $config;

    public function __construct()
    {
        $this->config = config('bkash');

        $this->http = new Client([
            'base_uri'        => $this->config['base_url'] . '/',
            'timeout'         => $this->config['timeout'],
            'connect_timeout' => $this->config['connect_timeout'],
            'http_errors'     => false, // we handle non-2xx ourselves
            'headers'         => [
                'Accept'       => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    // ─────────────────────────────────────────── token

    /**
     * Get a cached id_token. Pass $force=true to bypass cache (e.g. on 401 retry).
     */
    public function getToken(bool $force = false): string
    {
        if (! $force) {
            $cached = Cache::get($this->config['token_cache_key']);
            if (is_string($cached) && $cached !== '') {
                return $cached;
            }
        }

        $creds = $this->config['credentials'];

        $response = $this->http->post('tokenized/checkout/token/grant', [
            'headers' => [
                'username' => $creds['username'],
                'password' => $creds['password'],
            ],
            'json' => [
                'app_key'    => $creds['app_key'],
                'app_secret' => $creds['app_secret'],
            ],
        ]);

        $body = $this->decode($response);

        if (empty($body['id_token'])) {
            $this->log('error', 'token_grant_failed', $body);
            throw BkashException::fromResponse($body, $response->getStatusCode());
        }

        $expiresIn = (int) ($body['expires_in'] ?? 3600);
        $ttl = max(60, $expiresIn - $this->config['token_safety_margin']);

        Cache::put($this->config['token_cache_key'], $body['id_token'], $ttl);

        $this->log('info', 'token_granted', ['expires_in' => $expiresIn]);
        return $body['id_token'];
    }

    // ─────────────────────────────────────────── create payment

    /**
     * @param  array  $payload  ['amount', 'currency'?, 'merchantInvoiceNumber', 'payerReference'?]
     * @return array{paymentID:string,bkashURL:string,...}
     */
    public function createPayment(array $payload): array
    {
        $body = array_merge([
            'mode'                  => '0011', // Tokenized Checkout
            'currency'              => 'BDT',
            'intent'                => 'sale',
            'callbackURL'           => $this->config['callback_url'],
            'merchantInvoiceNumber' => 'INV-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6)),
            'payerReference'        => '01000000000',
        ], $payload);

        // bKash expects amount as a string
        $body['amount'] = (string) $body['amount'];

        $resp = $this->request('POST', 'tokenized/checkout/create', $body);

        if (($resp['statusCode'] ?? null) !== '0000' || empty($resp['paymentID']) || empty($resp['bkashURL'])) {
            throw BkashException::fromResponse($resp);
        }

        return $resp;
    }

    // ─────────────────────────────────────────── execute payment

    /**
     * Verify and capture the payment after the customer returns from bKash.
     */
    public function executePayment(string $paymentID): array
    {
        $resp = $this->request('POST', 'tokenized/checkout/execute', ['paymentID' => $paymentID]);

        // Successful execute returns statusCode "0000" with transactionStatus "Completed"
        // Failed/duplicate executes still return 200 OK but with non-success codes — caller decides.
        return $resp;
    }

    // ─────────────────────────────────────────── query payment status

    public function queryPayment(string $paymentID): array
    {
        return $this->request('POST', 'tokenized/checkout/payment/status', ['paymentID' => $paymentID]);
    }

    // ─────────────────────────────────────────── refund

    /**
     * @param  string  $paymentID
     * @param  string  $trxID
     * @param  float|string  $amount  Amount to refund (full or partial).
     * @param  string  $reason  Free-text reason logged with the refund.
     */
    public function refund(string $paymentID, string $trxID, $amount, string $reason = 'Customer request'): array
    {
        $resp = $this->request('POST', 'tokenized/checkout/payment/refund', [
            'paymentID' => $paymentID,
            'amount'    => (string) $amount,
            'trxID'     => $trxID,
            'sku'       => 'subscription',
            'reason'    => $reason,
        ]);

        return $resp;
    }

    // ─────────────────────────────────────────── internals

    /**
     * Authenticated request with one-shot retry on token expiry.
     */
    private function request(string $method, string $uri, array $json = []): array
    {
        return $this->doRequest($method, $uri, $json, retried: false);
    }

    private function doRequest(string $method, string $uri, array $json, bool $retried): array
    {
        try {
            $response = $this->http->request($method, $uri, [
                'headers' => $this->authHeaders(),
                'json'    => $json,
            ]);
        } catch (GuzzleException $e) {
            $this->log('error', 'transport_failure', [
                'uri' => $uri,
                'err' => $e->getMessage(),
            ]);
            throw new BkashException(
                'bKash transport error: ' . $e->getMessage(),
                502,
                null,
                null,
                $e instanceof RequestException ? $e : null
            );
        }

        $body = $this->decode($response);
        $http = $response->getStatusCode();
        $statusCode = $body['statusCode'] ?? null;

        $this->log('debug', 'request', [
            'uri'        => $uri,
            'http'       => $http,
            'statusCode' => $statusCode,
            'request'    => $this->scrub($json),
            'response'   => $body,
        ]);

        // Token expired? Retry once with a fresh token.
        if (! $retried && $this->isTokenExpired($http, $statusCode)) {
            $this->log('info', 'token_expired_retrying', ['uri' => $uri]);
            $this->getToken(force: true);
            return $this->doRequest($method, $uri, $json, retried: true);
        }

        // Hard transport failure (5xx, 4xx that isn't a bKash business error)
        if ($http >= 500) {
            throw BkashException::fromResponse($body, $http);
        }

        return $body;
    }

    private function isTokenExpired(int $http, ?string $statusCode): bool
    {
        // 401 is the obvious case; bKash also surfaces "2055"/"2056" for token issues.
        return $http === 401
            || in_array($statusCode, ['2055', '2056', '2057'], strict: true);
    }

    private function authHeaders(): array
    {
        return [
            'Authorization' => $this->getToken(),
            'X-APP-Key'     => $this->config['credentials']['app_key'],
        ];
    }

    private function decode($response): array
    {
        $contents = (string) $response->getBody();
        $decoded = json_decode($contents, associative: true);
        return is_array($decoded) ? $decoded : ['raw' => $contents];
    }

    private function log(string $level, string $event, array $context = []): void
    {
        Log::channel('bkash')->{$level}("bkash:{$event}", $context);
    }

    /**
     * Strip secrets from logged payloads.
     */
    private function scrub(array $payload): array
    {
        foreach (['app_secret', 'password', 'pin'] as $sensitive) {
            if (array_key_exists($sensitive, $payload)) {
                $payload[$sensitive] = '***';
            }
        }
        return $payload;
    }
}
