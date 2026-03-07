# PULSE — AI Memory Log

This file is auto-updated by the git post-commit hook after every commit.
It serves as a persistent context log for AI-assisted development sessions.

---

## Project Overview

**PULSE** is a fitness creator monetization platform for the Slovak (SK) and Czech (CZ) markets.
Coaches publish exclusive content (posts, workouts, programs) behind a subscription paywall.
Fans subscribe to coaches, send tips, and pay for private messages — similar to OnlyFans but for fitness.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Laravel | 11 (v11.48.0) |
| Frontend | React + TypeScript | via Inertia.js |
| Auth | Laravel Breeze | v2.3.8 |
| Database | PostgreSQL | 16 |
| Cache | Redis (predis) | v3.4.1 |
| Queue | Redis | — |
| Payments | Stripe + Laravel Cashier | v16.3.0 |
| File storage | Local → S3 (planned) | — |
| Node.js | v18 | npm 9 |
| PHP | 8.3 | — |

---

## Completed Work

### Phase 1 — Project Bootstrap
- Laravel 11 installed in `/opt/pulse`
- Breeze scaffolded with React + TypeScript (`php artisan breeze:install react --typescript`)
- Assets built with Vite (`npm run build`)
- GitHub repo created: `github.com/Vandrak9/pulse`

### Phase 2 — Package Installation
- `inertiajs/inertia-laravel` — Inertia server-side adapter
- `laravel/cashier` — Stripe subscriptions and billing
- `predis/predis` — Redis PHP client
- `laravel/breeze` (dev) — auth scaffolding

### Phase 3 — Environment & Configuration
- `.env` configured: `APP_ENV=production`, `DB_CONNECTION=pgsql`, `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=database`
- `.env.example` created with empty sensitive values
- PostgreSQL database `pulse_db` created, user `pulse` configured
- `CLAUDE.md` created with full architecture documentation

### Phase 5 — Coach Profile Feature
- `CoachController` — index (paginated, 12/page), show (coach + posts), edit (auth), update (with avatar upload)
- `GET /coaches` → `Coaches/Index.tsx` — grid of verified coach cards (avatar, name, specialization, price)
- `GET /coaches/{coach}` → `Coaches/Show.tsx` — full profile: cover area, avatar, bio, price box, subscribe button, blurred exclusive posts for non-subscribers
- `GET|PUT /dashboard/profile` → `Coaches/Edit.tsx` — form to edit bio, specialization, monthly_price, avatar upload
- Palette applied via inline styles: terracotta `#c4714a`, green `#4a7c59`, cream `#faf6f0`, dark brown `#2d2118`
- Avatar stored via `Storage::disk('public')` in `avatars/` folder
- Posts marked `is_exclusive` are blurred with a lock overlay for non-subscribers

### Phase 4 — Database Schema & Models
- **coaches** — `user_id`, `bio`, `specialization`, `monthly_price`, `avatar_path`, `stripe_account_id`, `is_verified`
- **posts** — `coach_id`, `title`, `content`, `media_path`, `is_exclusive`
- **tips** — `fan_id` (users FK), `coach_id`, `amount`, `stripe_payment_id`
- **messages** — `sender_id`, `receiver_id`, `content`, `price_paid`, `stripe_payment_id`, `is_paid`
- **Cashier tables** — `customer columns` on users, `subscriptions`, `subscription_items`
- All models created with full Eloquent relationships
- `User` model uses `Billable` trait (Cashier)
- All migrations run successfully against `pulse_db`

---

## Key Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Session driver | Database | Stateless — supports horizontal scaling |
| Cache driver | Redis | Fast, supports tags and TTL |
| Queue driver | Redis | Reliable async jobs without extra infra |
| File storage | Local (S3 later) | Simple now, swap with `FILESYSTEM_DISK=s3` |
| Frontend | Inertia.js (no API) | Shared validation/auth, no API maintenance |
| DB engine | PostgreSQL | JSON support, full-text search, analytics |

---

## Business Rules

- **Revenue split:** 85% coach / 15% PULSE platform fee via Stripe `application_fee_amount`
- **Stripe Connect:** coaches must complete onboarding before publishing
- **Currencies:** EUR (SK) and CZK (CZ), stored as integers (cents/haléře)
- **Coach approval:** `is_verified` flag on coaches table, admin must verify before going live
- **Content access:** exclusive posts only visible to active subscribers

---

## Next Steps

- [ ] Stripe Connect onboarding flow for coaches
- [x] Coach profile pages (public + dashboard) — **done 2026-03-07**
- [ ] Subscription flow (subscribe to coach, manage plan)
- [ ] Post creation with media upload
- [ ] Paid private messaging between fans and coaches
- [ ] Tip payment flow via Stripe
- [ ] Admin panel (coach verification, platform stats)
- [ ] S3 migration for file storage
- [ ] Queue workers for Stripe webhooks

---

## Commit Log

<!-- Auto-appended by .git/hooks/post-commit -->
- [2026-03-07 18:00:00] initial: Initial commit: add Laravel .gitignore
- [2026-03-07 18:10:00] chore: initial Laravel setup with Inertia React
- [2026-03-07 18:30:00] feat: database schema and models
- [2026-03-07 18:36:41] a604154: chore: AI memory and git hooks setup
- [2026-03-07 18:36:46] d216dd6: chore: update AI_MEMORY.md with hook-appended entry
- [2026-03-07 18:39:27] 9bc52b2: chore: nginx and queue worker configuration
- [2026-03-07 18:42:29] c7fe3c6: fix: set pulse as nginx default_server on port 80
- [2026-03-07 18:47:30] c72b5b9: feat: add /scanner proxy to nginx config
- [2026-03-07 19:11:25] 35c1123: feat: coach profile pages
