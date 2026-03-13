<?php

namespace App\Http\Controllers;

use App\Events\LiveChatMessage;
use App\Events\LiveStreamViewerJoined;
use App\Events\LiveStreamViewerLeft;
use App\Models\Coach;
use App\Models\LiveStream;
use App\Models\LiveStreamMessage;
use App\Services\MuxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LiveStreamController extends Controller
{
    // Coach: show create/manage page
    public function index()
    {
        $coach = auth()->user()->coach;

        if (!$coach) {
            return redirect('/dashboard')->with('error', 'Nemáš coach profil.');
        }

        $activeStream = LiveStream::where('coach_id', $coach->id)
            ->whereIn('status', ['idle', 'active'])
            ->latest()
            ->first();

        return Inertia::render('Dashboard/LiveStream', [
            'activeStream' => $activeStream ? [
                'id'              => $activeStream->id,
                'title'           => $activeStream->title,
                'description'     => $activeStream->description,
                'status'          => $activeStream->status,
                'access'          => $activeStream->access,
                'method'          => $activeStream->method,
                'rtmp_url'        => $activeStream->rtmp_url,
                'stream_key'      => $activeStream->stream_key,
                'mux_playback_id' => $activeStream->mux_playback_id,
                'started_at'      => $activeStream->started_at?->toISOString(),
                'viewers_count'   => $activeStream->viewers_count,
            ] : null,
            'coach' => [
                'id'             => $coach->id,
                'specialization' => $coach->specialization,
            ],
        ]);
    }

    // Coach: create new stream
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:200',
            'description' => 'nullable|string|max:500',
            'access'      => 'required|in:everyone,subscribers',
            'method'      => 'required|in:browser,obs',
        ]);

        $coach = auth()->user()->coach;

        $existing = LiveStream::where('coach_id', $coach->id)
            ->whereIn('status', ['idle', 'active'])
            ->first();

        if ($existing) {
            return back()->with('error', 'Už máš aktívny stream. Ukonči ho pred vytvorením nového.');
        }

        try {
            $streamData = app(MuxService::class)->createLiveStream();

            $stream = LiveStream::create([
                'coach_id'    => $coach->id,
                'title'       => $validated['title'],
                'description' => $validated['description'],
                'access'      => $validated['access'],
                'method'      => $validated['method'],
                'status'      => 'idle',
                ...$streamData,
            ]);

            $this->notifyViewers($stream, $coach);

            $msg = $validated['method'] === 'browser'
                ? 'Stream vytvorený! Spusti kameru a začni streamovať.'
                : 'Stream vytvorený! Použi RTMP URL a Stream Key v OBS alebo Larix.';

            return redirect()->route('live.index')->with('success', $msg);

        } catch (\Exception $e) {
            Log::error('Mux create stream error: ' . $e->getMessage());
            return back()->with('error', 'Nepodarilo sa vytvoriť stream. Skús znova.');
        }
    }

    // Coach: end stream
    public function destroy($id)
    {
        $stream = LiveStream::findOrFail($id);

        if ($stream->coach->user_id !== auth()->id()) {
            abort(403);
        }

        try {
            app(MuxService::class)->deleteLiveStream($stream->mux_live_stream_id);
        } catch (\Exception $e) {
            Log::warning('Mux delete error: ' . $e->getMessage());
        }

        $stream->update([
            'status'   => 'disabled',
            'ended_at' => now(),
        ]);

        return redirect()->route('live.index')->with('success', 'Stream ukončený.');
    }

    // Fan: watch stream
    public function watch(Request $request, $coachId)
    {
        $coach = Coach::with('user')->findOrFail($coachId);

        $stream = LiveStream::where('coach_id', $coach->id)
            ->whereIn('status', ['idle', 'active'])
            ->latest()
            ->first();

        if (!$stream) {
            return redirect('/coaches/' . $coach->id)
                ->with('info', 'Tento kouč momentálne nestreamuje.');
        }

        // Access check for subscribers-only stream
        if ($stream->access === 'subscribers') {
            $user = $request->user();
            if (!$user) {
                return redirect()->route('login');
            }

            $isSubscribed = DB::table('subscriptions')
                ->where('user_id', $user->id)
                ->where('coach_id', $coach->id)
                ->whereIn('stripe_status', ['active', 'trialing'])
                ->exists();

            if (!$isSubscribed && $user->id !== $coach->user_id) {
                return Inertia::render('LiveStream/Locked', [
                    'coach' => [
                        'id'             => $coach->id,
                        'name'           => $coach->user->name,
                        'specialization' => $coach->specialization,
                        'monthly_price'  => $coach->monthly_price,
                        'avatar_url'     => $coach->avatar_path
                            ? Storage::url($coach->avatar_path)
                            : null,
                    ],
                    'stream' => [
                        'title'  => $stream->title,
                        'access' => $stream->access,
                    ],
                ]);
            }
        }

        $messages = LiveStreamMessage::where('live_stream_id', $stream->id)
            ->with('user:id,name,profile_avatar,role')
            ->latest()
            ->take(50)
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'message'    => $m->message,
                'created_at' => $m->created_at->toISOString(),
                'user'       => [
                    'id'             => $m->user->id,
                    'name'           => $m->user->name,
                    'role'           => $m->user->role,
                    'avatar_url'     => $m->user->profile_avatar
                        ? Storage::url($m->user->profile_avatar)
                        : null,
                ],
            ])
            ->reverse()
            ->values();

        return Inertia::render('LiveStream/Watch', [
            'stream' => [
                'id'           => $stream->id,
                'title'        => $stream->title,
                'description'  => $stream->description,
                'playback_id'  => $stream->mux_playback_id,
                'status'       => $stream->status,
                'access'       => $stream->access,
                'viewers_count' => $stream->viewers_count,
                'started_at'   => $stream->started_at?->toISOString(),
            ],
            'coach' => [
                'id'             => $coach->id,
                'name'           => $coach->user->name,
                'specialization' => $coach->specialization,
                'avatar_url'     => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ],
            'messages' => $messages,
        ]);
    }

    // Fan: send chat message + broadcast via Reverb
    public function sendMessage(Request $request, $streamId)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:300',
        ]);

        $stream = LiveStream::findOrFail($streamId);
        $user   = auth()->user();

        if ($stream->status === 'disabled') {
            return response()->json(['error' => 'Stream skončil.'], 422);
        }

        $msg = LiveStreamMessage::create([
            'live_stream_id' => $stream->id,
            'user_id'        => $user->id,
            'message'        => $validated['message'],
        ]);

        $isCoach = $stream->coach->user_id === $user->id;

        $messageData = [
            'id'         => $msg->id,
            'message'    => $msg->message,
            'created_at' => $msg->created_at->toISOString(),
            'user'       => [
                'id'         => $user->id,
                'name'       => $user->name,
                'role'       => $user->role,
                'is_coach'   => $isCoach,
                'avatar_url' => $user->profile_avatar
                    ? Storage::url($user->profile_avatar)
                    : null,
            ],
        ];

        broadcast(new LiveChatMessage((int) $streamId, $messageData))->toOthers();

        return response()->json($messageData);
    }

    // Fan: join stream (viewer tracking)
    public function join(Request $request, $streamId)
    {
        $stream = LiveStream::findOrFail($streamId);
        $user   = $request->user();

        $stream->increment('viewers_count');

        cache()->put("stream:{$streamId}:viewer:{$user->id}", true, now()->addMinutes(5));

        broadcast(new LiveStreamViewerJoined(
            (int) $streamId,
            ['id' => $user->id, 'name' => $user->name, 'avatar_url' => $user->profile_avatar ? Storage::url($user->profile_avatar) : null],
            $stream->viewers_count
        ))->toOthers();

        return response()->json(['viewers_count' => $stream->viewers_count]);
    }

    // Fan: leave stream (viewer tracking)
    public function leave(Request $request, $streamId)
    {
        $stream = LiveStream::findOrFail($streamId);
        $user   = $request->user();

        DB::statement(
            'UPDATE live_streams SET viewers_count = GREATEST(viewers_count - 1, 0) WHERE id = ?',
            [$stream->id]
        );
        $stream->refresh();

        cache()->forget("stream:{$streamId}:viewer:{$user->id}");

        broadcast(new LiveStreamViewerLeft(
            (int) $streamId,
            ['id' => $user->id, 'name' => $user->name],
            $stream->viewers_count
        ))->toOthers();

        return response()->json(['ok' => true]);
    }

    // Poll stream status + new messages
    public function poll(Request $request, $streamId)
    {
        $stream = LiveStream::findOrFail($streamId);
        $lastId = (int) $request->query('last_message_id', 0);

        $messages = LiveStreamMessage::where('live_stream_id', $streamId)
            ->where('id', '>', $lastId)
            ->with('user:id,name,profile_avatar,role')
            ->orderBy('id')
            ->take(30)
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'message'    => $m->message,
                'created_at' => $m->created_at->toISOString(),
                'user'       => [
                    'id'         => $m->user->id,
                    'name'       => $m->user->name,
                    'role'       => $m->user->role,
                    'avatar_url' => $m->user->profile_avatar
                        ? Storage::url($m->user->profile_avatar)
                        : null,
                ],
            ]);

        // Sync status from Mux (only if not disabled)
        if ($stream->status !== 'disabled') {
            try {
                $muxStatus = app(MuxService::class)->getStreamStatus($stream->mux_live_stream_id);

                if ($muxStatus !== $stream->status) {
                    $updates = ['status' => $muxStatus];
                    if ($muxStatus === 'active' && !$stream->started_at) {
                        $updates['started_at'] = now();
                    }
                    $stream->update($updates);
                }
            } catch (\Exception $e) {
                // Silent fail — status stays as-is
            }
        }

        return response()->json([
            'status'        => $stream->status,
            'viewers_count' => $stream->viewers_count,
            'messages'      => $messages,
        ]);
    }

    // Coach: WHIP proxy — forwards SDP offer to mediamtx (localhost:8889)
    // mediamtx receives WebRTC and re-streams to Mux via ffmpeg
    public function whipProxy(Request $request, $streamId)
    {
        $stream = LiveStream::findOrFail($streamId);

        if ($stream->coach->user_id !== auth()->id()) {
            abort(403);
        }

        $sdpOffer = $request->getContent();
        if (empty($sdpOffer)) {
            return response('SDP offer required', 400);
        }

        // mediamtx WHIP endpoint — path = Mux stream key
        $mediamtxUrl = 'http://127.0.0.1:8889/' . $stream->stream_key . '/whip';

        try {
            $http = new \GuzzleHttp\Client(['timeout' => 15]);
            $res = $http->post($mediamtxUrl, [
                'body'    => $sdpOffer,
                'headers' => ['Content-Type' => 'application/sdp'],
            ]);

            return response($res->getBody()->getContents(), $res->getStatusCode())
                ->header('Content-Type', 'application/sdp');

        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $body = $e->getResponse()->getBody()->getContents();
            Log::error('WHIP proxy error: ' . $body);
            return response('mediamtx error: ' . $body, $e->getResponse()->getStatusCode());
        } catch (\Exception $e) {
            Log::error('WHIP proxy exception: ' . $e->getMessage());
            return response('WHIP proxy failed: ' . $e->getMessage(), 500);
        }
    }

    private function notifyViewers(LiveStream $stream, Coach $coach): void
    {
        try {
            if ($stream->access === 'everyone') {
                $userIds = DB::table('follows')
                    ->where('following_id', $coach->user_id)
                    ->pluck('follower_id');
            } else {
                $userIds = DB::table('subscriptions')
                    ->where('coach_id', $coach->id)
                    ->whereIn('stripe_status', ['active', 'trialing'])
                    ->pluck('user_id');
            }

            if ($userIds->isEmpty()) {
                return;
            }

            $now = now();
            $notifications = $userIds->map(fn ($uid) => [
                'user_id'    => $uid,
                'type'       => 'live_stream',
                'title'      => '🔴 ' . $coach->user->name . ' práve streamuje!',
                'body'       => $stream->title,
                'data'       => json_encode(['stream_id' => $stream->id]),
                'related_id' => $stream->id,
                'is_read'    => false,
                'created_at' => $now,
                'updated_at' => $now,
            ])->toArray();

            DB::table('notifications')->insert($notifications);

        } catch (\Exception $e) {
            Log::warning('Live stream notify error: ' . $e->getMessage());
        }
    }
}
