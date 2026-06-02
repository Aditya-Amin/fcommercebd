<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FacebookPageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => (string) $this->id,
            'pageId'       => $this->page_id,
            'pageName'     => $this->page_name,
            'category'     => $this->category,
            'pictureUrl'   => $this->picture_url,
            'fanCount'     => $this->fan_count,
            'permissions'  => $this->permissions ?? [],
            'isActive'     => (bool) $this->is_active,
            'tokenExpiry'  => optional($this->token_expiry)->toIso8601String(),
            'lastSyncedAt' => optional($this->last_synced_at)->toIso8601String(),
            'connectedAt'  => optional($this->created_at)->toIso8601String(),
        ];
    }
}
