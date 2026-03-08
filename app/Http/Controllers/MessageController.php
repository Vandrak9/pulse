<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Get all unique conversation partners
        $sentIds = Message::where('sender_id', $user->id)->pluck('receiver_id');
        $receivedIds = Message::where('receiver_id', $user->id)->pluck('sender_id');
        $partnerIds = $sentIds->merge($receivedIds)->unique()->values();

        $conversations = [];
        foreach ($partnerIds as $partnerId) {
            $partner = User::find($partnerId);
            if (!$partner) continue;

            $lastMessage = Message::where(function ($q) use ($user, $partnerId) {
                $q->where('sender_id', $user->id)->where('receiver_id', $partnerId);
            })->orWhere(function ($q) use ($user, $partnerId) {
                $q->where('sender_id', $partnerId)->where('receiver_id', $user->id);
            })->orderByDesc('id')->first();

            $unreadCount = Message::where('sender_id', $partnerId)
                ->where('receiver_id', $user->id)
                ->where('is_read', false)
                ->count();

            $coach = $partner->coach ?? null;
            $avatarUrl = $coach && $coach->avatar_path
                ? '/storage/' . $coach->avatar_path
                : null;

            $conversations[] = [
                'partner_id' => $partnerId,
                'partner_name' => $partner->name,
                'partner_role' => $partner->role,
                'partner_avatar' => $avatarUrl,
                'last_message' => $lastMessage ? [
                    'content' => $lastMessage->content,
                    'created_at' => $lastMessage->created_at,
                    'is_mine' => $lastMessage->sender_id === $user->id,
                    'message_type' => $lastMessage->message_type ?? 'text',
                ] : null,
                'unread_count' => $unreadCount,
            ];
        }

        // Sort by last message (most recent first)
        usort($conversations, function ($a, $b) {
            $aTime = $a['last_message']['created_at'] ?? '0';
            $bTime = $b['last_message']['created_at'] ?? '0';
            return strcmp($bTime, $aTime);
        });

        return Inertia::render('Messages/Index', [
            'conversations' => $conversations,
        ]);
    }

    public function show($userId)
    {
        $user = auth()->user();
        $partner = User::findOrFail($userId);

        $messages = Message::where(function ($q) use ($user, $userId) {
            $q->where('sender_id', $user->id)->where('receiver_id', $userId);
        })->orWhere(function ($q) use ($user, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $user->id);
        })->orderBy('id')->get();

        // Mark messages as read
        Message::where('sender_id', $userId)
            ->where('receiver_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $coach = $partner->coach ?? null;
        $avatarUrl = $coach && $coach->avatar_path
            ? '/storage/' . $coach->avatar_path
            : null;

        $formattedMessages = $messages->map(function ($msg) use ($user) {
            return [
                'id' => $msg->id,
                'content' => $msg->content,
                'is_mine' => $msg->sender_id === $user->id,
                'is_read' => $msg->is_read,
                'read_at' => $msg->read_at,
                'created_at' => $msg->created_at,
                'message_type' => $msg->message_type ?? 'text',
                'media_path' => $msg->media_path ? '/storage/' . $msg->media_path : null,
                'media_thumbnail' => $msg->media_thumbnail ?? null,
                'media_duration' => $msg->media_duration ?? null,
            ];
        });

        return Inertia::render('Messages/Show', [
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'role' => $partner->role,
                'avatar' => $avatarUrl,
                'is_verified' => $coach ? $coach->is_verified : false,
            ],
            'messages' => $formattedMessages,
        ]);
    }

    public function store(Request $request, $userId)
    {
        $request->validate([
            'content' => 'required_without:file|string|max:1000|nullable',
            'file' => 'nullable|file|max:51200',
        ]);

        $user = auth()->user();
        User::findOrFail($userId);

        $messageType = 'text';
        $mediaPath = null;
        $mediaThumbnail = null;
        $mediaDuration = null;
        $mediaSize = null;
        $content = $request->content ?? '';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $mime = $file->getMimeType();
            $mediaSize = $file->getSize();

            if (str_starts_with($mime, 'image/')) {
                $messageType = 'image';
                $mediaPath = Storage::disk('public')->put('messages/images', $file);
                $content = '';
            } elseif (str_starts_with($mime, 'video/')) {
                $messageType = 'video';
                $mediaPath = Storage::disk('public')->put('messages/videos', $file);
                $content = '';
            } elseif (str_starts_with($mime, 'audio/')) {
                $messageType = 'voice';
                $mediaPath = Storage::disk('public')->put('messages/voice', $file);
                $content = '';
            }
        }

        Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $userId,
            'content' => $content,
            'price_paid' => 0,
            'is_paid' => false,
            'is_read' => false,
            'message_type' => $messageType,
            'media_path' => $mediaPath,
            'media_thumbnail' => $mediaThumbnail,
            'media_duration' => $mediaDuration,
            'media_size' => $mediaSize,
            'is_broadcast' => false,
            'created_at' => now(),
        ]);

        return back();
    }

    public function unreadCount()
    {
        $count = Message::where('receiver_id', auth()->id())
            ->where('is_read', false)
            ->count();
        return response()->json(['count' => $count]);
    }
}
