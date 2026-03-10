<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveStream extends Model
{
    protected $fillable = [
        'coach_id',
        'mux_live_stream_id',
        'mux_playback_id',
        'stream_key',
        'rtmp_url',
        'status',
        'access',
        'title',
        'description',
        'started_at',
        'ended_at',
        'peak_viewers',
        'viewers_count',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at'   => 'datetime',
        ];
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(Coach::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LiveStreamMessage::class);
    }
}
