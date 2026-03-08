<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostMedia extends Model
{
    public $timestamps = false;

    protected $table = 'post_media';

    protected $fillable = [
        'post_id',
        'media_path',
        'media_type',
        'media_thumbnail',
        'sort_order',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
