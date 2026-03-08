<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasColumn('coaches', 'messages_access')) {
            return;
        }

        DB::table('coaches')
            ->where('messages_access', 'followers')
            ->update(['messages_access' => 'everyone']);

        DB::statement("ALTER TABLE coaches ALTER COLUMN messages_access SET DEFAULT 'everyone'");
    }

    public function down(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasColumn('coaches', 'messages_access')) {
            return;
        }

        DB::table('coaches')
            ->where('messages_access', 'everyone')
            ->update(['messages_access' => 'followers']);

        DB::statement("ALTER TABLE coaches ALTER COLUMN messages_access SET DEFAULT 'followers'");
    }
};
