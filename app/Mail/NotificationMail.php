<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $title,
        public string $body,
        public string $actionUrl,
        public string $actionText,
        public string $type,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->title . ' — PULSE');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.notification');
    }

    public function attachments(): array
    {
        return [];
    }
}
