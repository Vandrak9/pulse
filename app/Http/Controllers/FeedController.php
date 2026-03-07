<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\Post;
use App\Models\PostLike;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $posts = Post::with(['coach.user'])
            ->withCount('likes')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $likedIds = PostLike::where('user_id', $userId)
            ->whereIn('post_id', $posts->pluck('id'))
            ->pluck('post_id')
            ->all();

        $mappedPosts = $posts->map(fn ($post) => [
            'id'             => $post->id,
            'title'          => $post->title,
            'content'        => $post->content,
            'media_type'     => $post->media_type,
            'video_duration' => $post->video_duration,
            'is_exclusive'   => $post->is_exclusive,
            'like_count'     => $post->likes_count,
            'is_liked'       => in_array($post->id, $likedIds),
            'created_at'     => $post->created_at->toIso8601String(),
            'coach' => [
                'id'             => $post->coach->id,
                'name'           => $post->coach->user->name,
                'specialization' => $post->coach->specialization,
                'monthly_price'  => $post->coach->monthly_price,
                'avatar_url'     => $post->coach->avatar_path
                    ? Storage::url($post->coach->avatar_path)
                    : null,
            ],
        ]);

        $coaches = Coach::with('user')
            ->orderByDesc('subscriber_count')
            ->limit(10)
            ->get()
            ->map(fn ($coach) => [
                'id'         => $coach->id,
                'name'       => $coach->user->name,
                'avatar_url' => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ]);

        return Inertia::render('Feed', [
            'posts'   => $mappedPosts,
            'coaches' => $coaches,
        ]);
    }

    public function like(Request $request, Post $post): RedirectResponse
    {
        $userId = $request->user()->id;

        $existing = PostLike::where('user_id', $userId)
            ->where('post_id', $post->id)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            PostLike::create(['user_id' => $userId, 'post_id' => $post->id]);
        }

        return back();
    }
}
