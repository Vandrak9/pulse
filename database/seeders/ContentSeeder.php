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

        $assignments = [
            'tomas.kovac@pulse.sk' => [
                'video_queries' => ['weightlifting', 'gym workout', 'bench press'],
                'image_query'   => 'gym fitness',
            ],
            'lucia.horakova@pulse.sk' => [
                'video_queries' => ['healthy cooking', 'meal prep'],
                'image_query'   => 'healthy food protein',
            ],
            'zuzana.prochazka@pulse.sk' => [
                'video_queries' => ['yoga', 'meditation', 'stretching yoga'],
                'image_query'   => 'yoga pose woman',
            ],
            'katarina.molnar@pulse.sk' => [
                'video_queries' => ['wellness spa', 'breathing exercise meditation'],
                'image_query'   => 'wellness relaxation',
            ],
            'marek.blaho@pulse.sk' => [
                'video_queries' => ['crossfit', 'hiit workout', 'functional fitness'],
                'image_query'   => 'crossfit training',
            ],
            'peter.horvath@pulse.sk' => [
                'video_queries' => ['running outdoors', 'marathon running', 'jogging', 'trail running'],
                'image_query'   => 'running sport',
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

            // Get posts by media type, ordered by created_at
            $videoPosts = Post::where('coach_id', $coach->id)
                ->where('media_type', 'video')
                ->orderBy('created_at')
                ->get();

            $imagePosts = Post::where('coach_id', $coach->id)
                ->where('media_type', 'image')
                ->orderBy('created_at')
                ->get();

            // Assign video content
            $videoQueries = $config['video_queries'];
            foreach ($videoPosts as $i => $post) {
                $query = $videoQueries[$i] ?? $videoQueries[0];
                $results = $this->pexels->searchVideos($query, 1);

                if (empty($results)) {
                    $this->command->warn("    No video results for '{$query}'");
                    continue;
                }

                $result = $results[0];
                $thumbnailPath = $this->downloadFile($result['thumbnail_url'], 'thumbnails', 'jpg');

                $post->media_path = $result['video_url'];
                $post->thumbnail_path = $thumbnailPath;
                $post->save();

                $this->command->line("    <fg=green>✓</> Video: {$query} → saved");
            }

            // Assign image content
            if ($imagePosts->isNotEmpty()) {
                $imageCount = $imagePosts->count();
                $results = $this->pexels->searchImages($config['image_query'], $imageCount);

                foreach ($imagePosts as $i => $post) {
                    $result = $results[$i] ?? ($results[0] ?? null);
                    if (! $result) {
                        $this->command->warn("    No image results for '{$config['image_query']}'");
                        continue;
                    }

                    $post->media_path = $result['image_url'];
                    $post->save();

                    $this->command->line("    <fg=green>✓</> Image: {$config['image_query']} → saved");
                }
            }

            // Set is_exclusive: first 2 media posts free, rest exclusive
            $allMediaPosts = Post::where('coach_id', $coach->id)
                ->whereIn('media_type', ['video', 'image'])
                ->orderBy('created_at')
                ->get();

            foreach ($allMediaPosts as $i => $post) {
                $post->is_exclusive = $i >= 2;
                $post->save();
            }

            $this->command->line("  <fg=green>Done</> {$user->name}: {$videoPosts->count()} videos, {$imagePosts->count()} images");
        }

        $this->command->newLine();
        $this->command->info('ContentSeeder complete — real Pexels media assigned.');
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
            $this->command->warn("    Download failed ({$url}): " . $e->getMessage());
        }

        return null;
    }
}
