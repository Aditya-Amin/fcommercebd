<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiGeneration;
use App\Models\FacebookPost;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Setting;
use App\Models\SmsLog;
use App\Models\SteadfastConsignment;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Plans\PlanQuotaService;
use App\Services\Sms\SmsBalanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $totalSales        = Payment::where('status', 'completed')->sum('amount');
        $totalSubscriptions = Subscription::count();
        $totalUsers        = User::count();

        $lastMonth = now()->subMonth();
        $salesLastMonth = Payment::where('status', 'completed')
            ->where('paid_at', '<', now()->startOfMonth())
            ->where('paid_at', '>=', $lastMonth->startOfMonth())
            ->sum('amount');
        $salesChange = $salesLastMonth > 0
            ? round((($totalSales - $salesLastMonth) / $salesLastMonth) * 100)
            : 0;

        // Monthly sales for last 6 months
        $monthlySales = Payment::where('status', 'completed')
            ->where('paid_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw("DATE_FORMAT(paid_at, '%b %Y') as month"),
                DB::raw("DATE_FORMAT(paid_at, '%Y-%m') as sort_key"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month', 'sort_key')
            ->orderBy('sort_key')
            ->get();

        // Plan distribution
        $planStats = Subscription::join('plans', 'subscriptions.plan_id', '=', 'plans.id')
            ->select('plans.name', DB::raw('COUNT(*) as total'))
            ->groupBy('plans.name')
            ->get();

        // Recent subscriptions
        $recentSubscriptions = Subscription::with(['user', 'plan'])
            ->latest()
            ->limit(10)
            ->get();

        // AI (Facebook post) provider health — surfaced from the last real call.
        $aiStatus    = Setting::get('facebook_post.ai_status');
        $aiStatusMsg = Setting::get('facebook_post.ai_status_message');

        return view('admin.dashboard', compact(
            'totalSales',
            'totalSubscriptions',
            'totalUsers',
            'salesChange',
            'monthlySales',
            'planStats',
            'recentSubscriptions',
            'aiStatus',
            'aiStatusMsg',
        ));
    }

    public function subscriptions()
    {
        $subscriptions = Subscription::with(['user', 'plan'])->latest()->paginate(20);
        return view('admin.subscriptions', compact('subscriptions'));
    }

    public function users()
    {
        $users = User::withCount('subscriptions')->with('lastSubscription.plan')->latest()->paginate(20);
        return view('admin.users', compact('users'));
    }

    /**
     * Permanently delete a user and all their data. Every user-owned table
     * (products, subscriptions, payments, facebook pages/posts, sms, orders,
     * notifications) is FK-cascaded on user_id, so a single delete cleans up.
     */
    public function destroyUser(User $user): RedirectResponse
    {
        $name = $user->name;
        $user->delete();

        return redirect()
            ->route('admin.users')
            ->with('success', "User \"{$name}\" and all their data were deleted.");
    }

    /**
     * Set (or clear) a per-user override of the Facebook/AI post limit.
     * Blank input clears the override and reverts the user to their plan default.
     */
    public function updateUserQuota(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'fb_posts_limit_override' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);

        $user->fb_posts_limit_override = $data['fb_posts_limit_override'] ?? null;
        $user->save();

        $msg = $user->fb_posts_limit_override === null
            ? "Post limit override removed — {$user->name} is back on their plan default."
            : "Post limit set to {$user->fb_posts_limit_override} for {$user->name}.";

        return back()->with('success', $msg);
    }

    /**
     * Reset the user's post usage for the current period. Stamps fb_posts_reset_at
     * so only future posts count — the customer's allowance starts fresh without
     * touching their post history.
     */
    public function resetUserQuota(User $user): RedirectResponse
    {
        $user->fb_posts_reset_at = now();
        $user->save();

        return back()->with('success', "Post usage reset for {$user->name} — they start this period fresh.");
    }

    /**
     * Set (or clear) a per-user override of the AI-generation limit.
     * Blank input clears the override and reverts to the plan default.
     */
    public function updateUserAiQuota(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'ai_generations_limit_override' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);

        $user->ai_generations_limit_override = $data['ai_generations_limit_override'] ?? null;
        $user->save();

        $msg = $user->ai_generations_limit_override === null
            ? "AI generation override removed — {$user->name} is back on their plan default."
            : "AI generation limit set to {$user->ai_generations_limit_override} for {$user->name}.";

        return back()->with('success', $msg);
    }

    /**
     * Reset the user's AI-generation usage for the current period.
     */
    public function resetUserAiQuota(User $user): RedirectResponse
    {
        $user->ai_generations_reset_at = now();
        $user->save();

        return back()->with('success', "AI generation usage reset for {$user->name} — they start this period fresh.");
    }

    /**
     * Manually activate / change a user's plan from the admin panel — used to
     * upgrade a customer or restore access after their trial/plan expired.
     * Creates a fresh active subscription (cancelling any current one) and
     * provisions the matching SMS balance, mirroring a real activation.
     */
    public function assignPlan(Request $request, User $user, SmsBalanceService $smsBalance): RedirectResponse
    {
        $data = $request->validate([
            'plan_id'       => ['required', 'integer', 'exists:plans,id'],
            'duration_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
        ]);

        $plan = Plan::findOrFail($data['plan_id']);
        $days = $data['duration_days'] ?? ($plan->duration_days ?? 30);

        // One active subscription at a time — retire trial + active ones.
        Subscription::where('user_id', $user->id)
            ->whereIn('status', Subscription::ACTIVE_STATUSES)
            ->update(['status' => 'cancelled']);

        $subscription = Subscription::create([
            'user_id'        => $user->id,
            'plan_id'        => $plan->id,
            'transaction_id' => 'ADMIN-' . $user->id . '-' . now()->timestamp,
            'amount'         => 0, // admin grant — not a paid transaction
            'status'         => 'active',
            'start_date'     => now(),
            'expiry_date'    => now()->addDays($days),
        ]);

        $subscription->setRelation('plan', $plan);
        $smsBalance->activate($subscription);

        return back()->with('success', "{$plan->name} plan activated for {$user->name} ({$days} days).");
    }

    /**
     * Set the user's SMS allowance for the current period (updates the active
     * SmsBalance's total). SMS is tracked by SmsBalance, not PlanQuotaService.
     */
    public function updateUserSmsQuota(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'total_sms' => ['required', 'integer', 'min:0', 'max:1000000'],
        ]);

        $balance = $user->activeSmsBalance;
        if (! $balance) {
            return back()->with('success', "No active SMS balance — assign a plan first.");
        }

        $balance->total_sms = $data['total_sms'];
        $balance->save();

        return back()->with('success', "SMS limit set to {$data['total_sms']} for {$user->name}.");
    }

    /**
     * Reset the user's SMS usage for the current period (used_sms → 0).
     */
    public function resetUserSmsQuota(User $user): RedirectResponse
    {
        $balance = $user->activeSmsBalance;
        if (! $balance) {
            return back()->with('success', "No active SMS balance to reset.");
        }

        $balance->used_sms = 0;
        $balance->save();

        return back()->with('success', "SMS usage reset to 0 for {$user->name}.");
    }

    public function userActivity(User $user, PlanQuotaService $quota)
    {
        $fbQuota = $quota->fbPostsStatus($user);
        $aiQuota = $quota->aiGenerationsStatus($user);
        $plans   = Plan::orderBy('price')->get();
        $activeSubscription = $quota->activeSubscription($user);

        $smsBalance = $user->activeSmsBalance;
        $smsQuota = [
            'limit'      => (int) ($smsBalance->total_sms ?? 0),
            'used'       => (int) ($smsBalance->used_sms ?? 0),
            'remaining'  => max(0, (int) ($smsBalance->total_sms ?? 0) - (int) ($smsBalance->used_sms ?? 0)),
            'hasBalance' => (bool) $smsBalance,
        ];

        $stats = [
            'products'       => Product::where('user_id', $user->id)->count(),
            'sms_sent'       => SmsLog::where('user_id', $user->id)->count(),
            'sms_delivered'  => SmsLog::where('user_id', $user->id)->where('status', 'delivered')->count(),
            'ai_generations_total' => AiGeneration::where('user_id', $user->id)->count(),
            'ai_posts_total' => FacebookPost::where('user_id', $user->id)->count(),
            'ai_posts_published' => FacebookPost::where('user_id', $user->id)->where('status', 'published')->count(),
            'orders'         => SteadfastConsignment::where('user_id', $user->id)->count(),
            'orders_delivered' => SteadfastConsignment::where('user_id', $user->id)->where('status', 'delivered')->count(),
            'total_spent'    => Payment::where('user_id', $user->id)->where('status', 'completed')->sum('amount'),
        ];

        $recentProducts = Product::where('user_id', $user->id)->latest()->limit(10)->get();
        $recentPosts    = FacebookPost::where('user_id', $user->id)->latest()->limit(10)->get();
        $recentSms      = SmsLog::where('user_id', $user->id)->latest()->limit(10)->get();
        $recentOrders   = SteadfastConsignment::where('user_id', $user->id)->latest()->limit(10)->get();
        $subscriptions  = Subscription::with('plan')->where('user_id', $user->id)->latest()->get();

        return view('admin.user-activity', compact(
            'user', 'stats', 'recentProducts', 'recentPosts', 'recentSms', 'recentOrders', 'subscriptions', 'fbQuota', 'aiQuota', 'smsQuota', 'plans', 'activeSubscription'
        ));
    }
}
