<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => (string) $this->id,
            'title'             => $this->title,
            'slug'              => $this->slug,
            'shortDescription'  => $this->short_description,
            'description'       => $this->description,
            'price'             => (float) $this->price,
            'comparePrice'      => $this->compare_price !== null ? (float) $this->compare_price : null,
            'currency'          => $this->currency,
            'stock'             => (int) $this->stock,
            'status'            => $this->status,
            'category'          => $this->whenLoaded('category', fn () => $this->category?->slug),
            'categoryId'        => $this->category_id,
            'tags'              => $this->tags ?? [],
            'facebookPostId'    => $this->facebook_post_id,
            'images'            => ProductImageResource::collection($this->whenLoaded('images')),
            'createdAt'         => optional($this->created_at)->toIso8601String(),
            'updatedAt'         => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
