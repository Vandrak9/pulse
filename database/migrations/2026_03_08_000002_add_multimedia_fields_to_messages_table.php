<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('message_type')->default('text')->after('content');
            $table->string('media_path')->nullable()->after('message_type');
            $table->string('media_thumbnail')->nullable()->after('media_path');
            $table->integer('media_duration')->nullable()->after('media_thumbnail');
            $table->integer('media_size')->nullable()->after('media_duration');
            $table->boolean('is_broadcast')->default(false)->after('is_read');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['message_type', 'media_path', 'media_thumbnail', 'media_duration', 'media_size', 'is_broadcast']);
        });
    }
};
