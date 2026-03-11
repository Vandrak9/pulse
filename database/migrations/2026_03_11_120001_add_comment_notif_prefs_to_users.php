<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notif_new_comment')->default(true)->after('notif_new_like');
            $table->boolean('notif_new_reply')->default(true)->after('notif_new_comment');
            $table->boolean('email_notif_new_comment')->default(false)->after('email_notif_new_post');
            $table->boolean('email_notif_new_reply')->default(false)->after('email_notif_new_comment');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['notif_new_comment', 'notif_new_reply', 'email_notif_new_comment', 'email_notif_new_reply']);
        });
    }
};
