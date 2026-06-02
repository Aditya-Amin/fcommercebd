<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SteadfastConsignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => (string) $this->id,
            'invoice'          => $this->invoice,
            'consignmentId'    => $this->consignment_id ? (string) $this->consignment_id : null,
            'trackingCode'     => $this->tracking_code,
            'status'           => $this->status,
            'recipientName'    => $this->recipient_name,
            'recipientPhone'   => $this->recipient_phone,
            'alternativePhone' => $this->alternative_phone,
            'recipientEmail'   => $this->recipient_email,
            'recipientAddress' => $this->recipient_address,
            'codAmount'        => (float) $this->cod_amount,
            'note'             => $this->note,
            'itemDescription'  => $this->item_description,
            'deliveryType'     => $this->delivery_type,
            'lastSyncedAt'     => optional($this->last_synced_at)->toIso8601String(),
            'createdAt'        => optional($this->created_at)->toIso8601String(),
        ];
    }
}
