<?php

namespace App\Services;

use MuxPhp\Api\LiveStreamsApi;
use MuxPhp\Configuration;
use MuxPhp\Models\CreateLiveStreamRequest;
use MuxPhp\Models\CreatePlaybackIDRequest;

class MuxService
{
    private LiveStreamsApi $liveStreamsApi;

    public function __construct()
    {
        $config = Configuration::getDefaultConfiguration()
            ->setUsername(config('services.mux.token_id'))
            ->setPassword(config('services.mux.token_secret'));

        $this->liveStreamsApi = new LiveStreamsApi(
            new \GuzzleHttp\Client(),
            $config
        );
    }

    public function createLiveStream(): array
    {
        $request = new CreateLiveStreamRequest([
            'playback_policy' => ['public'],
            'new_asset_settings' => [
                'playback_policy' => ['public'],
            ],
            'reduced_latency' => true,
        ]);

        $stream = $this->liveStreamsApi->createLiveStream($request);

        $playbackRequest = new CreatePlaybackIDRequest([
            'policy' => 'public',
        ]);

        $playbackId = $this->liveStreamsApi->createLiveStreamPlaybackId(
            $stream->getData()->getId(),
            $playbackRequest
        );

        return [
            'mux_live_stream_id' => $stream->getData()->getId(),
            'stream_key'         => $stream->getData()->getStreamKey(),
            'rtmp_url'           => 'rtmps://global-live.mux.com:443/app',
            'mux_playback_id'    => $playbackId->getData()->getId(),
        ];
    }

    public function deleteLiveStream(string $muxStreamId): void
    {
        try {
            $this->liveStreamsApi->deleteLiveStream($muxStreamId);
        } catch (\Exception $e) {
            \Log::warning('Mux delete stream error: ' . $e->getMessage());
        }
    }

    public function getStreamStatus(string $muxStreamId): string
    {
        try {
            $stream = $this->liveStreamsApi->getLiveStream($muxStreamId);
            return $stream->getData()->getStatus();
        } catch (\Exception $e) {
            return 'idle';
        }
    }
}
