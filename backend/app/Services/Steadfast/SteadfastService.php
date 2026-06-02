<?php

namespace App\Services\Steadfast;

use App\Exceptions\SteadfastException;
use Composer\CaBundle\CaBundle;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

/**
 * Steadfast Courier HTTP client.
 *
 * Doc: https://docs.google.com/document/d/e/2PACX-1vTi0sTyR353xu1AK0nR8E_WKe5onCkUXGEf8ch8uoJy9qxGfgGnboSIkNosjQ0OOdXkJhgGuAsWxnIh/pub
 *
 * Auth is per-request (Api-Key + Secret-Key headers from the user's stored
 * credentials), so this service is stateless — every public method takes the
 * keys explicitly and never caches them. Callers (controllers, jobs) load
 * them from `SteadfastCredential` and pass them in.
 */
class SteadfastService
{
    private Client $http;
    private string $baseUrl;

    public function __construct()
    {
        $config = config('steadfast');

        // Same CA-bundle resolution as FacebookGraphService — Windows PHP
        // installs without curl.cainfo otherwise fail HTTPS verify.
        $caCandidate = env('SSL_CA_BUNDLE');
        if (! $caCandidate && class_exists(CaBundle::class)) {
            $caCandidate = CaBundle::getBundledCaBundlePath();
        }

        $this->baseUrl = rtrim((string) ($config['base_url'] ?? 'https://portal.packzy.com/api/v1'), '/');

        $this->http = new Client([
            'timeout'         => $config['timeout']         ?? 25,
            'connect_timeout' => $config['connect_timeout'] ?? 5,
            'http_errors'     => false,
            'verify'          => $caCandidate ?: true,
            'headers'         => [
                'Accept'       => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    private function endpoint(string $path): string
    {
        return $this->baseUrl . '/' . ltrim($path, '/');
    }

    // ────────────────────────────────────────── Endpoints

    /**
     * GET /get_balance — also doubles as a credential validator: a 200 means
     * the keys work, a 401/403 means they don't. Used during /credentials save.
     */
    public function getBalance(string $apiKey, string $secretKey): array
    {
        return $this->request('GET', 'get_balance', $apiKey, $secretKey);
    }

    /**
     * POST /create_order — books a new consignment.
     *
     * @param  array{invoice:string,recipient_name:string,recipient_phone:string,recipient_address:string,cod_amount:int|float|string,alternative_phone?:string,recipient_email?:string,note?:string,item_description?:string,total_lot?:int,delivery_type?:int}  $payload
     */
    public function createOrder(string $apiKey, string $secretKey, array $payload): array
    {
        // Steadfast wants cod_amount as numeric, but defensively coerce —
        // forms often send it as a string.
        if (isset($payload['cod_amount'])) {
            $payload['cod_amount'] = is_numeric($payload['cod_amount'])
                ? (float) $payload['cod_amount']
                : 0;
        }

        return $this->request('POST', 'create_order', $apiKey, $secretKey, $payload);
    }

    /** GET /status_by_cid/{id} */
    public function statusByConsignmentId(string $apiKey, string $secretKey, int $cid): array
    {
        return $this->request('GET', "status_by_cid/{$cid}", $apiKey, $secretKey);
    }

    /** GET /status_by_invoice/{invoice} */
    public function statusByInvoice(string $apiKey, string $secretKey, string $invoice): array
    {
        return $this->request('GET', 'status_by_invoice/' . rawurlencode($invoice), $apiKey, $secretKey);
    }

    /** GET /status_by_trackingcode/{code} */
    public function statusByTrackingCode(string $apiKey, string $secretKey, string $trackingCode): array
    {
        return $this->request('GET', 'status_by_trackingcode/' . rawurlencode($trackingCode), $apiKey, $secretKey);
    }

    // ────────────────────────────────────────── internals

    /**
     * Single request entry point. Adds Api-Key / Secret-Key headers, logs the
     * request + response (with secrets scrubbed), throws SteadfastException
     * on non-2xx.
     *
     * @return array decoded JSON body (always an array — non-JSON wrapped as ['raw' => …])
     * @throws SteadfastException
     */
    private function request(string $method, string $uri, string $apiKey, string $secretKey, array $body = []): array
    {
        $url = $this->endpoint($uri);

        try {
            $response = $this->http->request($method, $url, [
                'headers' => [
                    'Api-Key'    => $apiKey,
                    'Secret-Key' => $secretKey,
                ],
                'json' => $method === 'GET' ? null : $body,
            ]);
        } catch (GuzzleException $e) {
            $this->log('error', 'transport_failure', [
                'url' => $url,
                'err' => $e->getMessage(),
            ]);
            throw new SteadfastException(
                'Could not reach Steadfast: ' . $e->getMessage(),
                502,
                null,
                $e,
            );
        }

        $status = $response->getStatusCode();
        $raw    = (string) $response->getBody();
        $decoded = json_decode($raw, associative: true);
        $decoded = is_array($decoded) ? $decoded : ['raw' => $raw];

        $this->log('debug', 'request', [
            'method'   => $method,
            'uri'      => $uri,
            'http'     => $status,
            'request'  => $body,
            'response' => $decoded,
        ]);

        if ($status >= 400) {
            throw SteadfastException::fromResponse($decoded, $status);
        }

        return $decoded;
    }

    private function log(string $level, string $event, array $context = []): void
    {
        Log::channel(config('steadfast.log_channel'))
            ->{$level}("steadfast:{$event}", $context);
    }
}
