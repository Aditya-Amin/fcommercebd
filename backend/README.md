# FcommerceBD — Laravel API

Production-ready Laravel 10 service backing the FcommerceBD SaaS dashboard.

Two big integrations live here:

* **bKash Tokenized Checkout** (PGW v1.2.0-beta) — covered by this README
* **Facebook Page integration** (OAuth + Graph API publishing + AI captions) — see [README-FACEBOOK.md](README-FACEBOOK.md)

## What's in this folder

| Path | Purpose |
|---|---|
| `app/Services/BkashService.php` | All bKash HTTP calls (Guzzle) — token, create, execute, query, refund |
| `app/Http/Controllers/Api/BkashController.php` | API endpoints + callback + webhook |
| `app/Http/Controllers/Api/SubscriptionController.php` | List user subscriptions, get active plan |
| `app/Http/Controllers/Api/ProductController.php` | Products CRUD + image upload |
| `app/Http/Controllers/Api/CategoryController.php` | Public list of product categories |
| `app/Http/Controllers/Api/FacebookController.php` | Facebook OAuth + page list + post + cancel |
| `app/Http/Controllers/Api/AiGenerateController.php` | AI caption generation from a product |
| `app/Http/Requests/Products/*.php` | Form-request validators for product create/update/upload |
| `app/Http/Requests/Facebook/*.php` | Form-request validators for Facebook posting + AI |
| `app/Http/Resources/{Product,Facebook}*Resource.php` | JSON serializers (camelCase to match frontend) |
| `app/Models/{Plan,Subscription,Payment,User,Product,Category,ProductImage,FacebookPage,FacebookPost}.php` | Eloquent models with relations |
| `app/Services/Facebook/FacebookGraphService.php` | All Graph API HTTP calls (OAuth + publish + permalinks) |
| `app/Services/Facebook/ContentModerator.php` | First-line content checks before posting |
| `app/Services/Facebook/PostingRateLimiter.php` | Per-page daily cap + minimum gap |
| `app/Services/Ai/AiPostGenerator.php` | Caption generator (stub / Anthropic / OpenAI) |
| `app/Jobs/PublishToFacebookJob.php` | Queueable publisher with exponential backoff + retry |
| `app/Exceptions/BkashException.php` | Typed exception so callers can map bKash error codes |
| `app/Exceptions/FacebookException.php` | Typed exception with Graph error code helpers |
| `database/migrations/*` | `plans`, `subscriptions`, `payments`, `categories`, `products`, `product_images`, `facebook_pages`, `facebook_posts` tables |
| `database/seeders/PlanSeeder.php` | Seeds Starter (৳149) and Growth (৳599) plans |
| `database/seeders/CategorySeeder.php` | Seeds product categories (Women, Men, Kids, etc.) |
| `config/bkash.php` | Reads bKash creds + URLs from env |
| `routes/api.php` | All payment, product and category routes |

## Product API endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/categories` | public | List active categories |
| GET | `/api/products` | sanctum | List user's products (filters: `search`, `category`, `status`, `page`, `per_page`) |
| GET | `/api/products/{id}` | sanctum | Show one product (must own) |
| POST | `/api/products` | sanctum | Create product with images array |
| PUT | `/api/products/{id}` | sanctum | Update product (owner only) |
| DELETE | `/api/products/{id}` | sanctum | Soft-delete product |
| POST | `/api/products/upload-image` | sanctum | Upload single image (multipart `image=<file>`), returns `{id, url}` |
| POST | `/api/categories` | sanctum | Create a new category (`{name, name_bn?}`); returns 409 on duplicate slug |

**Storage:** images go to `storage/app/public/products/`. Run `php artisan storage:link` once.

## Fixing IDE "Undefined type Schema/Route/Controller" errors

These errors come from Intelephense (or any PHP language server) not being able
to find the Laravel framework classes — they vanish once dependencies are
installed locally.

```bash
cd backend
composer install
```

That creates `vendor/` with the full Laravel framework. The IDE will then
resolve `Illuminate\Support\Facades\Schema`, `Route`, `JsonResponse`, the base
`Controller`, the `active()` scope on Eloquent models, etc. No code changes
needed — the files are correct as written.

