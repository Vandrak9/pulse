<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'data', 'is_read', 'read_at',
    ];

    protected $casts = [
        'data'     => 'array',
        'is_read'  => 'boolean',
        'read_at'  => 'datetime',
    ];
}
