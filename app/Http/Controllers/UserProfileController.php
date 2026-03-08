<?php

namespace App\Http\Controllers;

use App\Models\Post;
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
                $subscriptions = $realSubs->map(fn ($s) => [
                    'user_id'          => $profileUser->id,
                    'coach_id'         => null,
                    'name'             => 'Predplatné',
                    'specialization'   => null,
                    'monthly_price'    => null,
                    'avatar_url'       => null,
                    'subscribed_since' => $s->created_at,
                    'status'           => $s->stripe_status === 'active' ? 'active' : 'cancelled',
                ])->all();
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

        return Inertia::render('Profile/Show', [
            'profileUser' => [
                'id'             => $profileUser->id,
                'name'           => $profileUser->name,
                'email'          => $isOwn ? $profileUser->email : null,
                'role'           => $profileUser->role,
                'bio'            => $profileUser->profile_bio,
                'avatar_url'     => $avatarUrl,
                'is_public'      => $profileUser->profile_is_public,
                'created_at'     => $profileUser->created_at->toDateString(),
                'member_since'   => $memberSince,
                'coach_id'       => $profileUser->coach?->id,
                'specialization' => $profileUser->coach?->specialization,
                'is_verified'    => $profileUser->coach?->is_verified ?? false,
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
            'bio'       => 'nullable|string|max:300',
            'avatar'    => 'nullable|image|max:2048',
            'is_public' => 'boolean',
        ]);

        $user = $request->user();

        $user->profile_bio       = $request->input('bio');
        $user->profile_is_public = $request->boolean('is_public', true);

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
