# FcommerceBD — Local Development Setup Guide

Complete guide to run the full stack (Next.js frontend + Laravel backend) on your local PC and wire ngrok for Facebook Graph API OAuth.

---

## Prerequisites

Install these once on your PC if you don't have them already:

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ (LTS) | https://nodejs.org |
| PHP | 8.2+ | https://windows.php.net/download (use the VS16 x64 Non Thread Safe zip, add to PATH) |
| Composer | latest | https://getcomposer.org/Composer-Setup.exe |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/mysql/ (or XAMPP/Laragon) |
| ngrok | latest | https://ngrok.com/download (free account required) |

**Quick check — open PowerShell and run:**
```powershell
node -v        # should print v18.x.x or higher
php -v         # should print PHP 8.2.x or higher
composer -V    # should print Composer version x.x.x
mysql --version
ngrok version
```

---

## 1. Open the Project

The project is already on your desktop:
```
C:\Users\Adi\Desktop\Fcommerce Landing Sass\
├── app/              ← Next.js App Router pages
├── components/       ← React components
├── lib/              ← API clients, types, plans
├── backend/          ← Laravel 10 API
├── package.json      ← Frontend dependencies
└── .env.example      ← Frontend env template
```

---

## 2. Frontend Setup (Next.js)

Open PowerShell and go to the project root:
```powershell
cd "C:\Users\Adi\Desktop\Fcommerce Landing Sass"
```

### 2a. Install dependencies
```powershell
npm install
```

### 2b. Create the frontend .env file

**Mode A — Mock mode (no backend needed, all data in localStorage):**
```powershell
# Create .env.local with NO NEXT_PUBLIC_LARAVEL_API_URL
# This makes the app run fully in browser with mocked data
New-Item .env.local -ItemType File -Force
# Leave the file empty, or add:
# (nothing needed — mock mode is the default when the var is unset)
```

**Mode B — Real backend mode (requires Laravel running):**
```powershell
@"
NEXT_PUBLIC_LARAVEL_API_URL=http://localhost:8000
"@ | Out-File .env.local -Encoding utf8
```

### 2c. Start the dev server
```powershell
npm run dev
```

Next.js will start on **http://localhost:3000**

---

## 3. Backend Setup (Laravel)

Open a second PowerShell window:
```powershell
cd "C:\Users\Adi\Desktop\Fcommerce Landing Sass\backend"
```

### 3a. Install PHP dependencies
```powershell
composer install
```

### 3b. Create the database

Open MySQL and run:
```sql
CREATE DATABASE fcommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

If you use XAMPP: open phpMyAdmin → New → name it `fcommerce` → Create.

### 3c. Configure the .env file

The `backend/.env` file already exists with your settings. Verify these values match your MySQL setup:
```
DB_DATABASE=fcommerce
DB_USERNAME=root
DB_PASSWORD=           ← add your MySQL root password here if you have one
```

If starting fresh from `.env.example`:
```powershell
Copy-Item .env.example .env
php artisan key:generate
```

### 3d. Run migrations and seed data
```powershell
php artisan migrate --seed
```

This creates all tables and seeds the **Starter** and **Growth** subscription plans + product categories.

### 3e. Create the storage symlink (for product image URLs)
```powershell
php artisan storage:link
```

### 3f. Start the Laravel server
```powershell
php artisan serve --port=8000
```

Laravel API will run on **http://localhost:8000**

### 3g. Start the queue worker (required for Facebook publishing)

Open a third PowerShell window:
```powershell
cd "C:\Users\Adi\Desktop\Fcommerce Landing Sass\backend"
php artisan queue:work --tries=5
```

> Without this, Facebook posts stay in `queued` status forever. Keep this running whenever you test posting.

---

## 4. ngrok Setup for Facebook Graph API

Facebook OAuth **cannot** redirect to `http://localhost`. You must expose your Laravel backend through a public HTTPS tunnel using ngrok.

### 4a. Install and authenticate ngrok

1. Download ngrok from https://ngrok.com/download
2. Sign up for a free account at https://ngrok.com
3. Copy your auth token from the ngrok dashboard
4. Run once to save it:
```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### 4b. Start the ngrok tunnel

Open a fourth PowerShell window (keep it running):
```powershell
ngrok http 8000
```

You will see output like:
```
Forwarding   https://e344-37-111-229-133.ngrok-free.app -> http://localhost:8000
```

**Copy that `https://xxxx.ngrok-free.app` URL** — you need it in the next steps.

> The URL changes every time you restart ngrok on a free plan. When it changes, repeat steps 4c and 4d below.

### 4c. Update backend/.env with the ngrok URL

Open `backend/.env` and update `APP_URL` and `FACEBOOK_REDIRECT_URI`:
```
APP_URL=https://xxxx.ngrok-free.app
FACEBOOK_REDIRECT_URI=https://xxxx.ngrok-free.app/api/facebook/callback
```

Your current file already has these set to `https://e344-37-111-229-133.ngrok-free.app`. Just replace that URL with your new one each session.

After changing .env, **restart the Laravel server** (Ctrl+C in the `php artisan serve` window, then run it again) and **restart the queue worker** too.

### 4d. Update the Facebook App Dashboard

