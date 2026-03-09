<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notif_new_subscriber')->default(true)->after('profile_is_public');
            $table->boolean('notif_new_message')->default(true)->after('notif_new_subscriber');
            $table->boolean('notif_new_review')->default(true)->after('notif_new_message');
            $table->boolean('notif_new_like')->default(false)->after('notif_new_review');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['notif_new_subscriber', 'notif_new_message', 'notif_new_review', 'notif_new_like']);
        });
    }
};
