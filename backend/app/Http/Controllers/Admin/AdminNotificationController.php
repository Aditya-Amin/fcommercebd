<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    /** GET /admin/notifications — paginated list + unread count */
    public function index(): JsonResponse
    {
        $notifications = AdminNotification::latest()
            ->limit(40)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'message'    => $n->message,
                'icon'       => $n->icon,
                'color'      => $n->color,
                'action_url' => $n->action_url,
                'read'       => $n->isRead(),
                'time'       => $n->created_at->diffForHumans(),
                'time_full'  => $n->created_at->format('M j, Y g:i A'),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => AdminNotification::unread()->count(),
        ]);
    }

    /** GET /admin/notifications/unread-count — lightweight poll endpoint */
    public function unreadCount(): JsonResponse
    {
        return response()->json([
            'unread_count' => AdminNotification::unread()->count(),
        ]);
    }

    /** POST /admin/notifications/mark-all-read */
    public function markAllRead(): JsonResponse
    {
        AdminNotification::unread()->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /** POST /admin/notifications/{notification}/read */
    public function markRead(AdminNotification $notification): JsonResponse
    {
        $notification->markAsRead();

        return response()->json(['ok' => true]);
    }

    /** DELETE /admin/notifications/{notification} */
    public function destroy(AdminNotification $notification): JsonResponse
    {
        $notification->delete();

        return response()->json(['ok' => true]);
    }

    /** DELETE /admin/notifications — clear all */
    public function destroyAll(): JsonResponse
    {
        AdminNotification::query()->delete();

        return response()->json(['ok' => true]);
    }
}
