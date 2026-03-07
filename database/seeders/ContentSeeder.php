<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use App\Services\PexelsService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ContentSeeder extends Seeder
{
    private PexelsService $pexels;

    public function __construct()
    {
        $this->pexels = new PexelsService();
    }

    public function run(): void
    {
        Storage::disk('public')->makeDirectory('thumbnails');

        // reel_count = how many video posts become reels (short clips ≤60s)
        // remaining video posts become long videos (≥60s)
        $assignments = [
            'tomas.kovac@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'weightlifting',
                'video_query'  => 'gym workout',
                'image_query'  => 'gym fitness',
            ],
            'lucia.horakova@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'healthy food',
                'video_query'  => 'healthy cooking',
                'image_query'  => 'healthy food protein',
            ],
            'zuzana.prochazka@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'yoga',
                'video_query'  => 'meditation yoga',
                'image_query'  => 'yoga pose woman',
            ],
            'katarina.molnar@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'wellness',
                'video_query'  => 'breathing exercise',
                'image_query'  => 'wellness relaxation',
            ],
            'marek.blaho@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'crossfit',
                'video_query'  => 'hiit workout',
                'image_query'  => 'crossfit training',
            ],
            'peter.horvath@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'running',
                'video_query'  => 'marathon running',
                'image_query'  => 'running sport',
            ],
            'jana.novotna@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'pilates',
                'video_query'  => 'pilates core workout',
                'image_query'  => 'pilates studio',
            ],
            'martin.simko@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'functional training',
                'video_query'  => 'kettlebell workout',
                'image_query'  => 'functional training gym',
            ],
            'radoslav.oravec@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'boxing',
                'video_query'  => 'boxing training',
                'image_query'  => 'boxing gym',
            ],
            'eva.kovacova@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'stretching',
                'video_query'  => 'flexibility workout',
                'image_query'  => 'stretching fitness',
            ],
            'michal.dubovsky@pulse.sk' => [
                'reel_count'   => 3,
                'reel_query'   => 'cycling',
                'video_query'  => 'triathlon training',
                'image_query'  => 'cycling sport',
            ],
        ];

        foreach ($assignments as $email => $config) {
            $user = User::where('email', $email)->first();
            if (! $user || ! $user->coach) {
                $this->command->warn("Coach not found: {$email}");
                continue;
            }

            $coach = $user->coach;
            $this->command->line("\n  Processing <fg=cyan>{$user->name}</>");

            $videoPosts = Post::where('coach_id', $coach->id)
                ->where('media_type', 'video')
                ->orderBy('created_at')
                ->get();

            $imagePosts = Post::where('coach_id', $coach->id)
                ->where('media_type', 'image')
                ->orderBy('created_at')
                ->get();

            $reelCount = min($config['reel_count'], $videoPosts->count());

            // ── Reels (short clips, max 60s) ──
            $reelResults = $this->pexels->searchVideos($config['reel_query'], max($reelCount, 5), maxDuration: 60);
            foreach ($videoPosts->take($reelCount) as $i => $post) {
                $result = $reelResults[$i] ?? ($reelResults[0] ?? null);
                if (! $result) {
                    $this->command->warn("    No reel results for '{$config['reel_query']}'");
                    continue;
                }
                $thumb = $this->downloadFile($result['thumbnail_url'], 'thumbnails', 'jpg');
                $duration = $result['duration'] ?? null;

                $post->media_path     = $result['video_url'];
                $post->thumbnail_path = $thumb;
                $post->video_type     = 'reel';
                $post->video_duration = $duration;
                $post->save();

                $durStr = $duration ? "{$duration}s" : '?s';
                $this->command->line("    <fg=green>✓</> Reel ({$durStr}): {$config['reel_query']}");
            }

            // ── Long videos (60s+) ──
            $longPosts = $videoPosts->slice($reelCount);
            $longCount = $longPosts->count();
            if ($longCount > 0) {
                $videoResults = $this->pexels->searchVideos($config['video_query'], max($longCount, 3), minDuration: 60);
                foreach ($longPosts->values() as $i => $post) {
                    $result = $videoResults[$i] ?? ($videoResults[0] ?? null);
                    if (! $result) {
                        $this->command->warn("    No video results for '{$config['video_query']}'");
                        continue;
                    }
                    $thumb = $this->downloadFile($result['thumbnail_url'], 'thumbnails', 'jpg');
                    $duration = $result['duration'] ?? null;

                    $post->media_path     = $result['video_url'];
                    $post->thumbnail_path = $thumb;
                    $post->video_type     = 'video';
                    $post->video_duration = $duration;
                    $post->save();

                    $durStr = $duration ? "{$duration}s" : '?s';
                    $this->command->line("    <fg=green>✓</> Video ({$durStr}): {$config['video_query']}");
                }
            }

            // ── Images ──
            if ($imagePosts->isNotEmpty()) {
                $imgResults = $this->pexels->searchImages($config['image_query'], max($imagePosts->count(), 3));
                foreach ($imagePosts as $i => $post) {
                    $result = $imgResults[$i] ?? ($imgResults[0] ?? null);
                    if (! $result) continue;
                    $post->media_path = $result['image_url'];
                    $post->save();
                    $this->command->line("    <fg=green>✓</> Image: {$config['image_query']}");
                }
            }

            // ── is_exclusive: first 2 media posts free, rest exclusive ──
            $allMedia = Post::where('coach_id', $coach->id)
                ->whereIn('media_type', ['video', 'image'])
                ->orderBy('created_at')
                ->get();

            foreach ($allMedia as $i => $post) {
                $post->is_exclusive = $i >= 2;
                $post->save();
            }

            // ── Reels are always free for registered users ──
            Post::where('coach_id', $coach->id)
                ->where('video_type', 'reel')
                ->update(['is_exclusive' => false]);

            $this->command->line("  <fg=green>Done</> {$user->name}: {$reelCount} reels, " . max(0, $videoPosts->count() - $reelCount) . " videos, {$imagePosts->count()} images");
        }

        $this->command->newLine();
        $this->command->info('ContentSeeder complete — reels always free, long videos/images may be exclusive.');
    }

    private function downloadFile(string $url, string $folder, string $ext): ?string
    {
        try {
            $response = Http::timeout(20)->get($url);
            if ($response->successful()) {
                $filename = uniqid('media_') . '.' . $ext;
                $path = "{$folder}/{$filename}";
                Storage::disk('public')->put($path, $response->body());
                return $path;
            }
        } catch (\Exception $e) {
            $this->command->warn("    Download failed: " . $e->getMessage());
        }

        return null;
    }
}
