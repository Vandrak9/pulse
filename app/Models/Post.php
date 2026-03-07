<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    protected $fillable = [
        'coach_id',
        'title',
        'content',
        'media_path',
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
}
