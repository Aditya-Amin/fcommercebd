<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => (string) $this->id,
            'url'       => $this->url,
            'alt'       => $this->alt,
            'isPrimary' => (bool) $this->is_primary,
        ];
    }
}
