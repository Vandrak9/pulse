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

        // Mixed feed — 20 most recent posts
        $posts = Post::with(['coach.user'])
            ->withCount('likes')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        // Reels — separate query, all free reels
        $reelPosts = Post::with(['coach.user'])
            ->withCount('likes')
            ->where('video_type', 'reel')
            ->where('is_exclusive', false)
            ->orderByDesc('created_at')
            ->limit(60)
            ->get();

        // Long videos — separate query
        $videoPosts = Post::with(['coach.user'])
            ->withCount('likes')
            ->where('video_type', 'video')
            ->orderByDesc('created_at')
            ->limit(40)
            ->get();

        $allPosts = $posts->merge($reelPosts)->merge($videoPosts)->unique('id');

        $likedIds = PostLike::where('user_id', $userId)
            ->whereIn('post_id', $allPosts->pluck('id'))
            ->pluck('post_id')
            ->all();

        $mapPost = fn ($post) => [
            'id'             => $post->id,
            'title'          => $post->title,
            'content'        => $post->content,
            'media_type'     => $post->media_type,
            'media_url'      => $post->media_path ?: null,
            'thumbnail_url'  => $post->thumbnail_path
                ? Storage::url($post->thumbnail_path)
                : null,
            'video_type'     => $post->video_type,
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
        ];

        $mappedPosts  = $posts->map($mapPost)->values();
        $mappedReels  = $reelPosts->map($mapPost)->values();
        $mappedVideos = $videoPosts->map($mapPost)->values();

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
            'reels'   => $mappedReels,
            'videos'  => $mappedVideos,
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
