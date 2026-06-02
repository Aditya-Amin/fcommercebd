# Facebook Page Integration

Production-ready integration with the **Facebook Graph API** (v21.0) for SaaS
users to connect a Facebook Page and publish text / photo / link posts —
including AI-generated captions built from a Product row.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/facebook/connect` | sanctum | Returns the OAuth dialog URL the SPA should redirect to |
| GET | `/api/facebook/callback` | public | Facebook redirects here after the user grants permissions |
| GET | `/api/facebook/pages` | sanctum | List the user's connected pages |
| DELETE | `/api/facebook/pages/{page}` | sanctum | Disconnect a page (deletes the row + token) |
| POST | `/api/facebook/post` | sanctum | Validate, moderate, rate-limit, then queue a post |
| GET | `/api/facebook/posts` | sanctum | Recent post history with status |
| DELETE | `/api/facebook/posts/{post}` | sanctum | Cancel a queued or scheduled post |
| POST | `/api/ai/generate-post` | sanctum | Generate caption + hashtags for a Product |

## Example requests

### 1. Start OAuth

```http
POST /api/facebook/connect
Authorization: Bearer <user-token>
```

Returns:

```json
{
  "data": {
    "state": "MGwOq...40chars",
    "url": "https://www.facebook.com/v21.0/dialog/oauth?client_id=...&scope=pages_show_list,pages_read_engagement,pages_manage_posts&..."
  }
}
```

The SPA does `window.location.href = data.url`. Facebook redirects the browser
back to `GET /api/facebook/callback?code=...&state=...`. The handler exchanges
the code, fetches the user's pages, persists each one (with the per-page access
token encrypted), then 302s the browser to `FACEBOOK_FRONTEND_SUCCESS_URL`.

### 2. Generate AI caption

```http
POST /api/ai/generate-post
Content-Type: application/json
Authorization: Bearer <user-token>

{ "product_id": 4, "tone": "promo", "language": "mixed" }
```

Returns:

```json
{
  "data": {
    "productId": "4",
    "caption": "Limited offer! Hand-stitched Saree — Maroon matro Tk 3490 e!\n\nBridal collection.\n\nOrder korte inbox koren.",
    "hashtags": ["#FcommerceBD", "#OnlineShoppingBD", "#saree", "#wedding"],
    "images": ["https://images.unsplash.com/..."],
    "primary": "https://images.unsplash.com/..."
  }
}
```

### 3. Publish a photo post

```http
POST /api/facebook/post
Content-Type: application/json
Authorization: Bearer <user-token>

