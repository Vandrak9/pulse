<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('media_type', 10)->default('none')->after('is_exclusive'); // none|image|video
            $table->string('thumbnail_path')->nullable()->after('media_path');
            $table->string('video_duration', 10)->nullable()->after('thumbnail_path'); // e.g. "12:34"
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['media_type', 'thumbnail_path', 'video_duration']);
        });
    }
};
