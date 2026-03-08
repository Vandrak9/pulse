<?php

namespace Tests\Feature;

use App\Models\Coach;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_cannot_send_message(): void
    {
        $coach = Coach::factory()->create();
        $coachUser = $coach->user;

        $response = $this->postJson("/messages/{$coachUser->id}", [
            'content' => 'Ahoj!',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_view_messages_index(): void
    {
        $fan = User::factory()->create(['role' => 'fan']);

        $response = $this->actingAs($fan)->get('/messages');

        $response->assertStatus(200);
    }

    public function test_cannot_message_nonexistent_user(): void
    {
        $fan = User::factory()->create(['role' => 'fan']);

        $response = $this->actingAs($fan)
            ->postJson('/messages/99999', [
                'content' => 'Ahoj!',
            ]);

        $response->assertStatus(404);
    }
}
