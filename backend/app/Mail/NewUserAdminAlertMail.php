<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewUserAdminAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '🆕 নতুন ব্যবহারকারী নিবন্ধন — ' . $this->user->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new_user_admin_alert',
            with: [
                'user'        => $this->user,
                'userPageUrl' => rtrim(config('app.url'), '/') . "/admin/users/{$this->user->id}/activity",
                'usersUrl'    => rtrim(config('app.url'), '/') . '/admin/users',
            ],
        );
    }
}
