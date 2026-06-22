<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default SMS Driver
    |--------------------------------------------------------------------------
    |
    | Supported: "bdbulksms", "greenweb", "log"
    | "log" writes to the sms log channel without hitting any provider — safe
    | default for local dev. Switch to "bdbulksms" in production once the token
    | is set in BDBULKSMS_TOKEN.
    |
    */

    'driver' => env('SMS_DRIVER', 'log'),

    /*
    |--------------------------------------------------------------------------
    | BDBulkSMS (bdbulksms.com) — primary production driver
    |--------------------------------------------------------------------------
    |
    | Get your API token from: https://bdbulksms.com (Developer section)
    | Demo token (no real SMS): 1234567890123456789
    |
    */
    'bdbulksms' => [
        'endpoint' => env('BDBULKSMS_ENDPOINT', 'https://api.bdbulksms.net/api.php'),
        'token'    => env('BDBULKSMS_TOKEN'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Greenweb / bdbulksms.net — legacy alias (same underlying API)
    |--------------------------------------------------------------------------
    */
    'greenweb' => [
        'endpoint' => env('GREENWEB_SMS_ENDPOINT', 'https://api.bdbulksms.net/api.php'),
        'token'    => env('GREENWEB_SMS_TOKEN'),
        'prefix'   => env('SMS_BRAND_PREFIX', 'FcommerceBD'),
    ],

    /*
    | Total HTTP timeout (seconds). BDBulkSMS is normally <2s; 10 is generous.
    */
    'timeout' => 10,

];
