<?php

namespace App\Services\Sms;

use App\Models\SmsBalance;
use App\Models\SmsLog;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SmsBalanceService
 * ─────────────────────────────────────────────────────────────────────────────
 * All SMS quota logic lives here. Nothing else should touch sms_balances or
 * sms_logs directly — go through this service so quota accounting stays consistent.
 *
 * Three main responsibilities:
 *   1. activate()   — called when a subscription is created/renewed
 *   2. send()       — check quota, deduct, log, dispatch to SmsService
 *   3. stats()      — snapshot for the API response
 */
class SmsBalanceService
{
    public function __construct(private readonly SmsService $smsService) {}

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ACTIVATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create an SMS balance for a newly activated subscription.
     *
     * Call this from BkashController::finalize() (or any place that creates
     * a Subscription with status=active). Safe to call multiple times —
     * updateOrCreate prevents duplicate rows.
     *
     * @return SmsBalance  The freshly created (or existing) balance row.
     */
    public function activate(Subscription $subscription): SmsBalance
    {
        // Read the SMS limit from the plan's limits JSON column
        $smsLimit = (int) ($subscription->plan->limits['sms'] ?? 0);

        $balance = SmsBalance::updateOrCreate(
            // Lookup key — one balance per subscription
            ['subscription_id' => $subscription->id],
            // Values set only on creation (updateOrCreate doesn't overwrite on match)
            [
                'user_id'      => $subscription->user_id,
                'total_sms'    => $smsLimit,
                'used_sms'     => 0,
                'period_start' => $subscription->start_date ?? now(),
                'period_end'   => $subscription->expiry_date
                    ?? now()->addDays($subscription->plan->duration_days ?? 30),
            ]
        );

        Log::channel('sms')->info('sms_balance_activated', [
            'user_id'         => $subscription->user_id,
            'subscription_id' => $subscription->id,
            'plan'            => $subscription->plan->slug ?? 'unknown',
            'total_sms'       => $smsLimit,
        ]);

        return $balance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. SEND
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Attempt to send an SMS on behalf of $user.
     *
     * Checks quota → deducts atomically → dispatches to SmsService → logs result.
     *
     * @return array{
     *   ok: bool,
     *   status: string,
     *   message: string,
     *   remaining: int
     * }
     */
    public function send(User $user, string $recipientNumber, string $message): array
    {
        // ── Quota check ───────────────────────────────────────────────────────
        $balance = $this->activeBalanceFor($user);

        if (! $balance) {
            return $this->errorResult('no_active_plan', 'আপনার কোনো সক্রিয় প্ল্যান নেই। SMS পাঠাতে একটি প্যাকেজ কিনুন।');
        }

        if (! $balance->canSend()) {
            $remaining = $balance->remainingSms();
            if ($remaining <= 0) {
                return $this->errorResult('quota_exceeded', "আপনার মাসিক SMS সীমা শেষ হয়ে গেছে। ({$balance->used_sms}/{$balance->total_sms} ব্যবহৃত)");
            }
            // period_end is in the past
            return $this->errorResult('period_expired', 'আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে।');
        }

        // ── Atomic deduct + log ───────────────────────────────────────────────
        // We use a DB transaction + lockForUpdate so two simultaneous requests
        // can't both pass the canSend() check and both deduct from the same balance.
        $logEntry = DB::transaction(function () use ($balance, $user, $recipientNumber, $message) {

            // Re-read the balance with a row lock inside the transaction
            $locked = SmsBalance::lockForUpdate()->find($balance->id);

            if ($locked->remainingSms() <= 0) {
                // Lost the race — another request deducted last SMS simultaneously
                throw new \RuntimeException('quota_exceeded');
            }

            // Deduct one SMS
            $locked->increment('used_sms');

            // Determine which status to log based on mock mode
            $isMock  = config('sms.driver') === 'log' || env('SMS_MOCK', false);

            // Dispatch to the underlying SMS driver
            $sent    = false;
            $gwResp  = null;

            if ($isMock) {
                // Mock mode: skip the real network call, always "succeeds"
                $sent   = true;
                $gwResp = ['mock' => true, 'message' => 'Mock send — no real SMS dispatched'];
            } else {
                // Real mode: delegate to SmsService (greenweb or other driver)
                $sent   = $this->smsService->send($recipientNumber, $message);
                $gwResp = null; // SmsService doesn't expose raw response yet
            }

            $status = match (true) {
                $isMock  => SmsLog::STATUS_MOCK,
                $sent    => SmsLog::STATUS_SENT,
                default  => SmsLog::STATUS_FAILED,
            };

            // Write the immutable log entry
            return SmsLog::create([
                'user_id'          => $user->id,
                'sms_balance_id'   => $locked->id,
                'recipient_number' => $recipientNumber,
                'message'          => $message,
                'status'           => $status,
                'gateway_response' => $gwResp,
            ]);
        });

        // Refresh balance to get the updated used_sms count
        $balance->refresh();

        Log::channel('sms')->info('sms_sent', [
            'user_id'   => $user->id,
            'to'        => $recipientNumber,
            'status'    => $logEntry->status,
            'remaining' => $balance->remainingSms(),
        ]);

        return [
            'ok'        => true,
            'status'    => $logEntry->status,
            'message'   => 'SMS পাঠানো হয়েছে।',
            'remaining' => $balance->remainingSms(),
            'log_id'    => $logEntry->id,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. STATS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Snapshot of the user's current SMS quota for the API response.
     *
     * Matches the shape the frontend expects:
     * {
     *   package_name, total_sms, used_sms, remaining_sms,
     *   reset_at, usage_percentage, has_active_plan
     * }
     */
    public function stats(User $user): array
    {
        $balance = $this->activeBalanceFor($user);

        // No active plan — return a zero-state so the UI can show "no plan" gracefully
        if (! $balance) {
            return [
                'has_active_plan'  => false,
                'package_name'     => null,
                'total_sms'        => 0,
                'used_sms'         => 0,
                'remaining_sms'    => 0,
                'usage_percentage' => 0,
                'reset_at'         => null,
            ];
        }

        // Load the plan name through subscription → plan
        $planName = $balance->subscription?->plan?->name ?? 'Unknown';

        return [
            'has_active_plan'  => true,
            'package_name'     => $planName,
            'total_sms'        => $balance->total_sms,
            'used_sms'         => $balance->used_sms,
            'remaining_sms'    => $balance->remainingSms(),
            'usage_percentage' => $balance->usagePercentage(),
            'reset_at'         => $balance->period_end?->toDateString(),
        ];
    }

    /**
     * Recent SMS logs for the usage-log API endpoint.
     * Returns a plain array of rows ready to JSON-encode.
     */
    public function recentLogs(User $user, int $limit = 20): array
    {
        return SmsLog::forUser($user)
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (SmsLog $log) => [
                'id'               => $log->id,
                'recipient_number' => $log->recipient_number,
                // Truncate message for the table view — full text in a future detail API
                'message_preview'  => mb_substr($log->message, 0, 60) . (mb_strlen($log->message) > 60 ? '…' : ''),
                'status'           => $log->status,
                'sent_at'          => $log->created_at->toIso8601String(),
            ])
            ->all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fetch the user's active SMS balance (period not yet ended).
     * Eager-loads subscription→plan so stats() doesn't issue extra queries.
     */
    private function activeBalanceFor(User $user): ?SmsBalance
    {
        return SmsBalance::forUser($user)
            ->active()
            ->with('subscription.plan')
            ->latest()
            ->first();
    }

    /** Build a consistent error result array. */
    private function errorResult(string $code, string $message): array
    {
        return [
            'ok'        => false,
            'status'    => $code,
            'message'   => $message,
            'remaining' => 0,
        ];
    }
}
