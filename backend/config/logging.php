<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [

    'default' => env('LOG_CHANNEL', 'stack'),
    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace'   => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    'channels' => [
        'stack' => [
            'driver'   => 'stack',
            'channels' => ['single'],
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver' => 'single',
            'path'   => storage_path('logs/laravel.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'daily' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/laravel.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'days'   => 14,
            'replace_placeholders' => true,
        ],

        // Dedicated channel for bKash so request/response noise doesn't pollute the main log
        'bkash' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/bkash.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'days'   => 30,
            'replace_placeholders' => true,
        ],

        // Dedicated channel for Facebook Graph API traffic + publish job lifecycle
        'facebook' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/facebook.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'days'   => 30,
            'replace_placeholders' => true,
        ],

        // Dedicated channel for outbound SMS (provider responses + dev log driver)
        'sms' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/sms.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'days'   => 30,
            'replace_placeholders' => true,
        ],

        // Steadfast Courier API request/response trail
        'steadfast' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/steadfast.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'days'   => 30,
            'replace_placeholders' => true,
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level'  => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'with' => ['stream' => 'php://stderr'],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'null' => [
            'driver' => 'monolog',
            'handler' => NullHandler::class,
        ],
    ],
];
