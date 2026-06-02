<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds the products + product_images tables from the frontend mock data
 * file (lib/mock/products/products.json), so the dashboard has realistic
 * data to demo against.
 *
 * Run with:
 *   php artisan db:seed --class=ProductSeeder
 *
 * Idempotent: matches on (user_id, slug) so re-running doesn't duplicate.
 *
 * Targets the first user in the DB (or a USER_EMAIL env override) so the
 * seeder doesn't need a fresh install.
 */
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Resolve target user.
        $user = env('USER_EMAIL')
            ? User::where('email', env('USER_EMAIL'))->first()
            : User::orderBy('id')->first();

        if (! $user) {
            $this->command->error('No user found. Create a user first or pass USER_EMAIL=...');
            return;
        }

        $this->command->info("Seeding products for user: {$user->email} (id={$user->id})");

        // The frontend mock JSON lives outside backend/, so resolve it relative
        // to this file. Adjust if you move the seeder.
        $jsonPath = base_path('../lib/mock/products/products.json');

        if (! is_file($jsonPath)) {
            $this->command->error("Mock JSON not found at: {$jsonPath}");
            return;
        }

        $payload = json_decode((string) file_get_contents($jsonPath), true);
        $items   = $payload['data'] ?? [];

        if (empty($items)) {
            $this->command->warn('Mock JSON contained no products.');
            return;
        }

        $created = 0;
        $updated = 0;

        foreach ($items as $item) {
            $categoryId = isset($item['category'])
                ? Category::where('slug', $item['category'])->value('id')
                : null;

            $product = Product::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'slug'    => $item['slug'],
                ],
                [
                    'category_id'       => $categoryId,
                    'title'             => $item['title'],
                    'short_description' => $item['shortDescription'] ?? null,
                    'description'       => $item['description'] ?? '',
                    'price'             => $item['price'],
                    'compare_price'     => $item['comparePrice'] ?? null,
                    'currency'          => 'BDT',
                    'stock'             => (int) ($item['stock'] ?? 0),
                    'status'            => $item['status'] ?? 'draft',
                    'tags'              => $item['tags'] ?? [],
                    'facebook_post_id'  => $item['facebookPostId'] ?? null,
                ]
            );

            $product->wasRecentlyCreated ? $created++ : $updated++;

            // Re-sync images: delete old ones, recreate from mock.
            $product->images()->delete();
            foreach (($item['images'] ?? []) as $i => $img) {
                $product->images()->create([
                    'url'        => $img['url'],
                    'alt'        => $img['alt'] ?? null,
                    'is_primary' => ! empty($img['isPrimary']) || $i === 0,
                    'sort_order' => $i,
                ]);
            }
        }

        $this->command->info("Done. Created: {$created}, updated: {$updated}.");
    }
}
