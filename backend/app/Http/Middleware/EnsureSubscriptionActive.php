<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hard-cutoff gate: blocks feature endpoints when the user's subscription has
 * expired. Free-tier users (those who never purchased a plan) are NOT blocked
 * — they keep the existing locked-features dashboard flow.
 *
 * 403 response shape is contracted with the frontend layout's redirect logic:
 *   { code: "subscription_expired", expired_at, last_plan_id }
 */
class EnsureSubscriptionActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->activeSubscription) {
            return $next($request);
        }

        $last = $user->lastSubscription;

        // Never had a subscription → free tier, allow through.
        if (! $last) {
            return $next($request);
        }

        return response()->json([
            'message'      => 'Subscription expired. Please renew to continue.',
            'code'         => 'subscription_expired',
            'expired_at'   => optional($last->expiry_date)->toIso8601String(),
            'last_plan_id' => $last->plan_id,
        ], 403);
    }
}
