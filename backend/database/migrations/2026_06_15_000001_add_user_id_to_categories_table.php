<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Nullable: NULL = system category (visible to everyone), int = user-owned category
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();

            // Drop the global unique constraint on slug — slugs are now unique per-user
            // (system categories enforce uniqueness via the seeder + PHP checks)
            $table->dropUnique('categories_slug_unique');

            // Composite unique: same slug can exist for different users, but not twice for the same user.
            // MySQL allows multiple NULL values in a unique index, which is intentional here:
            // system categories (user_id=NULL) uniqueness is enforced in PHP, not the DB constraint.
            $table->unique(['user_id', 'slug'], 'categories_user_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_user_slug_unique');
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            $table->unique('slug');
        });
    }
};
