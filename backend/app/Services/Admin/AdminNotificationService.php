<?php

namespace App\Services\Admin;

use App\Models\AdminNotification;
use App\Models\User;
use App\Models\Subscription;
use App\Models\Plan;
use App\Models\SupportTicket;

class AdminNotificationService
{
    public static function userRegistered(User $user): void
    {
        self::create(
            type:       AdminNotification::TYPE_USER_REGISTER,
            title:      'New User Registered',
            message:    "{$user->name} just signed up" . ($user->business ? " — {$user->business}" : '') . '.',
            icon:       'fa-user-plus',
            color:      'violet',
            actionUrl:  "/admin/users/{$user->id}/activity",
            data:       ['user_id' => $user->id, 'email' => $user->email, 'phone' => $user->phone],
        );
    }

    public static function userLoggedIn(User $user): void
    {
        self::create(
            type:       AdminNotification::TYPE_USER_LOGIN,
            title:      'User Login',
            message:    "{$user->name} logged in.",
            icon:       'fa-right-to-bracket',
            color:      'blue',
            actionUrl:  "/admin/users/{$user->id}/activity",
            data:       ['user_id' => $user->id, 'email' => $user->email],
        );
    }

    public static function userLoggedOut(User $user): void
    {
        self::create(
            type:       AdminNotification::TYPE_USER_LOGOUT,
            title:      'User Logout',
            message:    "{$user->name} logged out.",
            icon:       'fa-right-from-bracket',
            color:      'gray',
            actionUrl:  "/admin/users/{$user->id}/activity",
            data:       ['user_id' => $user->id, 'email' => $user->email],
        );
    }

    public static function planPurchased(User $user, Subscription $subscription): void
    {
        $planName = $subscription->plan->name ?? 'Unknown Plan';
        $amount   = number_format($subscription->amount, 0);

        self::create(
            type:       AdminNotification::TYPE_PLAN_PURCHASE,
            title:      'Plan Purchased',
            message:    "{$user->name} bought the {$planName} plan for ৳{$amount}.",
            icon:       'fa-credit-card',
            color:      'green',
            actionUrl:  "/admin/users/{$user->id}/activity",
            data:       [
                'user_id'         => $user->id,
                'email'           => $user->email,
                'plan_id'         => $subscription->plan_id,
                'plan_name'       => $planName,
                'amount'          => $subscription->amount,
                'subscription_id' => $subscription->id,
                'transaction_id'  => $subscription->transaction_id,
            ],
        );
    }

    public static function planAssigned(User $user, Subscription $subscription): void
    {
        $planName = $subscription->plan->name ?? 'Unknown Plan';

        self::create(
            type:       AdminNotification::TYPE_PLAN_ASSIGNED,
            title:      'Plan Manually Assigned',
            message:    "Admin assigned the {$planName} plan to {$user->name}.",
            icon:       'fa-id-card',
            color:      'amber',
            actionUrl:  "/admin/users/{$user->id}/activity",
            data:       [
                'user_id'         => $user->id,
                'plan_id'         => $subscription->plan_id,
                'plan_name'       => $planName,
                'subscription_id' => $subscription->id,
            ],
        );
    }

    public static function subscriptionExpired(User $user, Subscription $subscription): void
    {
        $planName = $subscription->plan->name ?? 'their plan';

        self::create(
            type:       AdminNotification::TYPE_SUBSCRIPTION_EXPIRED,
            title:      'Subscription Expired',
            message:    "{$user->name}'s {$planName} subscription has expired.",
            icon:       'fa-circle-xmark',
            color:      'red',
            actionUrl:  "/admin/users/{$user->id}/activity",
            data:       [
                'user_id'         => $user->id,
                'plan_id'         => $subscription->plan_id,
                'plan_name'       => $planName,
                'subscription_id' => $subscription->id,
            ],
        );
    }

    public static function newSupportTicket(SupportTicket $ticket): void
    {
        $user = $ticket->user;
        $who  = $user->name ?? 'A user';

        self::create(
            type:       AdminNotification::TYPE_SYSTEM,
            title:      'New Support Ticket',
            message:    "{$who} opened ticket {$ticket->ticket_id}: {$ticket->subject}",
            icon:       'fa-headset',
            color:      'blue',
            actionUrl:  "/admin/support/{$ticket->id}",
            data:       [
                'ticket_id'    => $ticket->id,
                'ticket_code'  => $ticket->ticket_id,
                'user_id'      => $ticket->user_id,
                'subject'      => $ticket->subject,
            ],
        );
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private static function create(
        string  $type,
        string  $title,
        string  $message,
        string  $icon      = 'fa-bell',
        string  $color     = 'gray',
        ?string $actionUrl = null,
        array   $data      = [],
    ): AdminNotification {
        return AdminNotification::create([
            'type'       => $type,
            'title'      => $title,
            'message'    => $message,
            'icon'       => $icon,
            'color'      => $color,
            'action_url' => $actionUrl,
            'data'       => $data ?: null,
        ]);
    }
}
