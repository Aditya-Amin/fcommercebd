<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * GET /api/plans — public list of active plans.
     */
    public function plans(): JsonResponse
    {
        return response()->json(['data' => Plan::active()->orderBy('price')->get()]);
    }

    /**
     * GET /api/subscriptions — auth user's subscription history.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()
                ->subscriptions()
                ->with('plan')
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    /**
     * GET /api/subscriptions/active — current active subscription (or null).
     */
    public function active(Request $request): JsonResponse
    {
        $sub = $request->user()
            ->subscriptions()
            ->active()
            ->with('plan')
            ->latest()
            ->first();

        return response()->json(['data' => $sub]);
    }
}
