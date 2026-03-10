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
            $table->boolean('email_notif_new_subscriber')->default(true)->after('notif_new_like');
            $table->boolean('email_notif_new_message')->default(true)->after('email_notif_new_subscriber');
            $table->boolean('email_notif_new_review')->default(true)->after('email_notif_new_message');
            $table->boolean('email_notif_new_like')->default(false)->after('email_notif_new_review');
            $table->boolean('email_notif_new_post')->default(true)->after('email_notif_new_like');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_notif_new_subscriber',
                'email_notif_new_message',
                'email_notif_new_review',
                'email_notif_new_like',
                'email_notif_new_post',
            ]);
        });
    }
};
