<?php

namespace App\Jobs;

use App\Models\Broadcast;
use App\Models\BroadcastRecipient;
use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBroadcastJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Broadcast $broadcast) {}

    public function handle(): void
    {
        $coach = $this->broadcast->coach;

        // Get all subscribers (for dev: get all fans)
        $subscribers = User::where('role', 'fan')->get();

        $messages = [];
        $recipients = [];
        $now = now();

        foreach ($subscribers->chunk(50) as $chunk) {
            foreach ($chunk as $subscriber) {
                $messages[] = [
                    'sender_id' => $coach->id,
                    'receiver_id' => $subscriber->id,
                    'content' => $this->broadcast->content,
                    'price_paid' => 0,
                    'is_paid' => false,
                    'is_read' => false,
                    'is_broadcast' => true,
                    'message_type' => $this->broadcast->message_type,
                    'created_at' => $now,
                ];
                $recipients[] = [
                    'broadcast_id' => $this->broadcast->id,
                    'user_id' => $subscriber->id,
                    'is_read' => false,
                    'created_at' => $now,
                ];
            }
            Message::insert($messages);
            BroadcastRecipient::insert($recipients);
            $messages = [];
            $recipients = [];
        }

        $this->broadcast->update(['sent_at' => $now]);
    }
}
