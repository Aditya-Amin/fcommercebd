# FcommerceBD — SaaS Frontend

All-in-one SaaS dashboard for Facebook-based e-commerce sellers in Bangladesh.
Built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

> This is a UI-only prototype — all data is mocked, all auth is simulated, and
> AI generation uses placeholder images. Perfect for demos, design reviews,
> and stakeholder walk-throughs.

---

## ✨ Features

- **Marketing site** — Landing, Pricing, FAQ, CTAs
- **Auth flow** — Login / Register with persisted session via `localStorage`
- **Dashboard** — Home, Products, Orders, AI Generate, SMS Campaigns, Settings
- **Plan gating** — Starter blocks AI features, Growth unlocks them
- **Live demo controls** — flip between Starter ↔ Growth instantly in Settings
- **Usage tracking** — AI generations + SMS counters with progress bars
- **Responsive** — mobile drawer + desktop collapsible sidebar
- **Toast notifications** for every async action
- **Loading & empty states** throughout

---

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open
http://localhost:3000
```

### Demo login
Any email + password works on the login page. The session is persisted in
`localStorage` so refreshing keeps you logged in.

### Switching plans for demo
Go to **Settings → Subscription plan** and click either card to instantly
switch between Starter and Growth. AI gating, SMS limits, and upgrade prompts
all react in real time.

---

## 📁 Project structure

```
app/
├── (marketing)/          # Public site (landing, pricing) — uses MarketingNav + Footer
├── (auth)/               # Login & Register — split-screen layout
└── (dashboard)/          # Authenticated app — Sidebar + Topbar layout
    ├── dashboard/        # Home (stats, usage, quick actions, activity)
    ├── products/         # Catalog grid + add-product modal
    ├── orders/           # Filterable orders table + status flow
    ├── ai-generate/      # AI form + generated post preview
    ├── campaigns/        # SMS composer + audience picker
    └── settings/         # Profile, plan switcher, usage, sign out

components/
├── ui/                   # Button, Card, Input, Modal, ProgressBar, Badge, Logo
├── layout/               # Sidebar, Topbar, MarketingNav, Footer
├── marketing/            # Hero, FeatureGrid, HowItWorks, PricingCards, CTA
└── dashboard/            # StatCard, UpgradePrompt

context/
├── AuthContext.tsx       # localStorage-backed user session
├── PlanContext.tsx       # plan state + usage counters + gating helpers
└── ToastContext.tsx      # toast system (portal at root)

lib/
├── types.ts              # Shared types (Plan, Order, Product, User, …)
├── plans.ts              # Starter & Growth plan definitions
├── mock-data.ts          # Products, orders, activity, AI samples
└── utils.ts              # cn(), formatBDT(), delay(), timeAgo()
```

---

## 🎨 Design system

| Token | Value |
|---|---|
| Primary | `#3362FF` (with 50–900 shades) |
| Background | `#F7F9FC` |
| Surface | `#FFFFFF` |
| Ink | `#0F172A` (default), `#475569` (muted), `#94A3B8` (subtle) |
| Border | `#E2E8F0` |
| Success / Warning / Danger | `#16A34A` / `#F59E0B` / `#DC2626` |
| Font | Inter (via `next/font/google`) |
| Card radius | `0.875rem` (`rounded-xl`) |
| Card shadow | soft 2-layer shadow (`shadow-card`) |
| Button / Input height | `h-10` (40px) |

All tokens live in `tailwind.config.ts`.

---

## 🧠 How plan gating works

`context/PlanContext.tsx` exposes:

- `plan` — current plan object with limits
- `usage` — `{ aiUsed, smsUsed }`, persisted in localStorage
- `canUseAI()` — `false` for Starter, or when limit reached
- `canSendSMS(count)` — checks remaining quota
- `recordAIUse()` / `recordSMSUse(n)` — increments counters
- `setPlan(id)` — switches plan (used by Settings demo toggle)

Pages consume this via `usePlan()`. The AI Generate page disables its form on
Starter; the Campaigns page blocks send when totalSMS > remaining.

---

## 📦 Production build

```bash
npm run build
npm start
```

---

## 🚧 What's mocked

- All data lives in `lib/mock-data.ts`
- Auth is simulated (`localStorage` only — no API call)
- AI image generation uses `picsum.photos` placeholders + canned captions
- SMS sending is a `setTimeout`
- Order status transitions happen client-side

When you're ready to wire up a real backend, replace these in
`lib/mock-data.ts` and the relevant context providers.
# fcommercebd
# fcommercebd
