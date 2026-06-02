<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Steadfast Courier API
    |--------------------------------------------------------------------------
    | Production base URL is documented; no public sandbox. For dev work either
    | use real keys at low volume or mock at the controller level.
    */

    'base_url' => rtrim(env('STEADFAST_BASE_URL', 'https://portal.packzy.com/api/v1'), '/'),

    /*
    | HTTP timeouts (seconds). Steadfast occasionally hangs on /create_order;
    | the longer total timeout absorbs that without surfacing 504s to the user.
    */
    'timeout'         => 25,
    'connect_timeout' => 5,

    /*
    | Dedicated log channel name (configured in config/logging.php).
    */
    'log_channel' => 'steadfast',
];
