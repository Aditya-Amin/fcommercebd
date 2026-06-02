<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Facebook CDN profile-picture URLs include long signed query strings
 * (>700 chars). The original 500-char column truncates them and the
 * INSERT fails with "Data too long for column 'picture_url'".
 *
 * Promote to TEXT so the URL fits regardless of how Facebook signs it.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('facebook_pages', function (Blueprint $table) {
            $table->text('picture_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('facebook_pages', function (Blueprint $table) {
            $table->string('picture_url', 500)->nullable()->change();
        });
    }
};
