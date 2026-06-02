<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsDriver;
use Illuminate\Support\Facades\Log;

/**
 * Dev driver: writes intended SMS to the sms log channel without billing.
 * Returns true so callers see the same code path as a successful send.
 */
class LogDriver implements SmsDriver
{
    public function send(string $to, string $message): bool
    {
        Log::channel('sms')->info('sms_log_driver', [
            'to'      => $to,
            'message' => $message,
            'length'  => mb_strlen($message),
        ]);
        return true;
    }
}
