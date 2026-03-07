<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PexelsService
{
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = env('PEXELS_API_KEY', '');
    }

    /**
     * Search Pexels for videos.
     * Returns array of ['video_url' => ..., 'thumbnail_url' => ..., 'width' => ..., 'height' => ...]
     */
    public function searchVideos(string $query, int $perPage = 5): array
    {
        $response = Http::withHeaders(['Authorization' => $this->apiKey])
            ->timeout(15)
            ->get('https://api.pexels.com/videos/search', [
                'query'       => $query,
                'per_page'    => $perPage,
                'orientation' => 'landscape',
            ]);

        if (! $response->successful()) {
            return [];
        }

        $results = [];
        foreach ($response->json('videos', []) as $video) {
            $files = collect($video['video_files'] ?? []);

            // Prefer HD MP4, fall back to any MP4
            $file = $files->where('quality', 'hd')->where('file_type', 'video/mp4')->first()
                ?? $files->where('file_type', 'video/mp4')->first();

            if ($file) {
                $results[] = [
                    'video_url'     => $file['link'],
                    'thumbnail_url' => $video['image'] ?? null,
                    'width'         => $file['width'] ?? 1280,
                    'height'        => $file['height'] ?? 720,
                ];
            }
        }

        return $results;
    }

    /**
     * Search Pexels for images.
     * Returns array of ['image_url' => ..., 'thumbnail_url' => ..., 'width' => ..., 'height' => ...]
     */
    public function searchImages(string $query, int $perPage = 5): array
    {
        $response = Http::withHeaders(['Authorization' => $this->apiKey])
            ->timeout(15)
            ->get('https://api.pexels.com/v1/search', [
                'query'       => $query,
                'per_page'    => $perPage,
                'orientation' => 'landscape',
            ]);

        if (! $response->successful()) {
            return [];
        }

        $results = [];
        foreach ($response->json('photos', []) as $photo) {
            $results[] = [
                'image_url'     => $photo['src']['large'] ?? $photo['src']['original'] ?? null,
                'thumbnail_url' => $photo['src']['medium'] ?? null,
                'width'         => $photo['width'] ?? 1280,
                'height'        => $photo['height'] ?? 720,
            ];
        }

        return $results;
    }
}
