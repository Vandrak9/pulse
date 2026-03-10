<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
{
    public function me(Request $request): RedirectResponse
    {
        return redirect()->route('profile.show', $request->user()->id);
    }

    public function show(Request $request, $userId): Response
    {
        $profileUser = User::with('coach')->findOrFail($userId);
        $authUser    = $request->user();

        $isOwn       = $authUser && $authUser->id === $profileUser->id;
        $isFollowing = $authUser
            ? DB::table('follows')
                ->where('follower_id', $authUser->id)
                ->where('following_id', $profileUser->id)
                ->exists()
            : false;

        $followersCount = DB::table('follows')
            ->where('following_id', $profileUser->id)
            ->count();

        $followingIds   = DB::table('follows')
            ->where('follower_id', $profileUser->id)
            ->pluck('following_id');

        $followingCount = $followingIds->count();

        // Users/coaches this user follows
        $followingList = User::with('coach')
            ->whereIn('id', $followingIds)
            ->get()
            ->map(fn ($u) => [
                'id'             => $u->id,
                'name'           => $u->name,
                'role'           => $u->role,
                'specialization' => $u->coach?->specialization,
                'avatar_url'     => $u->coach?->avatar_path
                    ? Storage::url($u->coach->avatar_path)
                    : ($u->profile_avatar ? Storage::url($u->profile_avatar) : null),
                'coach_id'       => $u->coach?->id,
                'monthly_price'  => $u->coach?->monthly_price,
            ]);

        // Liked posts count + grid (own profile only)
        $likedPostsCount = DB::table('post_likes')
            ->where('user_id', $profileUser->id)
            ->count();

        $likedPosts = [];
        if ($isOwn) {
            $likedPostIds = DB::table('post_likes')
                ->where('user_id', $profileUser->id)
                ->latest()
                ->limit(24)
                ->pluck('post_id');

            $likedPosts = Post::with('coach.user')
                ->whereIn('id', $likedPostIds)
                ->get()
                ->map(fn ($p) => [
                    'id'            => $p->id,
                    'title'         => $p->title,
                    'media_type'    => $p->media_type,
                    'thumbnail_url' => $p->thumbnail_path
                        ? Storage::url($p->thumbnail_path)
                        : ($p->media_path ? Storage::url($p->media_path) : null),
                    'is_exclusive'  => $p->is_exclusive,
                    'coach_name'    => $p->coach?->user?->name,
                    'coach_id'      => $p->coach_id,
                    'created_at'    => $p->created_at?->toDateString(),
                ]);
        }

        // Subscriptions — real Cashier subs first, else demo from following coaches
        $subscriptions = [];
        if ($isOwn) {
            $realSubs = DB::table('subscriptions')
                ->where('user_id', $profileUser->id)
                ->whereIn('stripe_status', ['active', 'canceled', 'past_due'])
                ->get();

            if ($realSubs->isNotEmpty()) {
                $coachIds = $realSubs->pluck('coach_id')->filter()->unique();
                $coachMap = \App\Models\Coach::with('user')->whereIn('id', $coachIds)->get()
                    ->keyBy('id');

                $subscriptions = $realSubs->map(function ($s) use ($coachMap, $profileUser) {
                    $coach = $s->coach_id ? $coachMap->get($s->coach_id) : null;
                    return [
                        'user_id'          => $profileUser->id,
                        'coach_id'         => $s->coach_id,
                        'name'             => $coach?->user?->name ?? 'Kouč',
                        'specialization'   => $coach?->specialization,
                        'monthly_price'    => $coach?->monthly_price,
                        'avatar_url'       => $coach?->avatar_path
                            ? Storage::url($coach->avatar_path)
                            : null,
                        'subscribed_since' => $s->created_at,
                        'status'           => $s->stripe_status === 'active' ? 'active' : 'cancelled',
                    ];
                })->all();
            } else {
                // Demo: show followed coaches as mock subscriptions
                $subscriptions = $followingList
                    ->filter(fn ($u) => $u['coach_id'] !== null)
                    ->values()
                    ->map(fn ($u) => array_merge($u, [
                        'subscribed_since' => null,
                        'status'           => 'active',
                    ]))->all();
            }
        }

        $subscriptionsCount = count($subscriptions);

        // Member since in Slovak
        $createdAt   = $profileUser->created_at;
        $months      = ['januára','februára','marca','apríla','mája','júna',
                        'júla','augusta','septembra','októbra','novembra','decembra'];
        $memberSince = 'Člen od ' . $months[$createdAt->month - 1] . ' ' . $createdAt->year;

        // Avatar URL
        $avatarUrl = $profileUser->profile_avatar
            ? Storage::url($profileUser->profile_avatar)
            : ($profileUser->coach?->avatar_path
                ? Storage::url($profileUser->coach->avatar_path)
                : null);

        // ── Coach-specific data (own coach profile only) ───────────────────────
        $ownPosts      = [];
        $coachReviews  = [];
        $postsCount    = 0;
        $followers     = [];
        $subscribers   = [];
        $recentActivity = [];
        $coach         = $profileUser->coach;

        if ($isOwn && $profileUser->role === 'coach' && $coach) {
            $postsCount = Post::where('coach_id', $coach->id)->count();

            $ownPosts = Post::where('coach_id', $coach->id)
                ->withCount('likes')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($p) => [
                    'id'           => $p->id,
                    'title'        => $p->title,
                    'body'         => mb_substr($p->content ?? '', 0, 100),
                    'is_exclusive' => $p->is_exclusive,
                    'media_type'   => $p->media_type,
                    'media_path'   => $p->thumbnail_path
                        ? Storage::url($p->thumbnail_path)
                        : ($p->media_path ? Storage::url($p->media_path) : null),
                    'views'        => $p->views ?? 0,
                    'likes_count'  => $p->likes_count,
                    'created_at'   => $p->created_at->diffForHumans(),
                ]);

            $coachReviews = Review::where('coach_id', $coach->id)
                ->with('user:id,name,profile_avatar')
                ->latest()
                ->take(20)
                ->get()
                ->map(fn ($r) => [
                    'id'         => $r->id,
                    'rating'     => $r->rating,
                    'content'    => $r->content,
                    'created_at' => $r->created_at->diffForHumans(),
                    'user'       => [
                        'id'         => $r->user->id,
                        'name'       => $r->user->name,
                        'avatar_url' => $r->user->profile_avatar
                            ? Storage::url($r->user->profile_avatar)
                            : null,
                    ],
                ]);

            // Followers list (users following this coach)
            $followers = DB::table('follows')
                ->where('following_id', $profileUser->id)
                ->join('users', 'users.id', '=', 'follows.follower_id')
                ->select('users.id', 'users.name', 'users.profile_avatar', 'users.role', 'follows.created_at as followed_at')
                ->orderBy('follows.created_at', 'desc')
                ->get()
                ->map(fn ($u) => [
                    'id'           => $u->id,
                    'name'         => $u->name,
                    'profile_avatar' => $u->profile_avatar ? Storage::url($u->profile_avatar) : null,
                    'role'         => $u->role,
                    'followed_at'  => $u->followed_at,
                ]);

            // Subscribers list (active subscriptions to this coach)
            $subscribers = DB::table('subscriptions')
                ->where('coach_id', $coach->id)
                ->where('stripe_status', 'active')
                ->join('users', 'users.id', '=', 'subscriptions.user_id')
                ->select('users.id', 'users.name', 'users.profile_avatar', 'subscriptions.created_at as subscribed_at', 'subscriptions.stripe_price')
                ->orderBy('subscriptions.created_at', 'desc')
                ->get()
                ->map(fn ($s) => [
                    'id'             => $s->id,
                    'name'           => $s->name,
                    'profile_avatar' => $s->profile_avatar ? Storage::url($s->profile_avatar) : null,
                    'subscribed_at'  => $s->subscribed_at,
                    'monthly_price'  => (float) $coach->monthly_price,
                ]);

            // Recent activity (last 5 notifications for this coach)
            $recentActivity = DB::table('notifications')
                ->where('user_id', $profileUser->id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(fn ($n) => [
                    'id'         => $n->id,
                    'type'       => $n->type,
                    'title'      => $n->title,
                    'body'       => $n->body,
                    'related_id' => $n->related_id,
                    'is_read'    => (bool) $n->is_read,
                    'created_at' => $n->created_at,
                    'time'       => \Carbon\Carbon::parse($n->created_at)->diffForHumans(),
                ]);
        }

        return Inertia::render('Profile/Show', [
            'profileUser' => [
                'id'                    => $profileUser->id,
                'name'                  => $profileUser->name,
                'email'                 => $isOwn ? $profileUser->email : null,
                'role'                  => $profileUser->role,
                'bio'                   => $profileUser->profile_bio,
                'avatar_url'            => $avatarUrl,
                'is_public'             => $profileUser->profile_is_public,
                'created_at'            => $profileUser->created_at->toDateString(),
                'member_since'          => $memberSince,
                'coach_id'              => $coach?->id,
                'specialization'        => $coach?->specialization,
                'is_verified'           => $coach?->is_verified ?? false,
                'subscriber_count'      => $coach?->subscriber_count ?? 0,
                'rating_avg'            => (float) ($coach?->rating_avg ?? 0),
                'rating_count'          => (int) ($coach?->rating_count ?? 0),
                'monthly_price'         => $coach ? (float) $coach->monthly_price : null,
                // Notification prefs (own profile only)
                'notif_new_subscriber'  => $isOwn ? (bool) $profileUser->notif_new_subscriber : null,
                'notif_new_message'     => $isOwn ? (bool) $profileUser->notif_new_message : null,
                'notif_new_review'      => $isOwn ? (bool) $profileUser->notif_new_review : null,
                'notif_new_like'        => $isOwn ? (bool) $profileUser->notif_new_like : null,
            ],
            'isOwn'              => $isOwn,
            'isFollowing'        => $isFollowing,
            'followersCount'     => $followersCount,
            'followingCount'     => $followingCount,
            'followingList'      => $followingList,
            'likedPostsCount'    => $likedPostsCount,
            'likedPosts'         => $likedPosts,
            'subscriptions'      => $subscriptions,
            'subscriptionsCount' => $subscriptionsCount,
            // Coach-only
            'ownPosts'           => $ownPosts,
            'coachReviews'       => $coachReviews,
            'postsCount'         => $postsCount,
            'followers'          => $followers,
            'subscribers'        => $subscribers,
            'recentActivity'     => $recentActivity,
        ]);
    }

    public function mySubscriptions(Request $request)
    {
        $user = $request->user();

        $realSubs = DB::table('subscriptions')
            ->where('user_id', $user->id)
            ->get();

        if ($realSubs->isNotEmpty()) {
            return response()->json($realSubs);
        }

        // Demo: following coaches as subscriptions
        $followingIds = DB::table('follows')
            ->where('follower_id', $user->id)
            ->pluck('following_id');

        $coaches = User::with('coach')
            ->whereIn('id', $followingIds)
            ->get()
            ->filter(fn ($u) => $u->coach !== null)
            ->map(fn ($u) => [
                'user_id'          => $u->id,
                'coach_id'         => $u->coach->id,
                'name'             => $u->name,
                'specialization'   => $u->coach->specialization,
                'monthly_price'    => $u->coach->monthly_price,
                'avatar_url'       => $u->coach->avatar_path
                    ? Storage::url($u->coach->avatar_path)
                    : null,
                'subscribed_since' => null,
                'status'           => 'active',
            ])->values();

        return response()->json($coaches);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'bio'                   => 'nullable|string|max:300',
            'avatar'                => 'nullable|image|max:2048',
            'is_public'             => 'boolean',
            'notif_new_subscriber'  => 'boolean',
            'notif_new_message'     => 'boolean',
            'notif_new_review'      => 'boolean',
            'notif_new_like'        => 'boolean',
        ]);

        $user = $request->user();

        $user->profile_bio       = $request->input('bio');
        $user->profile_is_public = $request->boolean('is_public', true);

        if ($request->has('notif_new_subscriber')) {
            $user->notif_new_subscriber = $request->boolean('notif_new_subscriber');
        }
        if ($request->has('notif_new_message')) {
            $user->notif_new_message = $request->boolean('notif_new_message');
        }
        if ($request->has('notif_new_review')) {
            $user->notif_new_review = $request->boolean('notif_new_review');
        }
        if ($request->has('notif_new_like')) {
            $user->notif_new_like = $request->boolean('notif_new_like');
        }

        if ($request->hasFile('avatar')) {
            if ($user->profile_avatar) {
                Storage::disk('public')->delete($user->profile_avatar);
            }
            $user->profile_avatar = $request->file('avatar')->store('avatars/profiles', 'public');
        }

        $user->save();

        return redirect()->route('profile.show', $user->id)
            ->with('success', 'Profil aktualizovaný.');
    }
}
