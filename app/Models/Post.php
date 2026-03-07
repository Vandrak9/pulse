<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = [
        'coach_id',
        'title',
        'content',
        'media_path',
        'thumbnail_path',
        'video_duration',
        'video_type',
        'media_type',
        'is_exclusive',
    ];

    protected function casts(): array
    {
        return [
            'is_exclusive' => 'boolean',
        ];
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(Coach::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(PostLike::class);
    }
}
