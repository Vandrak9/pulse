<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class LiveStreamViewerLeft implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $streamId,
        public array $viewer,
        public int $viewerCount,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('live-stream.' . $this->streamId);
    }

    public function broadcastAs(): string
    {
        return 'viewer.left';
    }

    public function broadcastWith(): array
    {
        return [
            'viewer'        => $this->viewer,
            'viewers_count' => $this->viewerCount,
        ];
    }
}
