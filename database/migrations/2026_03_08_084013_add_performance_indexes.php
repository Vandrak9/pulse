<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // messages — high-traffic table, queried by sender/receiver pairs + unread status
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['sender_id', 'receiver_id'], 'messages_conversation_idx');
            $table->index(['receiver_id', 'is_read'],   'messages_unread_idx');
            $table->index('created_at',                  'messages_created_at_idx');
        });

        // posts — queried by coach + time, filtered by is_exclusive
        Schema::table('posts', function (Blueprint $table) {
            $table->index(['coach_id', 'created_at'], 'posts_coach_created_idx');
            $table->index('is_exclusive',              'posts_exclusive_idx');
        });

        // coaches — filtered by is_verified, sorted by monthly_price
        Schema::table('coaches', function (Blueprint $table) {
            $table->index('is_verified',   'coaches_verified_idx');
            $table->index('monthly_price', 'coaches_price_idx');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_conversation_idx');
            $table->dropIndex('messages_unread_idx');
            $table->dropIndex('messages_created_at_idx');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_coach_created_idx');
            $table->dropIndex('posts_exclusive_idx');
        });

        Schema::table('coaches', function (Blueprint $table) {
            $table->dropIndex('coaches_verified_idx');
            $table->dropIndex('coaches_price_idx');
        });
    }
};