If you don't have Composer yet: install it from https://getcomposer.org/, then
run the command above.

## One-time setup

```bash
# 1. Bootstrap a fresh Laravel 10 project (skip if you already have one)
composer create-project laravel/laravel:^10.0 backend

# 2. Drop the files from this folder into your project (preserve paths)

# 3. Install runtime dependencies
composer require guzzlehttp/guzzle laravel/sanctum

# 4. Configure environment
cp .env.example .env
php artisan key:generate

# 5. Migrate & seed
php artisan migrate --seed

# 6. Run
php artisan serve --port=8000
```

## Sandbox credentials (already in .env.example)

bKash publishes sandbox creds for testing. They're prefilled — run `php artisan serve`
and you can immediately test the full flow with bKash sandbox.

When you go live, replace them with the credentials bKash issues you, and flip
`BKASH_BASE_URL` from sandbox to `https://tokenized.pay.bka.sh/v1.2.0-beta`.

## Test card / wallet for sandbox

bKash provides public test wallets:
- Number: `01770618575`, OTP: `123456`, PIN: `12121`
- Number: `01619777282`, OTP: `123456`, PIN: `12121`

## Routes (all under `/api`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/bkash/token` | admin | Force-refresh and return id_token (debug) |
| `POST` | `/api/bkash/create-payment` | user | Start a payment for a plan, returns `bkashURL` |
| `GET`  | `/api/bkash/callback` | none | bKash redirects user here after wallet OTP — Laravel executes + redirects to Next.js |
| `POST` | `/api/bkash/execute-payment` | user | Manual execute (fallback when callback fails) |
| `POST` | `/api/bkash/query-payment` | user | Check payment status by paymentID |
| `POST` | `/api/bkash/refund` | admin | Refund a completed payment (full or partial) |
| `POST` | `/api/bkash/webhook` | signed | Async server-to-server notification |
| `GET`  | `/api/subscriptions/active` | user | Current user's active subscription |
| `GET`  | `/api/subscriptions` | user | All subscriptions for current user |
| `GET`  | `/api/plans` | none | List active plans |

## Payment flow (matches the spec exactly)

1. **Next.js** → `POST /api/bkash/create-payment { plan_id }`
2. **Laravel**:
   - Acquires/refreshes bKash id_token (cached)
   - Calls bKash `create` → receives `paymentID` + `bkashURL`
   - Persists a `payments` row with status=`initiated`
   - Returns `{ paymentID, bkashURL }`
3. **Next.js** → `window.location.href = bkashURL`
4. **bKash** → user pays → redirects to `GET /api/bkash/callback?paymentID=...&status=success`
5. **Laravel callback**:
   - Looks up payment by `paymentID`
   - On success → calls `executePayment` → verifies `transactionStatus === 'Completed'`
   - In a DB transaction: creates `subscription` (start=now, expiry=now+plan.duration_days)
     and updates the payment with `trxID`, `status=completed`, raw response
   - Duplicate `trxID` is detected and returns the existing subscription
   - Redirects browser to `{FRONTEND_URL}/payment/success?trxID=...&paymentID=...`
   - On failure/cancel → marks payment, redirects to `/payment/failed?reason=...`

## Error handling

| Scenario | Handled by |
|---|---|
| Token expired mid-flight | `BkashService::request()` retries once after `getToken(true)` |
| Payment fails on execute | Payment marked `failed`, user sent to `/payment/failed?reason=execute_failed` |
| User cancels on bKash page | Payment marked `cancelled`, user sent to `/payment/failed?reason=cancel` |
| Duplicate trxID (callback double-fire) | DB transaction; existing subscription is reused, no duplicate row |
| bKash returns non-2xx | `BkashException` thrown with status code + raw body, logged to `bkash` channel |

## Logging

A dedicated `bkash` log channel (configured in `config/logging.php` snippet) writes
to `storage/logs/bkash.log` with daily rotation. Every request, response, and
error is logged.

## Webhook signature verification

If bKash provisions webhook signing for your merchant account, set
`BKASH_WEBHOOK_SECRET` in `.env`. The webhook handler uses HMAC-SHA256 verification
of the `X-Bkash-Signature` header. Without the secret, the webhook still works but
without integrity checks (sandbox mode).
