<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Broadcast extends Model
{
    protected $fillable = [
        'coach_id',
        'content',
        'message_type',
        'media_path',
        'media_thumbnail',
        'media_duration',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function coach()
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function recipients()
    {
        return $this->hasMany(BroadcastRecipient::class);
    }
}
