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
        Schema::table('users', function (Blueprint $table) {
            $table->text('profile_bio')->nullable()->after('role');
            $table->string('profile_avatar')->nullable()->after('profile_bio');
            $table->boolean('profile_is_public')->default(true)->after('profile_avatar');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['profile_bio', 'profile_avatar', 'profile_is_public']);
        });
    }
};
