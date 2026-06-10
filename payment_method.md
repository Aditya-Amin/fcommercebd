# Payment Method Setup Guide

Complete guide for switching FcommerceBD from mock/sandbox mode to real production credentials.

---

## Table of Contents

1. [Current Dev Setup (Mock Mode)](#1-current-dev-setup-mock-mode)
2. [bKash Merchant Account — Getting Credentials](#2-bkash-merchant-account--getting-credentials)
3. [Step-by-Step: Switch to Real bKash](#3-step-by-step-switch-to-real-bkash)
4. [Callback URL Setup (Critical)](#4-callback-url-setup-critical)
5. [Testing with bKash Sandbox (Before Going Live)](#5-testing-with-bkash-sandbox-before-going-live)
6. [Going Live (Production Checklist)](#6-going-live-production-checklist)
7. [Other Credentials Reference](#7-other-credentials-reference)
8. [Where Each Key Is Used in Code](#8-where-each-key-is-used-in-code)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Current Dev Setup (Mock Mode)

Right now the project runs in **simulate mode** — no real money moves, no real bKash API calls.

| File | Key | Current Value |
|---|---|---|
| `backend/.env` | `BKASH_SIMULATE` | `true` |
| `backend/.env` | `BKASH_BASE_URL` | `https://tokenized.sandbox.bka.sh/...` |
| `backend/.env` | `BKASH_APP_KEY` | Generic sandbox key |
| `backend/.env` | `BKASH_APP_SECRET` | Generic sandbox secret |
| `backend/.env` | `BKASH_USERNAME` | `sandboxTokenizedUser02` |
| `backend/.env` | `BKASH_PASSWORD` | `sandboxTokenizedUser02@12345` |

In this mode, clicking Buy redirects to `localhost:8000/bkash/simulate` which has **Simulate Success / Simulate Failure** buttons. No real API is called.

---

## 2. bKash Merchant Account — Getting Credentials

### What you need to apply for

Go to **[www.bkash.com/merchant](https://www.bkash.com/merchant)** and apply for a **Tokenized Payment Gateway (PGW)** merchant account.

bKash will give you **4 credentials** after approval:

| Credential | What it is | Example |
|---|---|---|
| `App Key` | Public identifier for your app | `4f6o0cjiki2rfm34kfdadl1eqq` |
| `App Secret` | Private secret (keep confidential) | `2sl2qfu...` |
| `Username` | Merchant username for token grant | `01XXXXXXXXX` |
| `Password` | Merchant password for token grant | `YourPassword@123` |

bKash will also give you a **Sandbox account** first for testing before going live.

### bKash API Docs
- Sandbox docs: https://developer.bka.sh/docs/tokenized-checkout-process
- Contact bKash merchant support: merchant@bkash.com

---

## 3. Step-by-Step: Switch to Real bKash

### Step 1 — Open `backend/.env`

This is the **only file** you need to edit for bKash credentials.

```env
# ─────────────────────────────────────────────────────────────────
# CHANGE THESE when you have a real bKash merchant account
# ─────────────────────────────────────────────────────────────────

# Turn OFF simulate mode — real bKash API will be called
BKASH_SIMULATE=false

# Switch to LIVE base URL (remove "sandbox" from the domain)
# Sandbox: https://tokenized.sandbox.bka.sh/v1.2.0-beta
# Live:    https://tokenized.pay.bka.sh/v1.2.0-beta
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta

# Your real credentials from bKash merchant portal
BKASH_APP_KEY=your_real_app_key_here
BKASH_APP_SECRET=your_real_app_secret_here
BKASH_USERNAME=your_merchant_username_here
BKASH_PASSWORD=your_merchant_password_here

# Optional: webhook HMAC secret (ask bKash to provision this for your account)
BKASH_WEBHOOK_SECRET=your_webhook_secret_if_provided

# Your live domain — bKash will redirect users back here after OTP
APP_URL=https://api.yourdomain.com
BKASH_CALLBACK_URL=https://api.yourdomain.com/api/bkash/callback

# Your Next.js frontend domain
FRONTEND_URL=https://yourdomain.com
```

### Step 2 — Clear Laravel config cache

After editing `.env`, always run:

```bash
cd backend
php artisan config:clear
php artisan cache:clear
```

This forces Laravel to re-read the new `.env` values. Without this, old cached values are used.

### Step 3 — Verify the config loaded

```bash
php artisan tinker
> config('bkash.simulate')      # must be false
> config('bkash.base_url')      # must show live URL
> config('bkash.credentials')   # must show your real keys
```

---

## 4. Callback URL Setup (Critical)

This is the most important step. bKash redirects the user back to your server after OTP — **this URL must be publicly reachable on the internet**.

### What the callback URL is

```
https://api.yourdomain.com/api/bkash/callback
```

This URL is handled by `BkashController::callback()` in:
```
backend/app/Http/Controllers/Api/BkashController.php
```

### For local development (before you have a domain)

Use **ngrok** to expose your local Laravel server:

```bash
# Install ngrok from https://ngrok.com
# Then run:
ngrok http 8000
```

ngrok gives you a public URL like `https://abc123.ngrok-free.app`. Set:

```env
APP_URL=https://abc123.ngrok-free.app
BKASH_CALLBACK_URL=https://abc123.ngrok-free.app/api/bkash/callback
```

Then clear config cache and restart Laravel:
```bash
php artisan config:clear
php artisan serve
```

**Important:** Every time you restart ngrok, the URL changes. Update `.env` and clear cache each time.

### For production (real domain)

You must give bKash your **callback URL** during merchant onboarding. They whitelist it on their side. The URL must:
- Use **HTTPS** (not HTTP)
- Be publicly accessible (not localhost)
- Match exactly what you set in `BKASH_CALLBACK_URL`

If the URL changes after onboarding, contact bKash merchant support to update it.

---

## 5. Testing with bKash Sandbox (Before Going Live)

bKash provides a sandbox environment where no real money moves. You can test with real bKash OTP flow using sandbox test numbers.

### Using sandbox credentials

```env
BKASH_SIMULATE=false                                          # use real API, not our mock
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta  # sandbox URL
BKASH_APP_KEY=<your_sandbox_app_key_from_bkash>
BKASH_APP_SECRET=<your_sandbox_app_secret_from_bkash>
BKASH_USERNAME=<your_sandbox_username>
BKASH_PASSWORD=<your_sandbox_password>
BKASH_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/bkash/callback
```

### Sandbox test wallet numbers (provided by bKash)

bKash gives you test phone numbers and OTPs to use during sandbox testing. These are shared when they approve your sandbox account.

---

## 6. Going Live (Production Checklist)

Before taking real payments, complete every item:

### Environment
- [ ] `BKASH_SIMULATE=false`
- [ ] `BKASH_BASE_URL` points to live URL (`tokenized.pay.bka.sh`, not `sandbox`)
- [ ] `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD` are real live credentials
- [ ] `APP_URL` is your real HTTPS domain (e.g. `https://api.fcommerce.bd`)
- [ ] `BKASH_CALLBACK_URL` is publicly reachable and uses HTTPS
- [ ] `FRONTEND_URL` is your real frontend domain (e.g. `https://fcommerce.bd`)
- [ ] `APP_ENV=production` and `APP_DEBUG=false`
- [ ] `BKASH_WEBHOOK_SECRET` set if bKash provisions it for your account

### Laravel
- [ ] Run `php artisan config:cache` (caches config for performance)
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan optimize`
- [ ] SSL certificate installed on your server
- [ ] Queue worker running (for Facebook post publishing): `php artisan queue:work`

### bKash portal
- [ ] Callback URL registered with bKash
- [ ] Live credentials received and tested
- [ ] Test a real payment of ৳1 to confirm end-to-end flow

---

## 7. Other Credentials Reference

### Facebook Integration (`backend/.env`)

```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

**Where to get:** Go to https://developers.facebook.com/apps → Create App → Settings → Basic.
The redirect URI `https://api.yourdomain.com/api/facebook/callback` must be added to your Facebook app's **Valid OAuth Redirect URIs**.

---

### Greenweb SMS (`backend/.env`)

```env
SMS_DRIVER=greenweb        # change from "log" to "greenweb" for real SMS
GREENWEB_SMS_TOKEN=your_greenweb_api_token
```

**Where to get:** Register at https://www.greenweb.com.bd and get an API token from your account dashboard.

---

### AI Caption Generation (`backend/.env`)

```env
AI_PROVIDER=anthropic      # or "openai"
AI_API_KEY=sk-ant-...      # your Anthropic or OpenAI key
AI_MODEL=claude-haiku-4-5  # or "gpt-4o-mini" for OpenAI
```

**Where to get:**
- Anthropic: https://console.anthropic.com → API Keys
- OpenAI: https://platform.openai.com → API Keys

---

### Mail (Subscription Reminders) (`backend/.env`)

```env
MAIL_MAILER=smtp           # change from "log" to "smtp"
MAIL_HOST=smtp.gmail.com   # or your mail provider
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=noreply@fcommerce.bd
```

For Gmail: use an **App Password** (not your real password). Enable 2FA first, then generate at https://myaccount.google.com/apppasswords.

---

### Next.js Frontend (`.env.local`)

```env
# Points to your Laravel backend — change when deploying
NEXT_PUBLIC_LARAVEL_API_URL=https://api.yourdomain.com
```

This is the only Next.js env variable that matters for the payment flow. Once this is set to your live Laravel URL, the frontend will call the real API.

---

## 8. Where Each Key Is Used in Code

| Key | File | What it does |
|---|---|---|
| `BKASH_SIMULATE` | `backend/config/bkash.php` → `BkashController.php` | When `true`, skips bKash API and shows mock page |
| `BKASH_BASE_URL` | `backend/app/Services/BkashService.php` | Base URL for all bKash API HTTP calls |
| `BKASH_APP_KEY` | `backend/app/Services/BkashService.php` | Sent in `app_key` header for token grant |
| `BKASH_APP_SECRET` | `backend/app/Services/BkashService.php` | Sent in `app_secret` header for token grant |
| `BKASH_USERNAME` | `backend/app/Services/BkashService.php` | Sent as `username` in token grant POST body |
| `BKASH_PASSWORD` | `backend/app/Services/BkashService.php` | Sent as `password` in token grant POST body |
| `BKASH_CALLBACK_URL` | `backend/config/bkash.php` → passed to bKash on `create-payment` | bKash redirects user back to this URL |
| `BKASH_WEBHOOK_SECRET` | `backend/app/Http/Controllers/Api/BkashController.php` | HMAC signature verification for webhook |
| `FRONTEND_URL` | `backend/config/bkash.php` | Where Laravel redirects after callback success/failure |
| `NEXT_PUBLIC_LARAVEL_API_URL` | `lib/api/bkash.ts` | Next.js fetches from this URL to start payment |

---

## 9. Troubleshooting

### "Could not initiate bKash payment"
- Check `BKASH_SIMULATE=false` and credentials are correct
- Run `php artisan config:clear` — old cached values may be used
- Check `storage/logs/laravel.log` for the real bKash API error

### "Callback URL not reachable"
- bKash cannot hit `localhost` — use ngrok for local testing
- Make sure `BKASH_CALLBACK_URL` uses HTTPS in production
- Test manually: `curl https://your-callback-url?paymentID=test&status=success`

### "419 Page Expired" on simulate page
- This is the CSRF error we already fixed — the buttons now use GET links, not POST forms
- If you still see it on a different page, run `php artisan key:generate` and restart

### "Token grant failed"
- Wrong username/password — double-check with bKash merchant support
- Sandbox vs live URL mismatch — sandbox creds don't work on live URL and vice versa

### Payment stuck in "initiated" status
- The callback URL was not hit (network issue or wrong URL)
- Check `storage/logs/laravel.log` for `callback_received` log entry
- Manually retry: `POST /api/bkash/execute-payment` with `{ "paymentID": "..." }`

### Subscription not activated after payment
- Payment is `completed` but subscription is `failed` → check `storage/logs/laravel.log` for DB error
- Run `php artisan tinker` → `App\Models\Payment::where('status','completed')->get()` to inspect
