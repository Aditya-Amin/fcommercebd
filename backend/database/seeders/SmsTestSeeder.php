<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\SmsBalance;
use App\Models\SmsLog;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates a ready-to-use test user for the SMS usage statistics feature.
 *
 * What this seeds:
 *   1. A test user (sms_test@fcommerce.bd / password: password)
 *   2. An active Growth subscription (expires 30 days from now)
 *   3. An SMS balance: 300 total, 45 used, 255 remaining
 *   4. 45 sample SMS log entries (mix of mock + failed statuses)
 *
 * Run standalone:  php artisan db:seed --class=SmsTestSeeder
 * Wipe and re-run: php artisan db:seed --class=SmsTestSeeder (uses updateOrCreate — safe to re-run)
 */
class SmsTestSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Ensure Growth plan exists ──────────────────────────────────────
        $growthPlan = Plan::where('slug', 'growth')->first();

        if (! $growthPlan) {
            $this->command->warn('Growth plan not found. Run PlanSeeder first: php artisan db:seed --class=PlanSeeder');
            return;
        }

        $smsLimit = (int) ($growthPlan->limits['sms'] ?? 300);

        // ── 2. Create (or reuse) the test user ────────────────────────────────
        $user = User::firstOrCreate(
            ['email' => 'sms_test@fcommerce.bd'],
            [
                'name'     => 'SMS Test User',
                'business' => 'Test Business',
                'phone'    => '01711000001',
                'password' => Hash::make('password'),
            ]
        );

        // ── 3. Create an active Growth subscription ───────────────────────────
        // updateOrCreate so re-running the seeder doesn't stack duplicate rows.
        $subscription = Subscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'plan_id' => $growthPlan->id,
                'status'  => 'active',
            ],
            [
                'transaction_id' => 'SEED-SMS-' . $user->id,
                'amount'         => $growthPlan->price,
                'start_date'     => now()->subDays(5),        // started 5 days ago
                'expiry_date'    => now()->addDays(25),       // 25 days remaining
            ]
        );

        // ── 4. Create the SMS balance ─────────────────────────────────────────
        $usedSms = 45;

        $balance = SmsBalance::updateOrCreate(
            [
                'user_id'         => $user->id,
                'subscription_id' => $subscription->id,
            ],
            [
                'total_sms'    => $smsLimit,           // 300
                'used_sms'     => $usedSms,            // 45
                'period_start' => $subscription->start_date,
                'period_end'   => $subscription->expiry_date,
            ]
        );

        // ── 5. Create sample SMS logs ─────────────────────────────────────────
        // Only add logs if the balance was just created (avoid duplicate rows on re-run).
        if ($balance->wasRecentlyCreated) {
            $sampleNumbers = [
                '01711111111', '01722222222', '01733333333',
                '01744444444', '01755555555', '01766666666',
            ];

            $sampleMessages = [
                'আপনার অর্ডার নিশ্চিত হয়েছে। ধন্যবাদ!',
                'আপনার পণ্য পাঠানো হয়েছে। ট্র্যাক করুন: SF123456',
                'বিশেষ অফার: আজই অর্ডার করুন ৳৫০ ছাড়ে!',
                'আপনার পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে।',
                'ডেলিভারি সম্পন্ন হয়েছে। রিভিউ দিন!',
            ];

            // Spread the 45 logs across the last 5 days (9 per day)
            $logs = [];
            for ($i = 0; $i < $usedSms; $i++) {
                $daysAgo  = (int) floor($i / 9); // 9 per day → 5 days of history
                $status   = $i % 7 === 0         // every 7th is "failed", rest are mock
                    ? SmsLog::STATUS_FAILED
                    : SmsLog::STATUS_MOCK;

                $logs[] = [
                    'user_id'          => $user->id,
                    'sms_balance_id'   => $balance->id,
                    'recipient_number' => $sampleNumbers[$i % count($sampleNumbers)],
                    'message'          => $sampleMessages[$i % count($sampleMessages)],
                    'status'           => $status,
                    'gateway_response' => null,
                    'created_at'       => now()->subDays($daysAgo)->subMinutes($i * 3),
                ];
            }

            // Bulk insert for speed
            SmsLog::insert($logs);
        }

        $remaining = $smsLimit - $usedSms;
        $this->command->info("Seeded SMS test user:");
        $this->command->info("  Email:     sms_test@fcommerce.bd");
        $this->command->info("  Password:  password");
        $this->command->info("  Plan:      Growth (৳599/month)");
        $this->command->info("  SMS:       {$usedSms} used / {$smsLimit} total / {$remaining} remaining");
        $this->command->info("  Expires:   " . $subscription->expiry_date->toDateString());
    }
}
