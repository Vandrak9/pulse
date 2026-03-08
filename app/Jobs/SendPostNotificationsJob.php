<?php

namespace App\Jobs;

use App\Models\Post;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class SendPostNotificationsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $postId,
        public readonly string $type = 'new_post',
    ) {
        $this->onQueue('notifications');
    }

    public function handle(): void
    {
        $post = Post::with('coach.user')->find($this->postId);
        if (!$post) {
            return;
        }

        $coach    = $post->coach;
        $coachName = $coach->user->name;
        $isExclusive = $post->is_exclusive;
        $isReel   = $this->type === 'new_reel';

        // Determine recipient user IDs:
        // - Reels:           all followers (public content)
        // - Exclusive posts: subscribers only
        // - Public posts:    followers + subscribers (merged, deduplicated)
        if ($isReel) {
            $userIds = DB::table('follows')
                ->where('following_id', $coach->user_id)
                ->pluck('follower_id');
        } elseif ($isExclusive) {
            $userIds = DB::table('subscriptions')
                ->where('stripe_status', 'active')
                ->where('subscribable_id', $coach->id)
                ->pluck('user_id');
        } else {
            $followerIds = DB::table('follows')
                ->where('following_id', $coach->user_id)
                ->pluck('follower_id');
            $subscriberIds = DB::table('subscriptions')
                ->where('stripe_status', 'active')
                ->where('subscribable_id', $coach->id)
                ->pluck('user_id');
            $userIds = $followerIds->merge($subscriberIds)->unique()->values();
        }

        if ($userIds->isEmpty()) {
            return;
        }

        if ($isReel) {
            $title = "Nový reel od {$coachName}";
            $body  = "⚡ {$coachName} pridal nový reel: \"{$post->title}\"";
        } elseif ($isExclusive) {
            $title = "Exkluzívny obsah od {$coachName}";
            $body  = "🔒 {$coachName} pridal exkluzívny príspevok: \"{$post->title}\"";
        } else {
            $title = "Nový príspevok od {$coachName}";
            $body  = "📸 {$coachName} pridal nový príspevok: \"{$post->title}\"";
        }

        $now = now();
        $data = json_encode(['post_id' => $post->id, 'coach_id' => $coach->id]);

        // Batch insert in chunks to avoid oversized queries
        collect($userIds)->chunk(50)->each(function ($chunk) use ($title, $body, $data, $now) {
            $rows = $chunk->map(fn ($uid) => [
                'user_id'    => $uid,
                'type'       => $this->type,
                'title'      => $title,
                'body'       => $body,
                'data'       => $data,
                'is_read'    => false,
                'read_at'    => null,
                'created_at' => $now,
                'updated_at' => $now,
            ])->values()->all();

            DB::table('notifications')->insert($rows);
        });
    }
}
