<?php

namespace App\Services\Notifications;

use App\Models\Notification;
use App\Models\User;

/**
 * Single entrypoint for creating notifications. Other parts of the app
 * (PublishToFacebookJob, OrderController, low-stock checks, bKash webhook,
 * etc.) call $notifications->notify(...) instead of touching the model
 * directly. This keeps the contract in one place and makes it trivial to
 * later wire in broadcasting (Laravel Reverb) without touching callers.
 *
 * Phase 2 hook (when WebSockets are added):
 *   broadcast(new NotificationCreated($notification))->toOthers();
 *
 * For now we just persist; the SPA polls /api/notifications/unread-count
 * every 15s and picks up new rows.
 */
class NotificationService
{
    /**
     * Create a notification for a user.
     *
     * @param  array<string, mixed>  $data
     */
    public function notify(
        User $user,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $actionUrl = null,
        ?string $icon = null,
        string $priority = Notification::PRIORITY_NORMAL,
    ): Notification {
        return Notification::create([
            'user_id'    => $user->id,
            'type'       => $type,
            'title'      => $title,
            'message'    => $message,
            'data'       => $data,
            'action_url' => $actionUrl,
            'icon'       => $icon,
            'priority'   => $priority,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Convenience constructors — keep call sites readable. Add more as
    // features grow (orderShipped, paymentRefunded, etc.).
    // ─────────────────────────────────────────────────────────────────────────

    public function orderReceived(User $user, string $orderId, int $amount, string $customerName): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_ORDER_NEW,
            title:     'New order received',
            message:   "{$customerName} placed an order worth ৳" . number_format($amount) . '.',
            data:      ['orderId' => $orderId, 'amount' => $amount],
            actionUrl: '/orders',
            icon:      'shopping-bag',
            priority:  Notification::PRIORITY_HIGH,
        );
    }

    public function fbPostPublished(User $user, string $postId, string $pageName): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_FB_POST_PUBLISHED,
            title:     'Facebook post published',
            message:   "Your post is now live on {$pageName}.",
            data:      ['postId' => $postId, 'page' => $pageName],
            actionUrl: '/ai-generate',
            icon:      'facebook',
            priority:  Notification::PRIORITY_NORMAL,
        );
    }

    public function fbPostFailed(User $user, string $postId, string $reason): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_FB_POST_FAILED,
            title:     'Facebook post failed',
            message:   $reason,
            data:      ['postId' => $postId],
            actionUrl: '/integrations',
            icon:      'alert-circle',
            priority:  Notification::PRIORITY_HIGH,
        );
    }

    public function lowStock(User $user, string $productId, string $productName, int $stock): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_LOW_STOCK,
            title:     $stock === 0 ? 'Out of stock' : 'Low stock alert',
            message:   $stock === 0
                ? "{$productName} is now out of stock."
                : "{$productName} has only {$stock} units left in stock.",
            data:      ['productId' => $productId, 'stock' => $stock],
            actionUrl: '/products',
            icon:      'alert-triangle',
            priority:  Notification::PRIORITY_HIGH,
        );
    }

    public function paymentSuccess(User $user, string $plan, int $amount): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_PAYMENT_SUCCESS,
            title:     'Subscription renewed',
            message:   "Your {$plan} plan renewed successfully — ৳" . number_format($amount) . ' charged via bKash.',
            data:      ['plan' => $plan, 'amount' => $amount],
            actionUrl: '/settings',
            icon:      'credit-card',
            priority:  Notification::PRIORITY_LOW,
        );
    }

    public function planActivated(User $user, string $planName, int $days): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_PLAN_ACTIVATED,
            title:     'Plan activated',
            message:   "Your {$planName} plan has been activated for {$days} days. Enjoy your new features!",
            data:      ['plan' => $planName, 'days' => $days],
            actionUrl: '/plan-details',
            icon:      'sparkles',
            priority:  Notification::PRIORITY_HIGH,
        );
    }

    public function smsQuotaUpdated(User $user, int $total): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_SMS_UPDATED,
            title:     'SMS quota updated',
            message:   "Your SMS limit has been set to {$total} for this period.",
            data:      ['total_sms' => $total],
            actionUrl: '/campaigns',
            icon:      'message-square',
            priority:  Notification::PRIORITY_NORMAL,
        );
    }

    public function aiQuotaUpdated(User $user, int $limit): Notification
    {
        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_AI_UPDATED,
            title:     'AI generation limit updated',
            message:   "Your AI generation limit has been set to {$limit} for this period.",
            data:      ['ai_limit' => $limit],
            actionUrl: '/ai-generate',
            icon:      'sparkles',
            priority:  Notification::PRIORITY_NORMAL,
        );
    }

    public function fbQuotaUpdated(User $user, ?int $limit): Notification
    {
        $message = $limit === null
            ? 'Your Facebook post limit has been reset to your plan default.'
            : "Your Facebook post limit has been set to {$limit} for this period.";

        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_FB_QUOTA_UPDATED,
            title:     'Facebook post limit updated',
            message:   $message,
            data:      ['fb_limit' => $limit],
            actionUrl: '/ai-generate',
            icon:      'facebook',
            priority:  Notification::PRIORITY_NORMAL,
        );
    }

    public function usageReset(User $user, string $feature): Notification
    {
        $labels = [
            'sms'          => 'SMS usage',
            'ai'           => 'AI generation usage',
            'fb_posts'     => 'Facebook post usage',
        ];
        $label = $labels[$feature] ?? $feature;

        return $this->notify(
            user:      $user,
            type:      Notification::TYPE_USAGE_RESET,
            title:     'Usage counter reset',
            message:   "Your {$label} counter has been reset to 0. You start this period fresh.",
            data:      ['feature' => $feature],
            actionUrl: '/plan-details',
            icon:      'check-circle',
            priority:  Notification::PRIORITY_LOW,
        );
    }
}
