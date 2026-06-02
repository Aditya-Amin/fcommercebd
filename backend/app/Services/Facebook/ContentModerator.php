<?php

namespace App\Services\Facebook;

/**
 * First-line content checks before sending anything to Facebook.
 *
 * NOTE: this is NOT a substitute for Meta's own moderation. It catches the
 * obvious spam / policy violations that we should never even submit, plus
 * cosmetic issues that hurt deliverability (excessive emojis, all-caps shouting,
 * etc.). Anything we let through still goes through Meta's review on their end.
 */
class ContentModerator
{
    /** @var list<string> */
    private const PROHIBITED_PATTERNS = [
        // engagement bait
        'like and share to win', 'like & share to win', 'tag 5 friends',
        'tag your friends to win', 'comment to win', 'share for a chance',
        // adult / hate / harm — basic word filter (extend with a real provider for production)
        'porn', 'pornography', 'xxx ', 'sex chat', 'escort service',
        'kill yourself', 'hate ', 'racist',
        // fraud
        'bitcoin doubler', 'guaranteed profit', 'free money', 'wire transfer',
        // misleading
        'lose 10kg in', 'lose 20 pounds in', 'doctors hate this',
    ];

    /** @var list<string> */
    private const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png'];

    public function __construct(
        private readonly int $maxBytes = 8 * 1024 * 1024,
        private readonly int $maxMessageLength = 5000,
        private readonly int $maxEmojiCount = 30,
    ) {}

    /**
     * Validate text content. Returns a list of human-readable violations.
     *
     * @return array<int, string>
     */
    public function checkText(?string $message): array
    {
        $violations = [];
        if ($message === null || trim($message) === '') {
            return $violations;
        }
        $normalized = mb_strtolower($message);

        if (mb_strlen($message) > $this->maxMessageLength) {
            $violations[] = "Message exceeds {$this->maxMessageLength} characters.";
        }

        foreach (self::PROHIBITED_PATTERNS as $needle) {
            if (str_contains($normalized, $needle)) {
                $violations[] = "Contains prohibited pattern: \"{$needle}\".";
            }
        }

        // Excessive emoji — count any code point above U+1F000 (rough but effective).
        $emojis = preg_match_all('/[\x{1F000}-\x{1FFFF}\x{2600}-\x{27BF}]/u', $message);
        if ($emojis > $this->maxEmojiCount) {
            $violations[] = "Too many emojis ({$emojis}); max {$this->maxEmojiCount}.";
        }

        // Shouting check: more than 70% uppercase letters in a long message
        $letters = preg_replace('/[^A-Za-z]/', '', $message) ?? '';
        if (strlen($letters) > 80) {
            $upper = preg_replace('/[^A-Z]/', '', $letters) ?? '';
            if (strlen($upper) / max(1, strlen($letters)) > 0.7) {
                $violations[] = 'Excessive ALL-CAPS — looks like shouting.';
            }
        }

        // Suspicious link spam (more than 4 raw URLs)
        if (preg_match_all('#https?://#i', $message) > 4) {
            $violations[] = 'Too many links in one post.';
        }

        return $violations;
    }

    /**
     * @param  array{url:string, mime?:string, bytes?:int}  $image
     * @return array<int, string>
     */
    public function checkImage(array $image): array
    {
        $violations = [];

        if (! filter_var($image['url'] ?? '', FILTER_VALIDATE_URL)) {
            $violations[] = 'Invalid image URL.';
        }

        if (isset($image['mime']) && ! in_array($image['mime'], self::ALLOWED_IMAGE_MIME, true)) {
            $violations[] = 'Image must be JPG or PNG.';
        }

        if (isset($image['bytes']) && $image['bytes'] > $this->maxBytes) {
            $violations[] = 'Image exceeds 8 MB.';
        }

        return $violations;
    }

    /**
     * @param  array<int, array{url:string, mime?:string, bytes?:int}>  $images
     * @return array<int, string>
     */
    public function checkImages(array $images): array
    {
        $violations = [];
        foreach ($images as $i => $img) {
            foreach ($this->checkImage($img) as $msg) {
                $violations[] = "Image #" . ($i + 1) . ": {$msg}";
            }
        }
        return $violations;
    }
}
