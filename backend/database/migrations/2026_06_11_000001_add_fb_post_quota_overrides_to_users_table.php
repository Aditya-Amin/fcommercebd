<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-user overrides for the Facebook/AI post quota, set by admins from the
 * user-activity screen.
 *
 *  - fb_posts_limit_override : when set, replaces the plan's fbPosts limit for
 *                              this user (raise/lower an individual's cap).
 *  - fb_posts_reset_at       : when set, only posts created AFTER this moment
 *                              count toward usage — i.e. a usage "reset" that
 *                              doesn't delete the user's actual post history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('fb_posts_limit_override')->nullable()->after('phone');
            $table->timestamp('fb_posts_reset_at')->nullable()->after('fb_posts_limit_override');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['fb_posts_limit_override', 'fb_posts_reset_at']);
        });
    }
};
