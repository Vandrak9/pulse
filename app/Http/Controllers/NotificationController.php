<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Notification::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'body'       => $n->body,
                'data'       => $n->data,
                'related_id' => $n->related_id,
                'is_read'    => $n->is_read,
                'read_at'    => $n->read_at,
                'created_at' => $n->created_at,
            ]);

        $unreadCount = $notifications->where('is_read', false)->count();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    public function unreadCount()
    {
        $count = Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markAllRead()
    {
        Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return back();
    }

    public function markOneRead(Request $request, $id)
    {
        Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->update(['is_read' => true, 'read_at' => now()]);

        return back();
    }
}
