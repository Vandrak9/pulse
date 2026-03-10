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
        Schema::create('live_streams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained()->onDelete('cascade');
            $table->string('mux_live_stream_id');
            $table->string('mux_playback_id')->nullable();
            $table->string('stream_key');
            $table->string('rtmp_url')->default('rtmps://global-live.mux.com:443/app');
            $table->enum('status', ['idle', 'active', 'disabled'])->default('idle');
            $table->enum('access', ['subscribers', 'everyone'])->default('subscribers');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->integer('peak_viewers')->default(0);
            $table->integer('viewers_count')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_streams');
    }
};
