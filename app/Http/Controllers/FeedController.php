<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\Notification;
use App\Models\Post;
use App\Models\PostLike;
use App\Services\EmailNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // ── Guest preview ──────────────────────────────────────────────────────
        if (!$user) {
            $previewPosts = Post::with(['coach.user'])
                ->withCount('likes')
                ->where('is_exclusive', false)
                ->orderByDesc('created_at')
                ->limit(6)
                ->get();

            $mapPreview = fn ($post) => [
                'id'             => $post->id,
                'title'          => $post->title,
                'content'        => $post->content,
                'media_type'     => $post->media_type,
                'media_url'      => $post->media_path ? Storage::url($post->media_path) : null,
                'thumbnail_url'  => $post->thumbnail_path ? Storage::url($post->thumbnail_path) : null,
                'video_type'     => $post->video_type,
                'video_duration' => $post->video_duration,
                'is_exclusive'   => $post->is_exclusive,
                'like_count'     => $post->likes_count,
                'is_liked'       => false,
                'created_at'     => $post->created_at->toIso8601String(),
                'coach' => [
                    'id'             => $post->coach->id,
                    'name'           => $post->coach->user->name,
                    'specialization' => $post->coach->specialization,
                    'monthly_price'  => $post->coach->monthly_price,
                    'is_subscribed'  => false,
                    'avatar_url'     => $post->coach->avatar_path ? Storage::url($post->coach->avatar_path) : null,
                ],
            ];

            return Inertia::render('Feed', [
                'posts'   => $previewPosts->map($mapPreview)->values(),
                'reels'   => [],
                'videos'  => [],
                'coaches' => [],
                'isGuest' => true,
            ]);
        }

        $userId = $user->id;

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

        // Build set of subscribed coach IDs for paywall logic
        $subscribedCoachIds = \DB::table('subscriptions')
            ->where('user_id', $userId)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->whereNotNull('coach_id')
            ->pluck('coach_id')
            ->toArray();

        $mapPost = fn ($post) => [
            'id'             => $post->id,
            'title'          => $post->title,
            'content'        => $post->content,
            'media_type'     => $post->media_type,
            'media_url'      => $post->media_path ? Storage::url($post->media_path) : null,
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
                'id'              => $post->coach->id,
                'name'            => $post->coach->user->name,
                'specialization'  => $post->coach->specialization,
                'monthly_price'   => $post->coach->monthly_price,
                'is_subscribed'   => in_array($post->coach->id, $subscribedCoachIds),
                'avatar_url'      => $post->coach->avatar_path
                    ? Storage::url($post->coach->avatar_path)
                    : null,
            ],
        ];

        $mappedPosts  = $posts->map($mapPost)->values();
        $mappedReels  = $reelPosts->map($mapPost)->values();
        $mappedVideos = $videoPosts->map($mapPost)->values();

        // Followed coach user_ids for ring differentiation
        $followedUserIds = DB::table('follows')
            ->where('follower_id', $userId)
            ->pluck('following_id')
            ->toArray();

        $coaches = Coach::with('user')
            ->orderByDesc('subscriber_count')
            ->limit(12)
            ->get()
            ->map(fn ($coach) => [
                'id'            => $coach->id,
                'user_id'       => $coach->user_id,
                'name'          => $coach->user->name,
                'is_followed'   => in_array($coach->user_id, $followedUserIds),
                'is_subscribed' => in_array($coach->id, $subscribedCoachIds),
                'avatar_url'    => $coach->avatar_path
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
        $liker  = $request->user();
        $userId = $liker->id;

        $existing = PostLike::where('user_id', $userId)
            ->where('post_id', $post->id)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            PostLike::create(['user_id' => $userId, 'post_id' => $post->id]);

            // Notify the coach who owns this post (skip if coach liked their own post)
            $coachUser = DB::table('coaches')
                ->join('users', 'users.id', '=', 'coaches.user_id')
                ->where('coaches.id', $post->coach_id)
                ->select('users.id as user_id', 'users.notif_new_like', 'users.email_notif_new_like',
                         'users.email', 'users.email_verified_at', 'users.name')
                ->first();

            if ($coachUser && $coachUser->user_id !== $userId) {
                // In-app notification (if pref enabled)
                if ($coachUser->notif_new_like) {
                    try {
                        Notification::create([
                            'user_id'    => $coachUser->user_id,
                            'type'       => 'new_like',
                            'title'      => $liker->name . ' lajkol tvoj príspevok',
                            'body'       => '"' . ($post->title ?? \Illuminate\Support\Str::limit($post->content ?? '', 40)) . '"',
                            'data'       => ['actor_id' => $userId, 'actor_name' => $liker->name, 'post_id' => $post->id],
                            'related_id' => $userId,
                            'is_read'    => false,
                        ]);
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning('Like notification failed: ' . $e->getMessage());
                    }
                }

                // Email notification (if pref enabled)
                if ($coachUser->email_notif_new_like && $coachUser->email_verified_at) {
                    $coachUserModel = \App\Models\User::find($coachUser->user_id);
                    if ($coachUserModel) {
                        app(EmailNotificationService::class)->send(
                            $coachUserModel,
                            'new_like',
                            [
                                'name'       => $liker->name,
                                'post_title' => $post->title ?? \Illuminate\Support\Str::limit($post->content ?? '', 40),
                            ]
                        );
                    }
                }
            }
        }

        return back();
    }
}
