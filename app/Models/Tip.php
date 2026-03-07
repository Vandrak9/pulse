<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tip extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'fan_id',
        'coach_id',
        'amount',
        'stripe_payment_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function fan(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fan_id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(Coach::class);
    }
}
