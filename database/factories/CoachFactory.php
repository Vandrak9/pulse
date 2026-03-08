<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Coach>
 */
class CoachFactory extends Factory
{
    public function definition(): array
    {
        $specializations = [
            'Silový tréning', 'Joga a meditácia', 'Výživa a dietetika',
            'Beh a kardio', 'Wellness a relaxácia', 'CrossFit',
        ];

        return [
            'user_id'          => User::factory()->state(['role' => 'coach']),
            'bio'              => fake()->paragraph(3),
            'specialization'   => fake()->randomElement($specializations),
            'monthly_price'    => fake()->randomFloat(2, 5, 30),
            'is_verified'      => false,
            'rating_avg'       => 0,
            'rating_count'     => 0,
            'subscriber_count' => 0,
            'messages_access'  => 'everyone',
        ];
    }
}
