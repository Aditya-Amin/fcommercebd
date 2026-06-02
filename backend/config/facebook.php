<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Facebook App credentials
    |--------------------------------------------------------------------------
    |
    | Create a Facebook App at https://developers.facebook.com/apps and copy
    | the values into your .env file. The redirect URI MUST exactly match the
    | one configured in the Facebook App "Facebook Login" → Valid OAuth
    | Redirect URIs list, including protocol, host, port, path.
    |
    */
    'app_id'     => env('FACEBOOK_APP_ID'),
    'app_secret' => env('FACEBOOK_APP_SECRET'),

    'graph_version' => env('FACEBOOK_GRAPH_VERSION', 'v21.0'),
    'graph_url'     => env('FACEBOOK_GRAPH_URL', 'https://graph.facebook.com'),
    'oauth_url'     => env('FACEBOOK_OAUTH_URL', 'https://www.facebook.com'),

    /*
    |--------------------------------------------------------------------------
    | Redirect / frontend URLs
    |--------------------------------------------------------------------------
    */
    'redirect_uri'      => env('FACEBOOK_REDIRECT_URI'), // e.g. https://api.fcommerce.bd/api/facebook/callback
    'frontend_success'  => env('FACEBOOK_FRONTEND_SUCCESS_URL', env('FRONTEND_URL') . '/integrations?fb=connected'),
    'frontend_failure'  => env('FACEBOOK_FRONTEND_FAILURE_URL', env('FRONTEND_URL') . '/integrations?fb=failed'),

    /*
    |--------------------------------------------------------------------------
    | Permissions requested at OAuth time
    |--------------------------------------------------------------------------
    |
    | All three of these require Facebook App Review for use beyond the app
    | developer / test users. See README for App Review submission notes.
    |
    */
    'scopes' => [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
    ],

    /*
    |--------------------------------------------------------------------------
    | Posting safeguards (per page)
    |--------------------------------------------------------------------------
    */
    'rate_limit' => [
        // Per-page caps. These are intentionally well below Facebook's
        // unpublished spam thresholds so a busy day never trips Graph
        // throttling or page-flagging heuristics.
        'max_posts_per_day'  => env('FACEBOOK_MAX_POSTS_PER_DAY', 25),
        'max_posts_per_hour' => env('FACEBOOK_MAX_POSTS_PER_HOUR', 6),
        // Hard floor of 120s is enforced inside PostingRateLimiter even if
        // the env value is misconfigured below it (Meta safety).
        'min_gap_seconds'    => env('FACEBOOK_MIN_GAP_SECONDS', 300), // 5 min
    ],

    /*
    |--------------------------------------------------------------------------
    | Image rules
    |--------------------------------------------------------------------------
    */
    'image' => [
        'max_bytes'  => 8 * 1024 * 1024, // 8 MB practical safe limit
        'allowed_mime' => ['image/jpeg', 'image/png'],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI generator (optional — wire to Claude / OpenAI later)
    |--------------------------------------------------------------------------
    */
    'ai' => [
        'provider' => env('AI_PROVIDER', 'stub'), // stub | anthropic | openai
        'api_key'  => env('AI_API_KEY'),
        'model'    => env('AI_MODEL', 'claude-haiku-4-5'),
    ],
];
