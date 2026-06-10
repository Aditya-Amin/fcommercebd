<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Immutable record of a single SMS send attempt.
 *
 * Never updated after creation. status reflects the outcome at send time:
 *   sent   — accepted by the real SMS gateway (greenweb / other provider)
 *   failed — gateway returned an error
 *   mock   — SMS_MOCK=true or log driver; no real network call was made
 *
 * @property int         $id
 * @property int         $user_id
 * @property int|null    $sms_balance_id
 * @property string      $recipient_number
 * @property string      $message
 * @property string      $status
 * @property array|null  $gateway_response
 * @property \Carbon\Carbon $created_at
 */
class SmsLog extends Model
{
    // Logs are immutable — no updated_at needed
    public const UPDATED_AT = null;

    // Status constants — use these instead of raw strings in business logic
    public const STATUS_SENT   = 'sent';
    public const STATUS_FAILED = 'failed';
    public const STATUS_MOCK   = 'mock';

    protected $fillable = [
        'user_id',
        'sms_balance_id',
        'recipient_number',
        'message',
        'status',
        'gateway_response',
    ];

    protected $casts = [
        'gateway_response' => 'array',
        'created_at'       => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function smsBalance(): BelongsTo
    {
        return $this->belongsTo(SmsBalance::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    public function scopeSent($query)
    {
        return $query->where('status', self::STATUS_SENT);
    }

    public function scopeMock($query)
    {
        return $query->where('status', self::STATUS_MOCK);
    }
}
