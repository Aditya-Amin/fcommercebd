<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionRenewalMail;
use App\Models\Subscription;
use App\Services\Admin\AdminNotificationService;
use App\Services\Sms\SmsService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Daily renewal-reminder dispatcher.
 *
 * Three sweeps per run:
 *   1. T-3 days: subscriptions expiring in 2-3 days, no expiry_3d stamp
 *   2. T-1 day:  subscriptions expiring in 0-1 day,  no expiry_1d stamp
 *   3. T+0:      subscriptions just past expiry,     no expired stamp
 *
 * Each notification sends BOTH email + SMS, idempotent via the *_notified_at
 * columns. Run safely as often as you like (hourly, daily — doesn't matter).
 *
 * The fourth sweep reconciles status='active' rows that crossed expiry,
 * flipping them to 'expired' so admin reports stay accurate.
 */
class SendSubscriptionReminders extends Command
{
    protected $signature = 'subscriptions:send-reminders {--dry-run : Log what would send without dispatching}';
    protected $description = 'Send T-3 / T-1 / expired renewal reminders via email + SMS';

    public function __construct(private readonly SmsService $sms)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $now = Carbon::now();

        $this->info("Subscription reminder sweep at {$now->toDateTimeString()}" . ($dryRun ? ' (dry-run)' : ''));

        $sent3d = $this->sweep(
            kind: SubscriptionRenewalMail::KIND_EXPIRING_3D,
            stampColumn: 'expiry_3d_notified_at',
            query: fn () => Subscription::query()
                ->where('status', 'active')
                ->whereBetween('expiry_date', [$now->copy()->addDays(2), $now->copy()->addDays(3)])
                ->whereNull('expiry_3d_notified_at'),
            dryRun: $dryRun,
        );

        $sent1d = $this->sweep(
            kind: SubscriptionRenewalMail::KIND_EXPIRING_1D,
            stampColumn: 'expiry_1d_notified_at',
            query: fn () => Subscription::query()
                ->where('status', 'active')
                ->whereBetween('expiry_date', [$now, $now->copy()->addDay()])
                ->whereNull('expiry_1d_notified_at'),
            dryRun: $dryRun,
        );

        $sentExpired = $this->sweep(
            kind: SubscriptionRenewalMail::KIND_EXPIRED,
            stampColumn: 'expired_notified_at',
            query: fn () => Subscription::query()
                ->whereIn('status', ['active', 'expired'])
                ->where('expiry_date', '<=', $now)
                ->where('expiry_date', '>=', $now->copy()->subDays(2))
                ->whereNull('expired_notified_at'),
            dryRun: $dryRun,
        );

        // Status reconciliation: any active subscription past expiry flips to
        // expired. Done row-by-row (not a bulk update) so each flip raises an
        // admin notification for the dashboard bell.
        $reconciled = 0;
        if (! $dryRun) {
            Subscription::query()
                ->where('status', 'active')
                ->where('expiry_date', '<=', $now)
                ->with(['user', 'plan'])
                ->chunkById(100, function ($subs) use (&$reconciled) {
                    foreach ($subs as $sub) {
                        $sub->forceFill(['status' => 'expired'])->save();
                        if ($sub->user) {
                            AdminNotificationService::subscriptionExpired($sub->user, $sub);
                        }
                        $reconciled++;
                    }
                });
        }

        $this->info("Sent: 3d={$sent3d}, 1d={$sent1d}, expired={$sentExpired}; reconciled={$reconciled}");
        return self::SUCCESS;
    }

    /**
     * @param  callable(): \Illuminate\Database\Eloquent\Builder  $query
     */
    private function sweep(string $kind, string $stampColumn, callable $query, bool $dryRun): int
    {
        $sent = 0;

        $query()
            ->with(['user', 'plan'])
            ->chunkById(100, function ($subs) use (&$sent, $kind, $stampColumn, $dryRun) {
                foreach ($subs as $sub) {
                    $user = $sub->user;
                    if (! $user) continue;

                    if ($dryRun) {
                        $this->line("  [dry] {$kind} → user={$user->id} sub={$sub->id} expires={$sub->expiry_date}");
                        $sent++;
                        continue;
                    }

                    try {
                        $this->dispatch($sub, $user, $kind);
                        $sub->forceFill([$stampColumn => now()])->save();
                        $sent++;
                    } catch (\Throwable $e) {
                        Log::error('subscription_reminder_dispatch_failed', [
                            'sub_id' => $sub->id,
                            'kind'   => $kind,
                            'err'    => $e->getMessage(),
                        ]);
                    }
                }
            });

        return $sent;
    }

    private function dispatch(Subscription $sub, $user, string $kind): void
    {
        $renewUrl = rtrim((string) config('bkash.frontend_url'), '/') . '/subscription-expired';

        if (! empty($user->email)) {
            Mail::to($user->email)->queue(
                new SubscriptionRenewalMail($user, $sub, $kind, $renewUrl)
            );
        }

        if (! empty($user->phone)) {
            $this->sms->send($user->phone, $this->smsBody($sub, $kind, $renewUrl));
        }
    }

    private function smsBody(Subscription $sub, string $kind, string $renewUrl): string
    {
        $planName = optional($sub->plan)->name ?? 'plan';
        $expiry = optional($sub->expiry_date)->format('d M');
        $brand = config('sms.greenweb.prefix', 'FcommerceBD');

        return match ($kind) {
            SubscriptionRenewalMail::KIND_EXPIRING_3D =>
                "{$brand}: Your {$planName} plan expires on {$expiry} (3 days left). Renew: {$renewUrl}",
            SubscriptionRenewalMail::KIND_EXPIRING_1D =>
                "{$brand}: Your {$planName} plan expires tomorrow ({$expiry}). Renew now: {$renewUrl}",
            SubscriptionRenewalMail::KIND_EXPIRED =>
                "{$brand}: Your {$planName} plan has expired. Renew to restore dashboard access: {$renewUrl}",
            default => "{$brand}: Subscription update. {$renewUrl}",
        };
    }
}
