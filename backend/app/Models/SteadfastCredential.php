<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SteadfastCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'api_key',
        'secret_key',
        'is_valid',
        'last_validated_at',
    ];

    /**
     * Encrypted at rest — both keys go through Laravel Crypt before
     * touching the DB. Plain text never lands in queries or backups.
     */
    protected $casts = [
        'api_key'           => 'encrypted',
        'secret_key'        => 'encrypted',
        'is_valid'          => 'boolean',
        'last_validated_at' => 'datetime',
    ];

    /**
     * Defense in depth: never serialize the keys to a JSON response. The
     * UserResource / SteadfastCredentialResource only expose presence.
     */
    protected $hidden = [
        'api_key',
        'secret_key',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
