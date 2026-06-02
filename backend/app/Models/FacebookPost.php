<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacebookPost extends Model
{
    use HasFactory;

    public const STATUS_QUEUED     = 'queued';
    public const STATUS_SCHEDULED  = 'scheduled';
    public const STATUS_PUBLISHING = 'publishing';
    public const STATUS_PUBLISHED  = 'published';
    public const STATUS_FAILED     = 'failed';
    public const STATUS_REJECTED   = 'rejected';
    public const STATUS_CANCELLED  = 'cancelled';

    public const TYPE_TEXT        = 'text';
    public const TYPE_PHOTO       = 'photo';
    public const TYPE_LINK        = 'link';
    public const TYPE_MULTI_PHOTO = 'multi_photo';

    protected $fillable = [
        'user_id',
        'facebook_page_id',
        'product_id',
        'type',
        'message',
        'link_url',
        'image_url',
        'image_urls',
        'hashtags',
        'status',
        'scheduled_at',
        'published_at',
        'fb_post_id',
        'fb_permalink',
        'error_code',
        'error_message',
        'moderation_flags',
        'attempts',
    ];

    protected $casts = [
        'image_urls'       => 'array',
        'hashtags'         => 'array',
        'moderation_flags' => 'array',
        'scheduled_at'     => 'datetime',
        'published_at'     => 'datetime',
        'attempts'         => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(FacebookPage::class, 'facebook_page_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [self::STATUS_QUEUED, self::STATUS_SCHEDULED]);
    }
}
