<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Tracks SMS quota for one user during one subscription period.
 *
 * One row is created when a subscription activates (via SmsBalanceService).
 * When the subscription renews, a fresh row is inserted — old rows stay as
 * history so we can show past-period usage if needed later.
 *
 * @property int         $id
 * @property int         $user_id
 * @property int|null    $subscription_id
 * @property int         $total_sms
 * @property int         $used_sms
 * @property \Carbon\Carbon|null $period_start
 * @property \Carbon\Carbon|null $period_end
 */
class SmsBalance extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_id',
        'total_sms',
        'used_sms',
        'period_start',
        'period_end',
    ];

    protected $casts = [
        'total_sms'    => 'integer',
        'used_sms'     => 'integer',
        'period_start' => 'datetime',
        'period_end'   => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function smsLogs(): HasMany
    {
        return $this->hasMany(SmsLog::class);
    }

    // ─── Computed helpers ─────────────────────────────────────────────────────

    /**
     * SMS left in this period. Always non-negative.
     */
    public function remainingSms(): int
    {
        return max(0, $this->total_sms - $this->used_sms);
    }

    /**
     * Percentage of quota consumed (0–100), rounded to one decimal.
     */
    public function usagePercentage(): float
    {
        if ($this->total_sms === 0) return 0.0;
        return round(($this->used_sms / $this->total_sms) * 100, 1);
    }

    /**
     * True when the user still has SMS left AND the period has not ended.
     */
    public function canSend(): bool
    {
        if ($this->remainingSms() <= 0) return false;
        if ($this->period_end && $this->period_end->isPast()) return false;
        return true;
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /**
     * The currently active balance for a user: period has not ended yet.
     * Usage: SmsBalance::forUser($user)->active()->first()
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('period_end')
              ->orWhere('period_end', '>', now());
        });
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }
}
