<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    public const TYPE_ORDER_NEW          = 'order_new';
    public const TYPE_ORDER_STATUS       = 'order_status';
    public const TYPE_FB_POST_PUBLISHED  = 'fb_post_published';
    public const TYPE_FB_POST_FAILED     = 'fb_post_failed';
    public const TYPE_FB_TOKEN_EXPIRING  = 'fb_token_expiring';
    public const TYPE_LOW_STOCK          = 'low_stock';
    public const TYPE_SMS_LOW            = 'sms_low';
    public const TYPE_PLAN_LIMIT         = 'plan_limit';
    public const TYPE_PAYMENT_SUCCESS    = 'payment_success';
    public const TYPE_PLAN_ACTIVATED     = 'plan_activated';
    public const TYPE_SMS_UPDATED        = 'sms_updated';
    public const TYPE_AI_UPDATED         = 'ai_updated';
    public const TYPE_FB_QUOTA_UPDATED   = 'fb_quota_updated';
    public const TYPE_USAGE_RESET        = 'usage_reset';
    public const TYPE_SYSTEM             = 'system';

    public const PRIORITY_LOW    = 'low';
    public const PRIORITY_NORMAL = 'normal';
    public const PRIORITY_HIGH   = 'high';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'action_url',
        'icon',
        'priority',
        'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function markAsRead(): bool
    {
        if ($this->read_at !== null) return false;
        $this->read_at = now();
        return $this->save();
    }
}
