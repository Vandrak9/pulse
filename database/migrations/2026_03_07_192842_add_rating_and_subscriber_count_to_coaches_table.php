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
        Schema::table('coaches', function (Blueprint $table) {
            $table->decimal('rating', 3, 1)->default(5.0)->after('is_verified');
            $table->unsignedInteger('subscriber_count')->default(0)->after('rating');
        });
    }

    public function down(): void
    {
        Schema::table('coaches', function (Blueprint $table) {
            $table->dropColumn(['rating', 'subscriber_count']);
        });
    }
};
