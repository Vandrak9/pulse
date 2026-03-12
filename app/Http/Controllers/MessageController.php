<?php

namespace App\Http\Controllers;

use App\Mail\NotificationMail;
use App\Models\Message;
use App\Models\User;
use App\Services\EmailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function index()
    {
        return Inertia::render('Messages/Index', [
            'conversations' => $this->buildConversations(auth()->user()),
        ]);
    }

    public function show($userId)
    {
        $user    = auth()->user();
        $partner = User::findOrFail($userId);

        $messages = Message::where(function ($q) use ($user, $userId) {
            $q->where('sender_id', $user->id)->where('receiver_id', $userId);
        })->orWhere(function ($q) use ($user, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $user->id);
        })->orderBy('id')->get();

        // Mark received messages as read
        Message::where('sender_id', $userId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $coach     = $partner->coach ?? null;
        $avatarUrl = $coach && $coach->avatar_path
            ? '/storage/' . $coach->avatar_path
            : null;

        $formattedMessages = $messages->map(function ($msg) use ($user) {
            return [
                'id'              => $msg->id,
                'content'         => $msg->content,
                'is_mine'         => $msg->sender_id === $user->id,
                'is_read'         => $msg->is_read,
                'read_at'         => $msg->read_at,
                'created_at'      => $msg->created_at,
                'message_type'    => $msg->message_type ?? 'text',
                'media_path'      => $msg->media_path ? Storage::disk('public')->url($msg->media_path) : null,
                'media_thumbnail' => $msg->media_thumbnail ?? null,
                'media_duration'  => $msg->media_duration ?? null,
                'media_mime_type' => $msg->media_mime_type ?? null,
            ];
        });

        $lastSeen = $partner->last_seen_at;
        $isOnline = $lastSeen && $lastSeen->gt(now()->subMinutes(5));

        return Inertia::render('Messages/Show', [
            'partner'       => [
                'id'           => $partner->id,
                'name'         => $partner->name,
                'role'         => $partner->role,
                'avatar'       => $avatarUrl,
                'is_verified'  => $coach ? $coach->is_verified : false,
                'is_online'    => $isOnline,
                'last_seen_at' => $lastSeen ? $lastSeen->toISOString() : null,
            ],
            'messages'      => $formattedMessages,
            'conversations' => $this->buildConversations($user),
        ]);
    }

    private function buildConversations($user): array
    {
        $allMessages = Message::where('sender_id', $user->id)
            ->orWhere('receiver_id', $user->id)
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        if ($allMessages->isEmpty()) return [];

        $conversationMap = [];
        foreach ($allMessages as $msg) {
            $partnerId = $msg->sender_id === $user->id ? $msg->receiver_id : $msg->sender_id;
            if (!isset($conversationMap[$partnerId])) {
                $conversationMap[$partnerId] = ['last' => $msg, 'unread' => 0];
            }
            if ($msg->receiver_id === $user->id && !$msg->is_read) {
                $conversationMap[$partnerId]['unread']++;
            }
        }

        $partners = User::with('coach')
            ->whereIn('id', array_keys($conversationMap))
            ->get()->keyBy('id');

        $conversations = [];
        foreach ($conversationMap as $partnerId => $data) {
            $partner = $partners->get($partnerId);
            if (!$partner) continue;
            $c         = $partner->coach ?? null;
            $avatarUrl = $c && $c->avatar_path ? '/storage/' . $c->avatar_path : null;
            $lastMsg   = $data['last'];
            $conversations[] = [
                'partner_id'        => $partnerId,
                'partner_name'      => $partner->name,
                'partner_role'      => $partner->role,
                'partner_avatar'    => $avatarUrl,
                'partner_is_online' => $partner->last_seen_at?->gt(now()->subMinutes(5)) ?? false,
                'last_message'      => [
                    'content'      => $lastMsg->content,
                    'created_at'   => $lastMsg->created_at,
                    'is_mine'      => $lastMsg->sender_id === $user->id,
                    'message_type' => $lastMsg->message_type ?? 'text',
                ],
                'unread_count' => $data['unread'],
            ];
        }

        usort($conversations, function ($a, $b) {
            $aU = $a['unread_count'] > 0 ? 1 : 0;
            $bU = $b['unread_count'] > 0 ? 1 : 0;
            if ($aU !== $bU) return $bU - $aU;
            return strcmp((string) ($b['last_message']['created_at'] ?? '0'), (string) ($a['last_message']['created_at'] ?? '0'));
        });

        return $conversations;
    }

    public function store(Request $request, $userId)
    {
        $request->validate([
            'content'        => 'required_without:media|string|max:1000|nullable',
            'media'          => 'nullable|file|max:81920|mimetypes:image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,audio/mp4,audio/webm,audio/ogg,audio/mpeg,audio/wav',
            'voice_duration' => 'nullable|integer|min:1|max:3600',
        ]);

        $user     = auth()->user();
        $receiver = User::findOrFail($userId);

        // ── Message access policy ────────────────────────────────────────────────
        if ($receiver->role === 'coach' && $receiver->coach) {
            $access   = $receiver->coach->messages_access ?? 'everyone';
            $senderId = $user->id;

            $deny = function (string $msg) use ($request) {
                if ($request->header('X-Inertia')) {
                    return back()->withErrors(['access' => $msg]);
                }
                return response()->json(['error' => $msg], 403);
            };

            if ($access === 'nobody') {
                return $deny('Tento kouč má správy vypnuté.');
            }

            if ($access === 'subscribers') {
                $isSubscribed = DB::table('subscriptions')
                    ->where('user_id', $senderId)
                    ->where('stripe_status', 'active')
                    ->where('subscribable_id', $receiver->coach->id)
                    ->exists();
                if (!$isSubscribed) {
                    return $deny('Len predplatitelia môžu písať tomuto koučovi.');
                }
            }

            if ($access === 'followers') {
                $isFollowing = DB::table('follows')
                    ->where('follower_id', $senderId)
                    ->where('following_id', $userId)
                    ->exists();
                if (!$isFollowing) {
                    return $deny('Najprv sleduj kouča, aby si mu mohol písať.');
                }
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        $messageType   = 'text';
        $mediaPath     = null;
        $mediaMime     = null;
        $mediaDuration = null;
        $mediaSize     = null;
        $content       = $request->input('content', '');

        if ($request->hasFile('media')) {
            $file       = $request->file('media');
            $mediaMime  = $file->getMimeType();
            $mediaSize  = $file->getSize();
            $clientType = $request->input('message_type');

            // Determine message type server-side from MIME.
            // Exception: trust client voice flag only when file is audio or video
            // (iOS records audio/mp4 which PHP misdetects as video/mp4).
            if ($clientType === 'voice' && (str_starts_with($mediaMime, 'audio/') || str_starts_with($mediaMime, 'video/'))) {
                $messageType   = 'voice';
                $mediaPath     = $file->store('messages/voice', 'public');
                $mediaDuration = $request->integer('voice_duration') ?: null;
                $content       = '';
            } elseif (str_starts_with($mediaMime, 'image/')) {
                $messageType = 'image';
                $mediaPath   = $file->store('messages/images', 'public');
                $content     = '';
            } elseif (str_starts_with($mediaMime, 'video/')) {
                $messageType = 'video';
                $mediaPath   = $file->store('messages/videos', 'public');
                $content     = '';
            } elseif (str_starts_with($mediaMime, 'audio/')) {
                $messageType   = 'voice';
                $mediaPath     = $file->store('messages/voice', 'public');
                $mediaDuration = $request->integer('voice_duration') ?: null;
                $content       = '';
            }
        }

        $message = Message::create([
            'sender_id'       => $user->id,
            'receiver_id'     => $userId,
            'content'         => $content,
            'price_paid'      => 0,
            'is_paid'         => false,
            'is_read'         => false,
            'message_type'    => $messageType,
            'media_path'      => $mediaPath,
            'media_mime_type' => $mediaMime,
            'media_thumbnail' => null,
            'media_duration'  => $mediaDuration,
            'media_size'      => $mediaSize,
            'is_broadcast'    => false,
            'created_at'      => now(),
        ]);

        // Send email notification to receiver
        app(EmailNotificationService::class)->send(
            $receiver,
            'new_message',
            [
                'name'      => $user->name,
                'preview'   => $content ?: '📎 Médiá',
                'sender_id' => $user->id,
            ]
        );

        // Inertia text posts get a redirect; axios file uploads get JSON
        if ($request->header('X-Inertia') && !$request->hasFile('media')) {
            return back();
        }

        $mediaUrl = $mediaPath ? Storage::disk('public')->url($mediaPath) : null;

        return response()->json([
            'ok'      => true,
            'message' => [
                'id'              => $message->id,
                'content'         => $message->content,
                'is_mine'         => true,
                'is_read'         => false,
                'read_at'         => null,
                'created_at'      => $message->created_at->toISOString(),
                'message_type'    => $message->message_type,
                'media_path'      => $mediaUrl,
                'media_thumbnail' => null,
                'media_duration'  => $mediaDuration,
                'media_mime_type' => $mediaMime,
            ],
        ]);
    }

    public function unreadCount()
    {
        $count = Message::where('receiver_id', auth()->id())
            ->where('is_read', false)
            ->count();
        return response()->json(['count' => $count]);
    }
}