{
  "facebook_page_id": 1,
  "product_id": 4,
  "type": "photo",
  "message": "Limited offer! Hand-stitched Saree — Maroon",
  "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
  "hashtags": ["#FcommerceBD", "#saree"]
}
```

Returns 202 Accepted with the queued post row. The job queue picks it up and
calls `POST /{page-id}/photos`. The status row flips to `publishing` →
`published` (with `fbPostId` + `fbPermalink`) or `failed` (with `errorCode` +
`errorMessage`).

### 4. Schedule a post

Same body as above plus:

```json
{ "scheduled_at": "2025-05-04T18:30:00+06:00" }
```

The job is dispatched with `delay()` — it sits on the queue until the
scheduled time, then runs through the same publish path.

## Token security

* **Encryption at rest** — `access_token` and `user_access_token` columns use
  Laravel's `'encrypted'` cast, so every read/write goes through `Crypt::encrypt`
  using `APP_KEY`. The DB never holds plaintext tokens.
* **Hidden from JSON** — both fields are listed in the model's `$hidden` array.
  No API response can ever leak them.
* **Refresh on long-lived exchange** — short-lived user tokens are immediately
  exchanged for long-lived (~60 day) tokens before storage. Page tokens derived
  from a long-lived user token are themselves long-lived (effectively
  non-expiring) per Facebook's docs.
* **Auth-error → page disabled** — if the publish job hits codes 190, 102, 200,
  459 or 463, the page row is set to `is_active = false` and the user is
  prompted to re-connect from the SPA.

## Content moderation

Before any Graph call, `ContentModerator` checks:

* prohibited patterns: engagement bait (`like and share to win`, `tag 5 friends`),
  hate, adult, fraud, miracle-cure language
* message length (5,000 chars max)
* emoji density (max 30 emoji per post)
* shouting (>70% uppercase letters in messages over 80 chars)
* link spam (max 4 raw URLs)
* image MIME (`image/jpeg`, `image/png`) and file size (8 MB safe limit)

Violations return `422` with a `violations: [...]` array — the SPA shows them
inline in the post composer.

## Rate limiting

`PostingRateLimiter` enforces per-page safeguards (defaults from
`config/facebook.php`):

* **25 posts per day** (rolling 24h window, counts queued + scheduled +
  published)
* **5-minute minimum gap** between any two posts on the same page

Hitting either returns `429` with `next_allowed_at` so the SPA can disable
the post button or pre-fill the schedule field.

If Facebook's own rate-limit codes (4, 17, 32, 613) come back from a publish
attempt, the job releases itself back onto the queue with a doubled-gap delay.

## Job queue & retries

`PublishToFacebookJob` is queued — set `QUEUE_CONNECTION=database` (or `redis`)
and run a worker:

```bash
php artisan queue:table   # only first time, for the database driver
php artisan migrate
php artisan queue:work --queue=default --tries=5
```

Retry policy:

* 5 tries total
* exponential backoff: 60s -> 120s -> 240s -> 480s -> 960s
* transient errors (5xx, FB code 1/2) -> retry per backoff
* rate-limit errors (4/17/32/613) -> re-released after `min_gap_seconds * 2`
* auth errors (190/102/200/459/463) -> page deactivated, post marked `rejected`,
  no retry

Every step writes to the dedicated `facebook` log channel
(`storage/logs/facebook.log`, daily rotation, secrets scrubbed).

## App Review (REQUIRED for production)

The three permissions we request all need Facebook App Review before they work
for end users:

* `pages_show_list`
* `pages_read_engagement`
* `pages_manage_posts`

While the app is in **Development mode**, only:

* the app developer
* test users created in the app dashboard
* roles you've added (Admin / Developer / Tester)

…can grant the permissions. Real users will see "This app is in development".

### Submitting for App Review

1. **App must be in Live mode** — toggle in App dashboard -> Basic.
2. **Privacy Policy URL** — public, reachable, mentions Facebook data.
3. **Terms of Service URL** — public.
4. **Business Verification** — submit your business documents under
   *App Settings -> Business Verification*.
5. **Data Use Checkup** — declare what you do with Facebook data.
6. **Per-permission justification** — for each scope, write a 2-3 sentence
   explanation. Example for `pages_manage_posts`:

   > Our SaaS lets small Bangladeshi e-commerce sellers schedule and publish
   > product posts to their own Facebook Pages. We use `pages_manage_posts`
   > strictly to call `POST /{page-id}/feed` and `POST /{page-id}/photos` on
   > behalf of the page admin who connected their page through OAuth. No
   > posts are made without an explicit user action in the dashboard.

7. **Reviewer test instructions** — in App Review -> Submission, give:

   > 1. Create a test account on https://app.fcommerce.bd/register
   > 2. Go to **Integrations** in the dashboard sidebar -> click **Connect Facebook Page**
   > 3. Approve the requested permissions
   > 4. Go to **AI Generate**, pick any product, click **Generate AI post**
   > 5. Click **Post to Facebook now** — the post will appear on the connected page within 30s

8. **Screencast** — 1-2 min video walking through the flow above. Required.

Plan ~5–10 business days for review on the first submission.

## Sandbox / dev workflow

For local development:

* Add your developer Facebook account as an **Admin** in the App dashboard
  -> Roles -> Roles. You can connect **your own** Facebook Pages without App
  Review while in development.
* Use **ngrok** (or any public tunnel) to expose `localhost:8000` so Facebook
  can reach `/api/facebook/callback`. The redirect URI in your `.env` and in
  the App's Valid OAuth Redirect URIs list must both point to the ngrok URL.

```bash
ngrok http 8000
# copy the https://xxxx.ngrok-free.app URL into both:
#   - backend/.env             -> FACEBOOK_REDIRECT_URI=https://xxxx.ngrok-free.app/api/facebook/callback
#   - App dashboard -> Facebook Login -> Valid OAuth Redirect URIs
```

## Frontend integration (Next.js)

The SPA already wires this up:

* [components/facebook/FacebookIntegrationCard.tsx](../components/facebook/FacebookIntegrationCard.tsx) — Connect/Disconnect UI on the Integrations page
* [components/facebook/ProductPicker.tsx](../components/facebook/ProductPicker.tsx) — Product list with select state
* [components/facebook/PostPreview.tsx](../components/facebook/PostPreview.tsx) — Realistic Facebook post mock-up
* [app/(dashboard)/ai-generate/page.tsx](../app/(dashboard)/ai-generate/page.tsx) — Product picker -> AI -> Edit -> Publish flow
* [lib/api/facebook.ts](../lib/api/facebook.ts) — Mock + real API client (toggles on `NEXT_PUBLIC_LARAVEL_API_URL`)

When the env var is unset, everything runs against an in-browser mock that
persists pages and posts in `localStorage` so you can demo the full flow with
no backend running.
