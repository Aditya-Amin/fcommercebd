<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlanSeeder::class,
            CategorySeeder::class,
            SmsTestSeeder::class,   // test user with Growth plan + 45/300 SMS used
        ]);
    }
}
