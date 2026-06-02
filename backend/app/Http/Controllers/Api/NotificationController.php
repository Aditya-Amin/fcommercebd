<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * In-app notifications for the bell dropdown / notifications page.
 *
 * Pagination contract matches the rest of the API:
 *   { data: Notification[], total, page, perPage, unreadCount }
 *
 * The SPA polls /unread-count every 15s; when it rises, it refetches
 * page 1 and toasts the new items. (Phase 2: swap polling for Reverb.)
 */
class NotificationController extends Controller
{
    private const DEFAULT_PER_PAGE = 10;
    private const MAX_PER_PAGE     = 50;

    /** GET /api/notifications */
    public function index(Request $request): JsonResponse
    {
        $userId    = $request->user()->id;
        $perPage   = (int) $request->query('per_page', self::DEFAULT_PER_PAGE);
        $perPage   = max(1, min(self::MAX_PER_PAGE, $perPage));
        $page      = max(1, (int) $request->query('page', 1));
        $unreadOnly = filter_var($request->query('unread_only', '0'), FILTER_VALIDATE_BOOLEAN);

        $base = Notification::query()->forUser($userId);

        $listQuery = (clone $base)->orderByDesc('created_at');
        if ($unreadOnly) $listQuery->whereNull('read_at');

        $total       = (clone $listQuery)->count();
        $unreadCount = (clone $base)->whereNull('read_at')->count();

        $items = $listQuery
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return response()->json([
            'data'        => NotificationResource::collection($items),
            'total'       => $total,
            'page'        => $page,
            'perPage'     => $perPage,
            'unreadCount' => $unreadCount,
        ]);
    }

    /** GET /api/notifications/unread-count */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::query()
            ->forUser($request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['data' => ['count' => $count]]);
    }

    /** POST /api/notifications/{notification}/read */
    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        abort_if($notification->user_id !== $request->user()->id, 403);

        $notification->markAsRead();
        return response()->json(['data' => new NotificationResource($notification)]);
    }

    /** POST /api/notifications/mark-all-read */
    public function markAllRead(Request $request): JsonResponse
    {
        $updated = Notification::query()
            ->forUser($request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['data' => ['updated' => $updated]]);
    }

    /** DELETE /api/notifications/{notification} */
    public function destroy(Request $request, Notification $notification): Response
    {
        abort_if($notification->user_id !== $request->user()->id, 403);

        $notification->delete();
        return response()->noContent();
    }
}
