<?php

namespace App\Services\Sms;

interface SmsDriver
{
    /**
     * Send one SMS. Returns true on accepted-by-provider, false otherwise.
     * Implementations must catch their own transport errors and return false
     * — callers should never see exceptions from this contract.
     */
    public function send(string $to, string $message): bool;
}
