<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SteadfastConsignment extends Model
{
    use HasFactory;

    /** Status enum from the Steadfast docs. Reproduced here for IDE help. */
    public const STATUS_PENDING                            = 'pending';
    public const STATUS_IN_REVIEW                          = 'in_review';
    public const STATUS_HOLD                               = 'hold';
    public const STATUS_DELIVERED_APPROVAL_PENDING         = 'delivered_approval_pending';
    public const STATUS_PARTIAL_DELIVERED_APPROVAL_PENDING = 'partial_delivered_approval_pending';
    public const STATUS_CANCELLED_APPROVAL_PENDING         = 'cancelled_approval_pending';
    public const STATUS_UNKNOWN_APPROVAL_PENDING           = 'unknown_approval_pending';
    public const STATUS_DELIVERED                          = 'delivered';
    public const STATUS_PARTIAL_DELIVERED                  = 'partial_delivered';
    public const STATUS_CANCELLED                          = 'cancelled';
    public const STATUS_UNKNOWN                            = 'unknown';

    protected $fillable = [
        'user_id',
        'invoice',
        'consignment_id',
        'tracking_code',
        'status',
        'recipient_name',
        'recipient_phone',
        'alternative_phone',
        'recipient_email',
        'recipient_address',
        'cod_amount',
        'note',
        'item_description',
        'delivery_type',
        'raw_response',
        'last_synced_at',
    ];

    protected $casts = [
        'cod_amount'      => 'decimal:2',
        'consignment_id'  => 'integer',
        'delivery_type'   => 'integer',
        'raw_response'    => 'array',
        'last_synced_at'  => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Terminal — no further status transitions expected. */
    public function isFinal(): bool
    {
        return in_array($this->status, [
            self::STATUS_DELIVERED,
            self::STATUS_PARTIAL_DELIVERED,
            self::STATUS_CANCELLED,
        ], true);
    }
}
