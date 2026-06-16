<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotification extends Model
{
    public const TYPE_USER_REGISTER   = 'user_register';
    public const TYPE_USER_LOGIN      = 'user_login';
    public const TYPE_USER_LOGOUT     = 'user_logout';
    public const TYPE_PLAN_PURCHASE   = 'plan_purchase';
    public const TYPE_PLAN_ASSIGNED   = 'plan_assigned';
    public const TYPE_SUBSCRIPTION_EXPIRED = 'subscription_expired';
    public const TYPE_SYSTEM          = 'system';

    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'action_url',
        'icon',
        'color',
        'read_at',
    ];

    protected $casts = [
        'data'       => 'array',
        'read_at'    => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    public function markAsRead(): void
    {
        if (! $this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }
}
