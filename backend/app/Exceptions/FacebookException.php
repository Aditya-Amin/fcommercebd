<?php

namespace App\Exceptions;

use Exception;
use Throwable;

class FacebookException extends Exception
{
    public function __construct(
        string $message,
        public readonly ?int $statusCode = null,
        public readonly ?array $response = null,
        public readonly ?string $fbCode = null,
        public readonly ?string $fbSubcode = null,
        public readonly ?string $fbType = null,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }

    /**
     * @param  array<string, mixed>  $body
     */
    public static function fromGraphResponse(array $body, int $statusCode): self
    {
        $error = $body['error'] ?? [];
        return new self(
            message:    $error['message'] ?? 'Unknown Facebook Graph error',
            statusCode: $statusCode,
            response:   $body,
            fbCode:     isset($error['code']) ? (string) $error['code'] : null,
            fbSubcode:  isset($error['error_subcode']) ? (string) $error['error_subcode'] : null,
            fbType:     $error['type'] ?? null,
        );
    }

    /**
     * Tokens / permissions invalidated — user must re-connect.
     */
    public function isAuthError(): bool
    {
        // 190 = invalid token; 102 = session expired; 200 = permissions error
        return in_array($this->fbCode, ['190', '102', '200', '10', '459', '463'], true);
    }

    /**
     * Rate-limit related codes.
     */
    public function isRateLimited(): bool
    {
        // 4 = app rate limit; 17 = user rate limit; 32 = page-level rate limit
        return in_array($this->fbCode, ['4', '17', '32', '613'], true);
    }

    /**
     * Transient errors worth retrying.
     */
    public function isTransient(): bool
    {
        return $this->statusCode >= 500
            || $this->isRateLimited()
            || $this->fbCode === '1'      // unknown
            || $this->fbCode === '2';     // service temporarily unavailable
    }
}
