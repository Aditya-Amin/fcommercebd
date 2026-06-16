<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use Notifiable;

    /**
     * An agent is considered "online" only if their last heartbeat landed
     * within this window. The agent dashboard pings every ~30s, so a 60s
     * threshold tolerates one missed beat before marking them offline.
     */
    public const ONLINE_THRESHOLD_SECONDS = 60;

    protected $fillable = ['name', 'email', 'password', 'role', 'is_available', 'last_seen_at'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'password'     => 'hashed',
        'is_available' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    /** Tickets currently routed to this agent. */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'assigned_admin_id');
    }

    /** Available to take chats AND seen recently. */
    public function isOnline(): bool
    {
        return $this->is_available
            && $this->last_seen_at !== null
            && $this->last_seen_at->gt(now()->subSeconds(self::ONLINE_THRESHOLD_SECONDS));
    }

    /**
     * Scope: agents eligible to receive a new ticket right now
     * (available + heartbeat inside the online window).
     */
    public function scopeReceivingChats($query)
    {
        return $query
            ->where('is_available', true)
            ->where('last_seen_at', '>', now()->subSeconds(self::ONLINE_THRESHOLD_SECONDS));
    }
}
