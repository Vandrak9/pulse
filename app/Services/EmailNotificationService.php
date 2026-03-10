<?php

namespace App\Services;

use App\Mail\NotificationMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EmailNotificationService
{
    public function send(User $user, string $type, array $data): void
    {
        // Don't send if email not verified
        if (!$user->email_verified_at) {
            return;
        }

        // Check user's email preference for this type
        $prefColumn = 'email_notif_' . $type;
        $pref = $user->$prefColumn ?? true;
        if (!$pref) {
            return;
        }

        $config = $this->buildConfig($type, $data);
        if (!$config) {
            return;
        }

        try {
            Mail::to($user->email)->queue(
                new NotificationMail(
                    title:      $config['title'],
                    body:       $config['body'],
                    actionUrl:  $config['actionUrl'],
                    actionText: $config['actionText'],
                    type:       $type,
                )
            );
        } catch (\Exception $e) {
            Log::warning('Email notification failed: ' . $e->getMessage(), [
                'type'    => $type,
                'user_id' => $user->id,
            ]);
        }
    }

    private function buildConfig(string $type, array $data): ?array
    {
        $appUrl = config('app.url');
        $name   = $data['name'] ?? 'Niekto';

        return match ($type) {
            'new_subscriber' => [
                'title'      => 'Nový predplatiteľ! 🎉',
                'body'       => "{$name} sa prihlásil na odber tvojho profilu na PULSE.",
                'actionUrl'  => "{$appUrl}/profile/me",
                'actionText' => 'Zobraziť predplatiteľov',
            ],
            'new_message' => [
                'title'      => "Nová správa od {$name}",
                'body'       => "{$name} ti poslal správu: \"" . Str::limit($data['preview'] ?? '', 80) . '"',
                'actionUrl'  => "{$appUrl}/messages/" . ($data['sender_id'] ?? ''),
                'actionText' => 'Odpovedať',
            ],
            'new_review' => [
                'title'      => 'Nové hodnotenie ⭐',
                'body'       => "{$name} ti zanechal " . ($data['rating'] ?? 5) . '★ hodnotenie.',
                'actionUrl'  => isset($data['coach_id'])
                    ? "{$appUrl}/coaches/{$data['coach_id']}"
                    : "{$appUrl}/profile/me",
                'actionText' => 'Zobraziť recenziu',
            ],
            'new_like' => [
                'title'      => 'Niekto lajkol tvoj príspevok ❤️',
                'body'       => "{$name} označil tvoj príspevok \"" . ($data['post_title'] ?? '') . '" srdcom.',
                'actionUrl'  => "{$appUrl}/feed",
                'actionText' => 'Zobraziť príspevok',
            ],
            'new_post' => [
                'title'      => ($data['coach_name'] ?? 'Kouč') . ' pridal nový obsah',
                'body'       => 'Na PULSE je nový príspevok: "' . ($data['post_title'] ?? '') . '"',
                'actionUrl'  => "{$appUrl}/feed",
                'actionText' => 'Zobraziť obsah',
            ],
            default => null,
        };
    }
}
