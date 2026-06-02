<?php

namespace App\Mail;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * One mailable, three variants — kind decides the subject + which Blade
 * partial renders. Keeps T-3, T-1, and expired in lockstep so future copy
 * tweaks land in one place.
 */
class SubscriptionRenewalMail extends Mailable
{
    use Queueable, SerializesModels;

    public const KIND_EXPIRING_3D = 'expiring_3d';
    public const KIND_EXPIRING_1D = 'expiring_1d';
    public const KIND_EXPIRED     = 'expired';

    public function __construct(
        public User $user,
        public Subscription $subscription,
        public string $kind,
        public string $renewUrl,
    ) {}

    public function envelope(): Envelope
    {
        $planName = optional($this->subscription->plan)->name ?? 'Plan';

        $subject = match ($this->kind) {
            self::KIND_EXPIRING_3D => "{$planName} plan expires in 3 days — Renew now",
            self::KIND_EXPIRING_1D => "{$planName} plan expires tomorrow — Renew now",
            self::KIND_EXPIRED     => "{$planName} plan has expired — Renew to restore access",
            default                => "{$planName} subscription update",
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription_renewal',
            with: [
                'user'         => $this->user,
                'subscription' => $this->subscription,
                'plan'         => $this->subscription->plan,
                'kind'         => $this->kind,
                'renewUrl'     => $this->renewUrl,
                'expiresAt'    => $this->subscription->expiry_date,
            ],
        );
    }
}