1. Go to https://developers.facebook.com/apps
2. Select your app (App ID: `1517176323123209`)
3. In the left menu → **Facebook Login** → **Settings**
4. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://xxxx.ngrok-free.app/api/facebook/callback
   ```
5. Click **Save Changes**

> You can have multiple redirect URIs saved. Add each ngrok URL you use without deleting old ones (or clean them up periodically).

---

## 5. Facebook App Configuration

Your Facebook App credentials are already in `backend/.env`:
```
FACEBOOK_APP_ID=1517176323123209
FACEBOOK_APP_SECRET=3bb8d571...
```

### Add yourself as a test user (Development mode)

While the app is in **Development mode**, only admin/developer/tester roles can connect. Make sure your Facebook account is added:

1. Go to your App Dashboard → **Roles** → **Roles**
2. Add your own Facebook account as **Administrator** or **Developer**
3. You can now connect your own Facebook Pages through the `/integrations` page

> Real users will see "This app is in development" until you complete Facebook App Review.

---

## 6. Running Everything — Quick Reference

Open **4 PowerShell windows** and run one command in each:

| Window | Command | What it does |
|---|---|---|
| 1 — Frontend | `cd "C:\Users\Adi\Desktop\Fcommerce Landing Sass"` → `npm run dev` | Next.js on :3000 |
| 2 — Backend | `cd "...\backend"` → `php artisan serve --port=8000` | Laravel API on :8000 |
| 3 — Queue | `cd "...\backend"` → `php artisan queue:work --tries=5` | Processes FB posts |
| 4 — ngrok | `ngrok http 8000` | Public HTTPS tunnel for FB OAuth |

Then open **http://localhost:3000** in your browser.

---

## 7. Verifying Everything Works

### Test mock mode (no backend)
1. Open http://localhost:3000 with `NEXT_PUBLIC_LARAVEL_API_URL` unset in `.env.local`
2. Login with any email/password (mock auth)
3. Go to **Integrations** → Connect Facebook Page (seeds a mock page in localStorage)
4. Go to **AI Generate** → pick a product → generate → post (simulates publishing)

### Test real backend mode
1. Set `NEXT_PUBLIC_LARAVEL_API_URL=http://localhost:8000` in `.env.local`
2. Restart `npm run dev`
3. Register a new account at http://localhost:3000/register
4. Go to **Integrations** → click **Connect Facebook Page**
5. You'll be redirected to Facebook → approve permissions → redirected back

### Test Facebook posting with ngrok
1. ngrok must be running and `APP_URL` + `FACEBOOK_REDIRECT_URI` in `.env` must match the current ngrok URL
2. Laravel server and queue worker must be running
3. Connect a Facebook Page via **Integrations**
4. Go to **AI Generate** → pick product → generate caption → **Post to Facebook now**
5. Check the queue worker terminal — you'll see it pick up the job
6. Check `backend/storage/logs/facebook.log` for detailed publish logs

---

## 8. Common Issues

### "Facebook redirect URI mismatch"
- Your ngrok URL changed (free plan regenerates on restart)
- Fix: get new ngrok URL → update `backend/.env` → update Facebook App Dashboard → restart Laravel

### Posts stuck in `queued` status forever
- Queue worker is not running
- Fix: run `php artisan queue:work --tries=5` in a separate terminal

### Image posts fail but text posts work
- Image URLs contain `localhost:8000` which Facebook can't download
- Fix: make sure `APP_URL` in `.env` is set to the ngrok HTTPS URL (not localhost), re-upload images so they get public URLs

### "Class not found" error in queue worker
- Composer autoloader cache is stale
- Fix:
```powershell
composer dump-autoload -o
php artisan optimize:clear
# then restart the queue worker
```

### MySQL connection refused
- MySQL service isn't running
- Fix: start MySQL service (XAMPP: start Apache + MySQL panel; standalone: `net start MySQL80`)

### `php artisan key:generate` — "No application encryption key has been specified"
- `.env` file doesn't exist or `APP_KEY` is empty
- Fix:
```powershell
Copy-Item .env.example .env
php artisan key:generate
```

---

## 9. Environment Variables Summary

### Frontend (`C:\Users\Adi\Desktop\Fcommerce Landing Sass\.env.local`)
```env
# Comment out for mock mode, uncomment for real backend
NEXT_PUBLIC_LARAVEL_API_URL=http://localhost:8000
```

### Backend (`C:\Users\Adi\Desktop\Fcommerce Landing Sass\backend\.env`)
```env
APP_URL=https://xxxx.ngrok-free.app        ← update each ngrok session
FRONTEND_URL=http://localhost:3000

DB_DATABASE=fcommerce
DB_USERNAME=root
DB_PASSWORD=                               ← your MySQL password

FACEBOOK_APP_ID=1517176323123209
FACEBOOK_APP_SECRET=3bb8d571199d743dfc026c8cf23f92de
FACEBOOK_REDIRECT_URI=https://xxxx.ngrok-free.app/api/facebook/callback   ← update each session

QUEUE_CONNECTION=database
AI_PROVIDER=stub                           ← change to "anthropic" or "openai" for real AI captions
```

---

## 10. Starting a New ngrok Session (Daily Workflow)

Every time you restart your PC or ngrok, do these steps:

1. Run `ngrok http 8000` → copy the new `https://xxxx.ngrok-free.app` URL
2. Open `backend/.env` → replace the old ngrok URL in `APP_URL` and `FACEBOOK_REDIRECT_URI`
3. Go to Facebook App Dashboard → **Facebook Login** → **Settings** → add the new redirect URI
4. Restart `php artisan serve` and `php artisan queue:work`
5. You're ready

> **Tip:** Get a paid ngrok plan (Starter ~$8/mo) to use a static domain like `https://fcommerce.ngrok.app` — then you set it once and never touch it again.
