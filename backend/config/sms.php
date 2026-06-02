<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default SMS Driver
    |--------------------------------------------------------------------------
    |
    | Supported: "greenweb", "log"
    | "log" writes to the sms log channel without hitting any provider — safe
    | default for local dev. Flip to "greenweb" in production once creds are set.
    |
    */

    'driver' => env('SMS_DRIVER', 'log'),

    'greenweb' => [
        // bdbulksms.net (Greenweb-branded) HTTP API. Doc:
        //   https://bdbulksms.net/bd-bulk-sms-api.php
        // The driver appends ?json automatically for structured responses.
        'endpoint' => env('GREENWEB_SMS_ENDPOINT', 'https://api.bdbulksms.net/api.php'),
        'token'    => env('GREENWEB_SMS_TOKEN'),
        // Optional: prefix every message with brand for identifiability in BD inboxes.
        'prefix'   => env('SMS_BRAND_PREFIX', 'FcommerceBD'),
    ],

    /*
    | Total HTTP timeout (seconds). Greenweb is normally <2s; 10 is generous.
    */
    'timeout' => 10,

];
