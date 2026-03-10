<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\LiveStream;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CoachController extends Controller
{
    public function index(): Response
    {
        $coaches = Coach::with('user')
            ->withCount([
                'posts as video_count' => fn ($q) => $q->where('media_type', 'video'),
                'posts as image_count' => fn ($q) => $q->where('media_type', 'image'),
            ])
            ->when(auth()->check(), fn ($q) => $q->where('user_id', '!=', auth()->id()))
            ->orderByDesc('created_at')
            ->paginate(24)
            ->through(function ($coach) {
                $userId = auth()->id();
                $isFollowing = $userId
                    ? DB::table('follows')
                        ->where('follower_id', $userId)
                        ->where('following_id', $coach->user_id)
                        ->exists()
                    : false;

                return [
                    'id'               => $coach->id,
                    'user_id'          => $coach->user_id,
                    'name'             => $coach->user->name,
                    'specialization'   => $coach->specialization,
                    'monthly_price'    => $coach->monthly_price,
                    'bio'              => $coach->bio,
                    'rating_avg'       => (float) $coach->rating_avg,
                    'rating_count'     => (int) $coach->rating_count,
                    'subscriber_count' => $coach->subscriber_count,
                    'video_count'      => $coach->video_count,
                    'image_count'      => $coach->image_count,
                    'is_following'     => $isFollowing,
                    'is_live'          => LiveStream::where('coach_id', $coach->id)
                        ->where('status', 'active')->exists(),
                    'avatar_url'       => $coach->avatar_path
                        ? Storage::url($coach->avatar_path)
                        : null,
                ];
            });

        return Inertia::render('Coaches/Index', [
            'coaches' => $coaches,
        ]);
    }

    public function show(Coach $coach): Response
    {
        $coach->load('user');

        $posts = $coach->posts()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($post) => [
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
                'created_at'     => $post->created_at->toDateString(),
            ]);

        $authUser       = auth()->user();
        $authUserId     = $authUser?->id;
        $isFollowing    = $authUserId
            ? DB::table('follows')
                ->where('follower_id', $authUserId)
                ->where('following_id', $coach->user_id)
                ->exists()
            : false;
        $isSubscribed   = $authUserId
            ? DB::table('subscriptions')
                ->where('user_id', $authUserId)
                ->where('coach_id', $coach->id)
                ->whereIn('stripe_status', ['active', 'trialing'])
                ->exists()
            : false;
        $followersCount = DB::table('follows')
            ->where('following_id', $coach->user_id)
            ->count();

        // Reviews — last 10, newest first
        $reviews = Review::where('coach_id', $coach->id)
            ->where('is_visible', true)
            ->with('user:id,name,profile_avatar')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id'          => $r->id,
                'user_id'     => $r->user_id,
                'user_name'   => $r->user->name,
                'user_avatar' => $r->user->profile_avatar
                    ? Storage::url($r->user->profile_avatar)
                    : null,
                'rating'      => (int) $r->rating,
                'content'     => $r->content,
                'created_at'  => $r->created_at?->toISOString(),
            ]);

        $userReview = $authUserId
            ? Review::where('user_id', $authUserId)->where('coach_id', $coach->id)->first()
            : null;

        return Inertia::render('Coaches/Show', [
            'coach' => [
                'id'              => $coach->id,
                'user_id'         => $coach->user_id,
                'name'            => $coach->user->name,
                'bio'             => $coach->bio,
                'specialization'  => $coach->specialization,
                'monthly_price'   => $coach->monthly_price,
                'rating_avg'      => (float) $coach->rating_avg,
                'rating_count'    => (int) $coach->rating_count,
                'subscriber_count'=> $coach->subscriber_count,
                'followers_count' => $followersCount,
                'is_verified'     => $coach->is_verified,
                'is_following'    => $isFollowing,
                'is_live'         => LiveStream::where('coach_id', $coach->id)
                    ->where('status', 'active')->exists(),
                'messages_access' => $coach->messages_access ?? 'everyone',
                'avatar_url'      => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ],
            'posts'       => $posts,
            'isSubscribed' => $isSubscribed,
            'reviews'     => $reviews,
            'user_review' => $userReview ? [
                'id'      => $userReview->id,
                'rating'  => (int) $userReview->rating,
                'content' => $userReview->content,
            ] : null,
        ]);
    }

    public function edit(Request $request): Response
    {
        $coach = $request->user()->coach;

        return Inertia::render('Coaches/Edit', [
            'coach' => $coach ? [
                'id'              => $coach->id,
                'bio'             => $coach->bio,
                'specialization'  => $coach->specialization,
                'monthly_price'   => $coach->monthly_price,
                'messages_access' => $coach->messages_access ?? 'everyone',
                'avatar_url'      => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ] : null,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'bio'             => ['nullable', 'string', 'max:2000'],
            'specialization'  => ['nullable', 'string', 'max:255'],
            'monthly_price'   => ['required', 'numeric', 'min:0'],
            'avatar'          => ['nullable', 'image', 'max:2048'],
            'messages_access' => ['nullable', 'in:everyone,followers,subscribers,nobody'],
        ]);

        $user = $request->user();
        $coach = $user->coach ?? new Coach(['user_id' => $user->id]);

        $coach->bio             = $validated['bio'] ?? null;
        $coach->specialization  = $validated['specialization'] ?? null;
        $coach->monthly_price   = $validated['monthly_price'];
        $coach->messages_access = $validated['messages_access'] ?? 'everyone';

        if ($request->hasFile('avatar')) {
            if ($coach->avatar_path) {
                Storage::delete($coach->avatar_path);
            }
            $coach->avatar_path = $request->file('avatar')->store('avatars', 'public');
        }

        $coach->save();

        return redirect()->route('dashboard.profile.edit')
            ->with('success', 'Profil bol uložený.');
    }

    public function search(Request $request)
    {
        $q = $request->input('q', '');

        $coaches = Coach::with('user')
            ->whereHas('user', fn ($q2) => $q2->where('name', 'like', '%' . $q . '%'))
            ->limit(8)
            ->get()
            ->map(fn ($c) => [
                'id'             => $c->id,
                'user_id'        => $c->user_id,
                'name'           => $c->user->name,
                'specialization' => $c->specialization,
                'avatar_url'     => $c->avatar_path
                    ? Storage::url($c->avatar_path)
                    : null,
            ]);

        return response()->json($coaches);
    }
}
