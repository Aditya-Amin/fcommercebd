<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

/**
 * Typed exception for Steadfast API failures. Callers can branch on
 * `isAuthError()` / `isTransient()` rather than parsing message strings.
 *
 * Steadfast doesn't publish error codes, so the classification falls back to
 * HTTP status: 401/403 = auth, 429/5xx = transient, anything else = hard fail.
 */
class SteadfastException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $httpStatus = null,
        public readonly ?array $response = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $httpStatus ?? 0, $previous);
    }

    public static function fromResponse(?array $body, ?int $http = null): self
    {
        $message = is_array($body) && isset($body['message'])
            ? (string) $body['message']
            : "Steadfast API error" . ($http ? " (HTTP {$http})" : '');

        return new self($message, $http, $body);
    }

    public function isAuthError(): bool
    {
        return in_array($this->httpStatus, [401, 403], true);
    }

    public function isTransient(): bool
    {
        return $this->httpStatus === 429 || ($this->httpStatus !== null && $this->httpStatus >= 500);
    }
}
