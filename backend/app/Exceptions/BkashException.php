<?php

namespace App\Exceptions;

use Exception;
use Throwable;

class BkashException extends Exception
{
    /**
     * Raw response payload returned by bKash, when present.
     */
    public ?array $response;

    /**
     * bKash status code (e.g. "0000" success, "2001" insufficient balance).
     * See bKash PGW status code reference for the full list.
     */
    public ?string $bkashStatusCode;

    public function __construct(
        string $message,
        int $httpCode = 500,
        ?array $response = null,
        ?string $bkashStatusCode = null,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $httpCode, $previous);
        $this->response = $response;
        $this->bkashStatusCode = $bkashStatusCode;
    }

    public static function fromResponse(array $body, int $httpCode = 400): self
    {
        $code = $body['statusCode'] ?? $body['errorCode'] ?? null;
        $msg  = $body['statusMessage']
            ?? $body['errorMessage']
            ?? 'bKash request failed';

        return new self($msg, $httpCode, $body, $code);
    }
}
