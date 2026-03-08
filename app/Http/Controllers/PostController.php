<?php

namespace App\Http\Controllers;

use App\Jobs\SendPostNotificationsJob;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    // ── Post creation form ─────────────────────────────────────────────────────

    public function create(): Response|RedirectResponse
    {
        $coach = Auth::user()->coach;
        if (!$coach) {
            return redirect()->route('dashboard.profile.edit');
        }

        return Inertia::render('Dashboard/Posts/Create', [
            'coach' => [
                'id'               => $coach->id,
                'subscriber_count' => $coach->subscriber_count,
            ],
        ]);
    }

    // ── Store a regular post ───────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $coach = Auth::user()->coach;
        if (!$coach) {
            return redirect()->route('dashboard.profile.edit');
        }

        $request->validate([
            'title'        => 'required|string|max:255',
            'content'      => 'nullable|string|max:50000',
            'is_exclusive' => 'boolean',
            'media'        => 'nullable|array|max:3',
            'media.*'      => 'file|max:81920|mimes:jpg,jpeg,png,gif,webp,mp4,mov,webm',
        ]);

        $post = Post::create([
            'coach_id'     => $coach->id,
            'title'        => $request->title,
            'content'      => $request->content,
            'is_exclusive' => $request->boolean('is_exclusive'),
            'media_type'   => 'none',
            'media_path'   => null,
        ]);

        if ($request->hasFile('media')) {
            $sortOrder = 0;
            foreach ($request->file('media') as $file) {
                $mime    = $file->getMimeType() ?? '';
                $isVideo = str_starts_with($mime, 'video/');
                $type    = $isVideo ? 'video' : 'image';
                $folder  = $isVideo ? 'posts/videos' : 'posts/images';
                $path    = $file->store($folder, 'public');

                $post->media()->create([
                    'media_path'      => $path,
                    'media_type'      => $type,
                    'media_thumbnail' => null,
                    'sort_order'      => $sortOrder,
                ]);

                // Keep legacy single-file columns populated from the first file
                if ($sortOrder === 0) {
                    $post->update([
                        'media_path' => $path,
                        'media_type' => $type,
                    ]);
                }
                $sortOrder++;
            }
        }

        SendPostNotificationsJob::dispatch($post->id, 'new_post');

        return redirect()->route('dashboard')->with('success', 'Príspevok bol uverejnený.');
    }

    // ── Reel creation form ─────────────────────────────────────────────────────

    public function createReel(): Response|RedirectResponse
    {
        $coach = Auth::user()->coach;
        if (!$coach) {
            return redirect()->route('dashboard.profile.edit');
        }

        // Count followers for the reel reach estimate
        $followersCount = \Illuminate\Support\Facades\DB::table('follows')
            ->where('following_id', Auth::user()->id)
            ->count();

        return Inertia::render('Dashboard/Reels/Create', [
            'coach' => [
                'id'               => $coach->id,
                'subscriber_count' => $coach->subscriber_count,
                'followers_count'  => $followersCount,
            ],
        ]);
    }

    // ── Store a reel ───────────────────────────────────────────────────────────

    public function storeReel(Request $request): RedirectResponse
    {
        $coach = Auth::user()->coach;
        if (!$coach) {
            return redirect()->route('dashboard.profile.edit');
        }

        $request->validate([
            'title'   => 'required|string|max:255',
            'caption' => 'nullable|string|max:5000',
            'video'   => 'required|file|max:204800|mimes:mp4,mov,webm',
        ]);

        $path = $request->file('video')->store('posts/reels', 'public');

        $post = Post::create([
            'coach_id'   => $coach->id,
            'title'      => $request->title,
            'content'    => $request->caption,
            'is_exclusive' => false,
            'media_type' => 'video',
            'video_type' => 'reel',
            'media_path' => $path,
        ]);

        $post->media()->create([
            'media_path' => $path,
            'media_type' => 'video',
            'sort_order' => 0,
        ]);

        SendPostNotificationsJob::dispatch($post->id, 'new_reel');

        return redirect()->route('dashboard')->with('success', 'Reel bol uverejnený.');
    }

    // ── Delete a post ──────────────────────────────────────────────────────────

    public function destroy(int $id): RedirectResponse
    {
        $coach = Auth::user()->coach;
        if (!$coach) {
            abort(403);
        }

        $post = Post::where('id', $id)
            ->where('coach_id', $coach->id)
            ->with('media')
            ->firstOrFail();

        // Remove media files from storage
        foreach ($post->media as $media) {
            Storage::disk('public')->delete($media->media_path);
            if ($media->media_thumbnail) {
                Storage::disk('public')->delete($media->media_thumbnail);
            }
        }
        if ($post->media_path) {
            Storage::disk('public')->delete($post->media_path);
        }

        $post->delete();

        return back()->with('success', 'Príspevok bol zmazaný.');
    }
}
