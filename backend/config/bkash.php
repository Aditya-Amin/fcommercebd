<?php

return [

    /*
    |--------------------------------------------------------------------------
    | bKash Tokenized Checkout (PGW v1.2.0-beta)
    |--------------------------------------------------------------------------
    |
    | Sandbox base: https://tokenized.sandbox.bka.sh/v1.2.0-beta
    | Live base:    https://tokenized.pay.bka.sh/v1.2.0-beta
    |
    */

    'base_url' => rtrim(env('BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'), '/'),

    'credentials' => [
        'app_key'    => env('BKASH_APP_KEY'),
        'app_secret' => env('BKASH_APP_SECRET'),
        'username'   => env('BKASH_USERNAME'),
        'password'   => env('BKASH_PASSWORD'),
    ],

    /*
    | Callback URL bKash will redirect the customer to after the wallet step.
    | Must be a Laravel route. Defaults to APP_URL/api/bkash/callback.
    */
    'callback_url' => env('BKASH_CALLBACK_URL', env('APP_URL') . '/api/bkash/callback'),

    /*
    | Where to bounce the customer back to (Next.js) after Laravel finishes.
    */
    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/'),

    /*
    | Optional HMAC secret for verifying server-to-server webhooks.
    */
    'webhook_secret' => env('BKASH_WEBHOOK_SECRET'),

    /*
    | Token cache key + safety margin (seconds) before considering it stale.
    */
    'token_cache_key' => 'bkash.id_token',
    'token_safety_margin' => 60,

    /*
    | HTTP timeouts in seconds.
    */
    'timeout' => 30,
    'connect_timeout' => 10,

    /*
    |--------------------------------------------------------------------------
    | Simulate mode
    |--------------------------------------------------------------------------
    | When true, /api/bkash/create-payment skips the real bKash API and returns
    | a synthetic paymentID + a redirect URL pointing to /api/bkash/simulate-pay,
    | which immediately marks the payment completed and creates the active
    | subscription. Useful for development without bKash sandbox creds.
    |
    | Set BKASH_SIMULATE=true in .env to enable.
    */
    'simulate' => filter_var(env('BKASH_SIMULATE', false), FILTER_VALIDATE_BOOLEAN),
];
