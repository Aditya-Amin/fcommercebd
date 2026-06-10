<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'transaction_id',
        'amount',
        'status',
        'start_date',
        'expiry_date',
        'expiry_3d_notified_at',
        'expiry_1d_notified_at',
        'expired_notified_at',
    ];

    protected $casts = [
        'amount'                => 'decimal:2',
        'start_date'            => 'datetime',
        'expiry_date'           => 'datetime',
        'expiry_3d_notified_at' => 'datetime',
        'expiry_1d_notified_at' => 'datetime',
        'expired_notified_at'   => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active'
            && $this->expiry_date
            && $this->expiry_date->isFuture();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active')->where('expiry_date', '>', now());
    }

    // ─── SMS ─────────────────────────────────────────────────────────────────

    /** The SMS balance created when this subscription was activated. */
    public function smsBalance(): HasOne
    {
        return $this->hasOne(SmsBalance::class);
    }
}
