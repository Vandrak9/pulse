<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coach extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bio',
        'specialization',
        'monthly_price',
        'avatar_path',
        'stripe_account_id',
        'stripe_product_id',
        'stripe_price_id',
        'rating_avg',
        'rating_count',
        'is_verified',
        'rating',
        'subscriber_count',
        'messages_access',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'rating' => 'decimal:1',
            'is_verified' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function tips(): HasMany
    {
        return $this->hasMany(Tip::class);
    }
}
