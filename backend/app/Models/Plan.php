<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'price',
        'currency',
        'duration',
        'duration_days',
        'features',
        'limits',
        'is_active',
    ];

    protected $casts = [
        'price'         => 'decimal:2',
        'duration_days' => 'integer',
        'features'      => 'array',
        'limits'        => 'array',
        'is_active'     => 'boolean',
    ];

    /**
     * Get a single limit by key (e.g. 'fbPosts'). Returns null if undefined,
     * 0 means "feature locked", positive integer is the monthly cap.
     */
    public function limit(string $key): ?int
    {
        $limits = $this->limits ?? [];
        return isset($limits[$key]) ? (int) $limits[$key] : null;
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
