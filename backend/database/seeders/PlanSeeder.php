<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'          => 'Starter',
                'slug'          => 'starter',
                'price'         => 149.00,
                'currency'      => 'BDT',
                'duration'      => 'monthly',
                'duration_days' => 30,
                'is_active'     => true,
                'features'      => [
                    'Product & order management',
                    '30 Facebook posts / month',
                    'Steadfast & Pathao courier',
                    '10 promotional SMS / month',
                    '5 AI-generated posts / month',
                ],
                'limits' => [
                    'fbPosts'       => 30,
                    'aiGenerations' => 5,
                    'sms'           => 10,
                ],
            ],
            [
                'name'          => 'Growth',
                'slug'          => 'growth',
                'price'         => 599.00,
                'currency'      => 'BDT',
                'duration'      => 'monthly',
                'duration_days' => 30,
                'is_active'     => true,
                'features'      => [
                    'Everything in Starter',
                    '300 Facebook posts / month',
                    '60 AI-generated posts / month',
                    '300 promotional SMS / month',
                    'Faster processing',
                    'Priority support',
                    'Bulk product upload',
                ],
                'limits' => [
                    'fbPosts'       => 300,
                    'aiGenerations' => 60,
                    'sms'           => 300,
                ],
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
