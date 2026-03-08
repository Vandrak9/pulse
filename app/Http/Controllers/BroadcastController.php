<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Message;
use App\Models\User;
use App\Jobs\SendBroadcastJob;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BroadcastController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $broadcasts = Broadcast::where('coach_id', $user->id)
            ->withCount('recipients')
            ->with(['recipients' => function ($q) {
                $q->where('is_read', true);
            }])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($b) {
                $totalRecipients = $b->recipients_count;
                $readCount = $b->recipients->count();
                return [
                    'id' => $b->id,
                    'content' => $b->content,
                    'message_type' => $b->message_type,
                    'sent_at' => $b->sent_at,
                    'created_at' => $b->created_at,
                    'total_recipients' => $totalRecipients,
                    'read_count' => $readCount,
                    'open_rate' => $totalRecipients > 0 ? round(($readCount / $totalRecipients) * 100) : 0,
                ];
            });

        // Count subscribers
        $coach = $user->coach;
        $subscriberCount = 0;
        if ($coach) {
            $subscriberCount = \App\Models\User::whereHas('subscriptions', function ($q) use ($coach) {
                $q->where('name', 'coach_' . $coach->id)->where('stripe_status', 'active');
            })->count();
            // For dev: fallback to subscriber_count field
            if ($subscriberCount === 0) {
                $subscriberCount = $coach->subscriber_count ?? 0;
            }
        }

        return Inertia::render('Dashboard/Broadcast', [
            'broadcasts' => $broadcasts,
            'subscriber_count' => $subscriberCount,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['content' => 'required|string|max:1000']);

        $user = auth()->user();

        $broadcast = Broadcast::create([
            'coach_id' => $user->id,
            'content' => $request->content,
            'message_type' => 'text',
        ]);

        SendBroadcastJob::dispatch($broadcast);

        return back()->with('success', 'Broadcast odoslaný!');
    }
}
