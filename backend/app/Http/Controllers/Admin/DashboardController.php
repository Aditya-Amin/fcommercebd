<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FacebookPost;
use App\Models\Payment;
use App\Models\Product;
use App\Models\SmsLog;
use App\Models\SteadfastConsignment;
use App\Models\Subscription;
use App\Models\User;
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

        return view('admin.dashboard', compact(
            'totalSales',
            'totalSubscriptions',
            'totalUsers',
            'salesChange',
            'monthlySales',
            'planStats',
            'recentSubscriptions',
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

    public function userActivity(User $user)
    {
        $stats = [
            'products'       => Product::where('user_id', $user->id)->count(),
            'sms_sent'       => SmsLog::where('user_id', $user->id)->count(),
            'sms_delivered'  => SmsLog::where('user_id', $user->id)->where('status', 'delivered')->count(),
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
            'user', 'stats', 'recentProducts', 'recentPosts', 'recentSms', 'recentOrders', 'subscriptions'
        ));
    }
}
