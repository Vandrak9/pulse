<?php

namespace Tests\Feature;

use App\Models\Coach;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_fan_can_view_coach_profile(): void
    {
        $coach = Coach::factory()->create();

        $response = $this->get("/coaches/{$coach->id}");

        $response->assertStatus(200);
    }

    public function test_unauthenticated_cannot_subscribe(): void
    {
        $coach = Coach::factory()->create();

        $response = $this->get("/subscribe/{$coach->id}");

        $response->assertRedirect('/login');
    }

    public function test_coach_cannot_review_themselves(): void
    {
        $coach = Coach::factory()->create();
        $coachUser = $coach->user;

        $response = $this->actingAs($coachUser)
            ->postJson("/coaches/{$coach->id}/reviews", [
                'rating'  => 5,
                'content' => 'Skvelý kouč!',
            ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Nemôžeš hodnotiť vlastný profil.');
    }

    public function test_fan_cannot_review_without_subscription(): void
    {
        $fan   = User::factory()->create(['role' => 'fan']);
        $coach = Coach::factory()->create();

        $response = $this->actingAs($fan)
            ->postJson("/coaches/{$coach->id}/reviews", [
                'rating'  => 4,
                'content' => 'Dobrý obsah.',
            ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Recenzie môžu zanechať len predplatitelia.');
    }
}
