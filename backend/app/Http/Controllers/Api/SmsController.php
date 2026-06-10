<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Sms\SmsBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Handles the three SMS API endpoints:
 *
 *   GET  /api/user/sms/stats  — usage snapshot (quota card data)
 *   POST /api/user/sms/send   — send one SMS (deducts from balance)
 *   GET  /api/user/sms/log    — recent send history (table data)
 *
 * All three require auth:sanctum. SMS sending is intentionally NOT gated by
 * subscription.active middleware here — SmsBalanceService already checks
 * whether the user has an active balance and returns a descriptive error if not.
 */
class SmsController extends Controller
{
    public function __construct(private readonly SmsBalanceService $smsBalance) {}

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/user/sms/stats
     *
     * Returns the current SMS quota snapshot for the authenticated user.
     *
     * Response shape:
     * {
     *   "has_active_plan": true,
     *   "package_name":    "Growth",
     *   "total_sms":       300,
     *   "used_sms":        45,
     *   "remaining_sms":   255,
     *   "usage_percentage": 15.0,
     *   "reset_at":        "2026-07-04"
     * }
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = $this->smsBalance->stats($request->user());

        return response()->json(['data' => $stats]);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api/user/sms/send
     *
     * Body: { "recipient_number": "01711...", "message": "আপনার অর্ডার..." }
     *
     * Validates → checks quota → deducts → dispatches to SmsService → logs.
     *
     * Success (200):
     * { "ok": true, "status": "mock"|"sent", "message": "SMS পাঠানো হয়েছে।", "remaining": 254 }
     *
     * Failure (422 quota exceeded / 403 no plan):
     * { "ok": false, "status": "quota_exceeded", "message": "..." }
     */
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            // BD mobile number: must start with 01 followed by 3-9, then 8 digits
            'recipient_number' => ['required', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'message'          => ['required', 'string', 'min:1', 'max:612'],
        ]);

        $result = $this->smsBalance->send(
            $request->user(),
            $data['recipient_number'],
            $data['message'],
        );

        // Map internal error codes to appropriate HTTP status codes
        if (! $result['ok']) {
            $httpStatus = match ($result['status']) {
                'no_active_plan'  => 403,
                'quota_exceeded'  => 422,
                'period_expired'  => 403,
                default           => 422,
            };
            return response()->json($result, $httpStatus);
        }

        return response()->json($result);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api/user/sms/log
     *
     * Query params:
     *   ?limit=20   — how many records to return (max 100, default 20)
     *
     * Response shape:
     * {
     *   "data": [
     *     {
     *       "id": 1,
     *       "recipient_number": "01711111111",
     *       "message_preview":  "আপনার অর্ডার নিশ্চিত হয়েছে।",
     *       "status":           "mock",
     *       "sent_at":          "2026-06-09T10:00:00+06:00"
     *     },
     *     ...
     *   ]
     * }
     */
    public function log(Request $request): JsonResponse
    {
        $limit = min((int) $request->query('limit', 20), 100);

        $logs = $this->smsBalance->recentLogs($request->user(), $limit);

        return response()->json(['data' => $logs]);
    }
}
