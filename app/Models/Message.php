<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'content',
        'price_paid',
        'stripe_payment_id',
        'is_paid',
        'is_read',
        'read_at',
        'message_type',
        'media_path',
        'media_thumbnail',
        'media_duration',
        'media_size',
        'is_broadcast',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'price_paid' => 'decimal:2',
            'is_paid' => 'boolean',
            'is_read' => 'boolean',
            'is_broadcast' => 'boolean',
            'read_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
