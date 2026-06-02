<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['slug' => 'women',       'name' => 'Women',       'name_bn' => 'মহিলাদের পোশাক',     'sort_order' => 1],
            ['slug' => 'men',         'name' => 'Men',         'name_bn' => 'পুরুষদের পোশাক',     'sort_order' => 2],
            ['slug' => 'kids',        'name' => 'Kids',        'name_bn' => 'বাচ্চাদের পোশাক',    'sort_order' => 3],
            ['slug' => 'accessories', 'name' => 'Accessories', 'name_bn' => 'অ্যাক্সেসরিজ',       'sort_order' => 4],
            ['slug' => 'beauty',      'name' => 'Beauty',      'name_bn' => 'বিউটি ও কসমেটিক্স',   'sort_order' => 5],
            ['slug' => 'home',        'name' => 'Home',        'name_bn' => 'হোম ও লিভিং',         'sort_order' => 6],
        ];

        foreach ($categories as $c) {
            Category::updateOrCreate(['slug' => $c['slug']], $c + ['is_active' => true]);
        }
    }
}
