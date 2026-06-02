<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => (string) $this->id,
            'type'      => $this->type,
            'title'     => $this->title,
            'message'   => $this->message,
            'data'      => $this->data ?? [],
            'actionUrl' => $this->action_url,
            'icon'      => $this->icon,
            'priority'  => $this->priority,
            'readAt'    => optional($this->read_at)->toIso8601String(),
            'createdAt' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
