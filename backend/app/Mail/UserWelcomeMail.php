<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'FcommerceBD-এ আপনাকে স্বাগতম! 🎉',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user_welcome',
            with: [
                'user'        => $this->user,
                'dashboardUrl' => config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')),
            ],
        );
    }
}
