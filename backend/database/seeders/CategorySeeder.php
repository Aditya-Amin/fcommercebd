<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // Clothing & fashion
            ['slug' => 'women',       'name' => 'Women',           'name_bn' => 'মহিলাদের পোশাক',       'sort_order' => 1],
            ['slug' => 'men',         'name' => 'Men',             'name_bn' => 'পুরুষদের পোশাক',       'sort_order' => 2],
            ['slug' => 'kids',        'name' => 'Kids',            'name_bn' => 'বাচ্চাদের পোশাক',      'sort_order' => 3],
            ['slug' => 'accessories', 'name' => 'Accessories',     'name_bn' => 'অ্যাক্সেসরিজ',         'sort_order' => 4],

            // Beauty & personal care
            ['slug' => 'beauty',      'name' => 'Beauty',          'name_bn' => 'বিউটি ও কসমেটিক্স',   'sort_order' => 5],
            ['slug' => 'cosmetics',   'name' => 'Cosmetics',       'name_bn' => 'কসমেটিক্স',            'sort_order' => 6],

            // Home & lifestyle
            ['slug' => 'home',        'name' => 'Home & Living',   'name_bn' => 'হোম ও লিভিং',          'sort_order' => 7],

            // Food & grocery
            ['slug' => 'foods',       'name' => 'Foods',           'name_bn' => 'খাদ্য পণ্য',           'sort_order' => 8],
            ['slug' => 'fruits',      'name' => 'Fruits',          'name_bn' => 'ফলমূল',                'sort_order' => 9],

            // Electronics & tech
            ['slug' => 'electronics', 'name' => 'Electronics',     'name_bn' => 'ইলেকট্রনিক্স',        'sort_order' => 10],
            ['slug' => 'mobiles',     'name' => 'Mobiles',         'name_bn' => 'মোবাইল ফোন',           'sort_order' => 11],
            ['slug' => 'computers',   'name' => 'Computers',       'name_bn' => 'কম্পিউটার ও ল্যাপটপ', 'sort_order' => 12],
        ];

        foreach ($categories as $c) {
            // user_id = NULL marks these as system categories visible to all users.
            Category::updateOrCreate(
                ['slug' => $c['slug'], 'user_id' => null],
                $c + ['is_active' => true, 'user_id' => null]
            );
        }
    }
}
