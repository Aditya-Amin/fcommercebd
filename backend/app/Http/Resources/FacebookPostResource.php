<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FacebookPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => (string) $this->id,
            'pageId'          => (string) $this->facebook_page_id,
            'productId'       => $this->product_id ? (string) $this->product_id : null,
            'type'            => $this->type,
            'message'         => $this->message,
            'linkUrl'         => $this->link_url,
            'imageUrl'        => $this->image_url,
            'imageUrls'       => $this->image_urls ?? [],
            'hashtags'        => $this->hashtags ?? [],
            'status'          => $this->status,
            'scheduledAt'     => optional($this->scheduled_at)->toIso8601String(),
            'publishedAt'     => optional($this->published_at)->toIso8601String(),
            'fbPostId'        => $this->fb_post_id,
            'fbPermalink'     => $this->fb_permalink,
            'errorCode'       => $this->error_code,
            'errorMessage'    => $this->error_message,
            'moderationFlags' => $this->moderation_flags ?? [],
            'attempts'        => (int) $this->attempts,
            'createdAt'       => optional($this->created_at)->toIso8601String(),
        ];
    }
}
