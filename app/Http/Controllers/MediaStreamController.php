<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Support\Facades\Storage;

class MediaStreamController extends Controller
{
    public function stream($messageId)
    {
        $message = Message::findOrFail($messageId);
        $user = auth()->user();

        if ($message->sender_id !== $user->id && $message->receiver_id !== $user->id) {
            abort(403);
        }

        if (!$message->media_path || !Storage::disk('public')->exists($message->media_path)) {
            abort(404);
        }

        return response()->file(Storage::disk('public')->path($message->media_path));
    }
}
