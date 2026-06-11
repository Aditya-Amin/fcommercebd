<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when the configured AI provider cannot serve a request for a reason
 * the customer can't fix (no credit balance, rate limited, bad/expired key).
 *
 * Unlike a transient/network error — which falls back to the stub template —
 * this is surfaced all the way to the customer ("try again later") and recorded
 * for the admin ("limit reached"), so the failure is never silently hidden.
 *
 * $reason is a machine code for the admin UI:
 *   limit_reached | rate_limited | auth_error | unavailable
 */
class AiUnavailableException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $reason = 'unavailable',
    ) {
        parent::__construct($message);
    }
}
