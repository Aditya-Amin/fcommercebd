<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchasesController extends Controller
{
    /**
     * GET /api/admin/purchases
     *
     * Returns paginated list of all purchases with user, plan, and subscription
     * data. Supports ?status= and ?plan_id= filters plus ?per_page= (max 100).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        $payments = Payment::with(['user:id,name,email,phone', 'plan:id,name,slug,price,currency', 'subscription'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->query('plan_id'), fn ($q, $p) => $q->where('plan_id', $p))
            ->latest('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $payments->map(fn (Payment $p) => [
                'id'             => $p->id,
                'payment_id'     => $p->payment_id,
                'trx_id'         => $p->trx_id,
                'status'         => $p->status,
                'amount'         => $p->amount,
                'currency'       => $p->currency,
                'paid_at'        => $p->paid_at?->toIso8601String(),
                'created_at'     => $p->created_at->toIso8601String(),
                'user'           => [
                    'id'    => $p->user?->id,
                    'name'  => $p->user?->name,
                    'email' => $p->user?->email,
                    'phone' => $p->user?->phone,
                ],
                'plan'           => [
                    'id'       => $p->plan?->id,
                    'name'     => $p->plan?->name,
                    'slug'     => $p->plan?->slug,
                    'price'    => $p->plan?->price,
                    'currency' => $p->plan?->currency,
                ],
                'subscription'   => $p->subscription ? [
                    'id'           => $p->subscription->id,
                    'status'       => $p->subscription->status,
                    'activated_at' => $p->subscription->start_date?->toIso8601String(),
                    'expires_at'   => $p->subscription->expiry_date?->toIso8601String(),
                ] : null,
            ]),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page'    => $payments->lastPage(),
                'per_page'     => $payments->perPage(),
                'total'        => $payments->total(),
            ],
        ]);
    }

    /**
     * GET /api/admin/purchases/summary
     * Quick stats for the admin dashboard header.
     */
    public function summary(): JsonResponse
    {
        $completed = Payment::where('status', 'completed');

        return response()->json([
            'total_revenue'       => (float) (clone $completed)->sum('amount'),
            'total_transactions'  => (clone $completed)->count(),
            'active_subscriptions'=> Subscription::where('status', 'active')->count(),
            'pending_payments'    => Payment::where('status', 'initiated')->count(),
        ]);
    }
}
