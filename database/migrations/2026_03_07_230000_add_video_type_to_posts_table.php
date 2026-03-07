<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add video_type
        Schema::table('posts', function (Blueprint $table) {
            $table->string('video_type', 10)->nullable()->after('media_type');
        });

        // Replace string video_duration with integer (seconds)
        DB::statement('ALTER TABLE posts DROP COLUMN IF EXISTS video_duration');
        Schema::table('posts', function (Blueprint $table) {
            $table->unsignedInteger('video_duration')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('video_type');
            $table->dropColumn('video_duration');
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->string('video_duration')->nullable();
        });
    }
};
