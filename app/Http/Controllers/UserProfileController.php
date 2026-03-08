<?php

namespace App\Http\Controllers;

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

        $isOwn      = $authUser && $authUser->id === $profileUser->id;
        $isFollowing = $authUser
            ? DB::table('follows')
                ->where('follower_id', $authUser->id)
                ->where('following_id', $profileUser->id)
                ->exists()
            : false;

        $followersCount = DB::table('follows')
            ->where('following_id', $profileUser->id)
            ->count();

        $followingCount = DB::table('follows')
            ->where('follower_id', $profileUser->id)
            ->count();

        // Coaches this user follows
        $followingUsers = DB::table('follows')
            ->where('follower_id', $profileUser->id)
            ->pluck('following_id');

        $followingList = User::with('coach')
            ->whereIn('id', $followingUsers)
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
            ]);

        // Avatar for this user
        $avatarUrl = $profileUser->profile_avatar
            ? Storage::url($profileUser->profile_avatar)
            : ($profileUser->coach?->avatar_path
                ? Storage::url($profileUser->coach->avatar_path)
                : null);

        return Inertia::render('Profile/Show', [
            'profileUser' => [
                'id'             => $profileUser->id,
                'name'           => $profileUser->name,
                'role'           => $profileUser->role,
                'bio'            => $profileUser->profile_bio,
                'avatar_url'     => $avatarUrl,
                'is_public'      => $profileUser->profile_is_public,
                'created_at'     => $profileUser->created_at->toDateString(),
                'coach_id'       => $profileUser->coach?->id,
                'specialization' => $profileUser->coach?->specialization,
                'is_verified'    => $profileUser->coach?->is_verified ?? false,
            ],
            'isOwn'          => $isOwn,
            'isFollowing'    => $isFollowing,
            'followersCount' => $followersCount,
            'followingCount' => $followingCount,
            'followingList'  => $followingList,
        ]);
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
