<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serializes a User for the SPA. Includes the active subscription (with plan)
 * so the frontend can hydrate PlanContext from one /me call.
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $activeSub = $this->resource->subscriptions()->active()->with('plan')->latest()->first();

        // For the expired-state UI: most recent subscription regardless of status.
        // Will be the same row as $activeSub when active; different (status=expired
        // or expiry_date in the past) when the user needs to renew.
        $lastSub = $activeSub
            ?: $this->resource->subscriptions()->with('plan')->latest()->first();

        return [
            'id'          => (string) $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'business'    => $this->business,
            'phone'       => $this->phone,
            'avatarColor' => $this->avatar_color ?? '#3362FF',
            'createdAt'   => optional($this->created_at)->toIso8601String(),
            'subscription' => $activeSub ? $this->serializeSubscription($activeSub) : null,
            'lastSubscription' => $lastSub ? $this->serializeSubscription($lastSub) : null,
        ];
    }

    private function serializeSubscription($sub): array
    {
        return [
            'id'         => (string) $sub->id,
            'planId'     => optional($sub->plan)->slug,
            'planDbId'   => $sub->plan_id,
            'planName'   => optional($sub->plan)->name,
            'planPrice'  => optional($sub->plan)->price,
            'status'     => $sub->status,
            'startedAt'  => optional($sub->start_date)->toIso8601String(),
            'expiresAt'  => optional($sub->expiry_date)->toIso8601String(),
            'limits'     => optional($sub->plan)->limits,
        ];
    }
}
