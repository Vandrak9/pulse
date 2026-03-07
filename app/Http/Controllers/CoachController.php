<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use Illuminate\Http\Request;
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
            ->orderByDesc('created_at')
            ->paginate(24)
            ->through(fn ($coach) => [
                'id' => $coach->id,
                'name' => $coach->user->name,
                'specialization' => $coach->specialization,
                'monthly_price' => $coach->monthly_price,
                'bio' => $coach->bio,
                'rating' => $coach->rating,
                'subscriber_count' => $coach->subscriber_count,
                'video_count' => $coach->video_count,
                'image_count' => $coach->image_count,
                'avatar_url' => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ]);

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
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'media_type' => $post->media_type,
                'media_path' => $post->media_path,
                'thumbnail_path' => $post->thumbnail_path,
                'video_duration' => $post->video_duration,
                'is_exclusive' => $post->is_exclusive,
                'created_at' => $post->created_at->toDateString(),
            ]);

        return Inertia::render('Coaches/Show', [
            'coach' => [
                'id' => $coach->id,
                'name' => $coach->user->name,
                'bio' => $coach->bio,
                'specialization' => $coach->specialization,
                'monthly_price' => $coach->monthly_price,
                'rating' => $coach->rating,
                'subscriber_count' => $coach->subscriber_count,
                'is_verified' => $coach->is_verified,
                'avatar_url' => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ],
            'posts' => $posts,
            'isSubscribed' => false,
        ]);
    }

    public function edit(Request $request): Response
    {
        $coach = $request->user()->coach;

        return Inertia::render('Coaches/Edit', [
            'coach' => $coach ? [
                'id' => $coach->id,
                'bio' => $coach->bio,
                'specialization' => $coach->specialization,
                'monthly_price' => $coach->monthly_price,
                'avatar_url' => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ] : null,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'bio' => ['nullable', 'string', 'max:2000'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $coach = $user->coach ?? new Coach(['user_id' => $user->id]);

        $coach->bio = $validated['bio'] ?? null;
        $coach->specialization = $validated['specialization'] ?? null;
        $coach->monthly_price = $validated['monthly_price'];

        if ($request->hasFile('avatar')) {
            if ($coach->avatar_path) {
                Storage::delete($coach->avatar_path);
            }
            $coach->avatar_path = $request->file('avatar')->store('avatars', 'public');
        }

        $coach->save();

        return redirect()->route('dashboard.profile.edit')
            ->with('success', 'Profile updated successfully.');
    }
}
