<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FacebookPage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'page_id',
        'page_name',
        'category',
        'picture_url',
        'fan_count',
        'access_token',
        'user_access_token',
        'token_expiry',
        'permissions',
        'is_active',
        'last_synced_at',
    ];

    /**
     * `encrypted` cast wraps every read/write through Laravel\'s Crypt facade,
     * so the access token stays encrypted at rest in the DB column.
     */
    protected $casts = [
        'access_token'      => 'encrypted',
        'user_access_token' => 'encrypted',
        'token_expiry'      => 'datetime',
        'last_synced_at'    => 'datetime',
        'permissions'       => 'array',
        'is_active'         => 'boolean',
        'fan_count'         => 'integer',
    ];

    /**
     * Never serialize the raw token to API responses.
     */
    protected $hidden = [
        'access_token',
        'user_access_token',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(FacebookPost::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function isTokenExpired(): bool
    {
        if (! $this->token_expiry) {
            return false; // long-lived page tokens may not expire
        }
        return $this->token_expiry->isPast();
    }

    public function hasPermission(string $perm): bool
    {
        return in_array($perm, $this->permissions ?? [], true);
    }
}
