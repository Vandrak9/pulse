# PULSE — AI Memory Log

This file is auto-updated by the git post-commit hook after every commit.
It serves as a persistent context log for AI-assisted development sessions.

---

## Project Overview

**PULSE** is a fitness creator monetization platform for the Slovak (SK) and Czech (CZ) markets.
Coaches publish exclusive content (posts, workouts, programs) behind a subscription paywall.
Fans subscribe to coaches, send tips, and pay for private messages — similar to OnlyFans but for fitness.

---

## Session 1 — 2026-03-07 (~4 hours)

### What was built

- Laravel 11 + Inertia.js + React + TypeScript on Ubuntu VPS (`/opt/pulse`)
- PostgreSQL (`pulse_db`) + Redis + Queue worker (systemd `pulse-queue.service`)
- Nginx configured as default server on port 80, `/scanner` proxy to `localhost:5000`
- Complete DB schema: `users`, `coaches`, `posts`, `tips`, `messages`, `subscriptions`, `post_likes`, `sessions`, `cache`, `jobs`
- **Home page** (`Home.tsx`): hero, stats, featured coaches (compact inline cards), how it works, categories, CTA
- **Coaches index** (`Coaches/Index.tsx`): 2-col/3-col grid, sticky category filter bar, content type badges
- **Coach detail** (`Coaches/Show.tsx`): gradient hero cover, overlapping avatar, subscription box + benefits, paywall blur, 4 content tabs (Všetko / Reels / Videá / Fotky)
- **OnlyFans-style feed** (`Feed.tsx`): stories row, 3 tabs (Pre teba / Reels / Videá), post cards, like system (optimistic UI)
- **TikTok-style Reels tab**: scroll-snap vertical player, auto-play on scroll, coach info overlay, like/comment/share sidebar
- **YouTube-style Videos tab**: horizontal cards, 16:9 thumbnail, duration badge
- **VideoModal** (`Components/VideoModal.tsx`): fullscreen HTML5 player, autoplay, Escape/click-outside close
- **Auth pages**: Login (custom PULSE styling, SK labels), Register (fan/coach role selector, role-based redirect)
- **PulseLayout** (`Layouts/PulseLayout.tsx`): sticky nav, search bar, auth-aware, bottom mobile tab bar
- **Real Pexels content**: `PexelsService` fetches videos (with min/max duration) + images via API, thumbnails downloaded locally
- **Reels vs long videos**: `video_type` enum (reel/video), `video_duration` integer seconds, ContentSeeder assigns correctly
- **11 coaches seeded**: Silový, Výživa, CrossFit, Joga, Beh, Wellness, Pilates, Funkčný tréning, Box, Strečing, Cyklistika
- **33 reels total** (3 per coach), all free for registered users; long videos/images follow paywall rules

### Tech stack

| Layer | Technology | Version |
|---|---|---|
| Backend | Laravel | 11 (v11.48.0) |
| Frontend | React + TypeScript | via Inertia.js ^2.0 |
| Auth | Laravel Breeze | v2.3.8 |
| Database | PostgreSQL | 16 |
| Cache/Queue | Redis (predis) | v3.4.1 |
| Payments | Stripe + Laravel Cashier | v16.3.0 |
| File storage | Local → S3 (planned) | — |
| Node.js | v18 | npm 9, Vite 6, Tailwind 3 |
| PHP | 8.3 FPM | — |

### Design system

| Token | Value | Usage |
|---|---|---|
| Primary | `#c4714a` | Terracotta — CTA buttons, badges, prices, active states |
| Primary hover | `#5a3e2b` | Dark terracotta |
| Secondary | `#4a7c59` | Green — verified badge, success states |
| Background | `#faf6f0` | Cream — page backgrounds |
| Text | `#2d2118` | Dark brown — headings, primary text |
| Muted | `#9a8a7a` | Subtitles, dates, secondary text |
| Border | `#e8d9c4` | Card borders |
| Badge bg | `#fce8de` | Light terracotta — specialization badges |

> **Rule:** brand colors are always **inline styles**, never Tailwind utility classes.

### Key files

```
routes/web.php                              ← all routes
app/Http/Controllers/
  CoachController.php                       ← index / show / edit / update
  FeedController.php                        ← index (posts+reels+videos) / like
  HomeController.php                        ← landing page featured coaches
app/Models/
  User.php (Billable), Coach.php, Post.php, PostLike.php, Tip.php, Message.php
app/Services/PexelsService.php              ← searchVideos() + searchImages()
database/seeders/
  DatabaseSeeder.php                        ← calls CoachSeeder → ContentSeeder
  CoachSeeder.php                           ← 11 coaches + fan + dominik@haluza.sk
  ContentSeeder.php                         ← assigns Pexels media, reels always free
resources/js/
  Layouts/PulseLayout.tsx                   ← sticky nav, bottom tab bar, auth-aware
  Pages/
    Home.tsx                                ← landing page
    Feed.tsx                                ← 3-tab feed (Pre teba / Reels / Videá)
    Coaches/Index.tsx                       ← coach grid + category filter
    Coaches/Show.tsx                        ← coach profile + 4 content tabs
    Coaches/Edit.tsx                        ← coach edits own profile
    Auth/Login.tsx, Auth/Register.tsx       ← custom PULSE styling
  Components/VideoModal.tsx                 ← fullscreen video player
```

### DB schema (current)

```
users:         id, name, email, role(fan|coach), password, email_verified_at, + Cashier columns
coaches:       id, user_id, bio, specialization, monthly_price, avatar_path,
               stripe_account_id, is_verified, rating, subscriber_count
posts:         id, coach_id, title, content, media_path, thumbnail_path,
               media_type(none|image|video), video_type(reel|video|null),
               video_duration(int seconds), is_exclusive
post_likes:    id, user_id, post_id  [unique: user_id+post_id]
tips:          id, fan_id, coach_id, amount, stripe_payment_id
messages:      id, sender_id, receiver_id, content, price_paid, stripe_payment_id, is_paid
subscriptions, subscription_items  ← Cashier
sessions, cache, jobs              ← Laravel standard
```

### Routes

```
GET  /                    → HomeController@index        (public)
GET  /coaches             → CoachController@index       (public)
GET  /coaches/{coach}     → CoachController@show        (public)
GET  /dashboard/profile   → CoachController@edit        (auth)
PUT  /dashboard/profile   → CoachController@update      (auth)
GET  /feed                → FeedController@index        (auth)
POST /feed/like/{post}    → FeedController@like         (auth)
POST /register            → role=coach → /dashboard/profile
                          → role=fan   → /coaches
```

### Seed accounts

| Email | Password | Role |
|---|---|---|
| tomas.kovac@pulse.sk | password | coach |
| lucia.horakova@pulse.sk | password | coach |
| marek.blaho@pulse.sk | password | coach |
| zuzana.prochazka@pulse.sk | password | coach |
| peter.horvath@pulse.sk | password | coach |
| katarina.molnar@pulse.sk | password | coach |
| jana.novotna@pulse.sk | password | coach |
| martin.simko@pulse.sk | password | coach |
| radoslav.oravec@pulse.sk | password | coach |
| eva.kovacova@pulse.sk | password | coach |
| michal.dubovsky@pulse.sk | password | coach |
| fan@pulse.sk | password | fan |
| dominik@haluza.sk | password | coach |

### Remaining for MVP

- [ ] Stripe Connect onboarding flow for coaches
- [ ] Subscription checkout (fan subscribes to coach)
- [ ] `isSubscribed` currently hardcoded `false` — needs real check
- [ ] Tip jar (one-time Stripe Payment Intent)
- [ ] Direct messages UI (fan ↔ coach, paid messages)
- [ ] Coach content upload form (real file upload to storage)
- [ ] Notifications system
- [ ] Fan profile page (my subscriptions, saved posts)
- [ ] Coach dashboard (earnings, subscriber stats)
- [ ] Admin panel (coach verification)
- [ ] Search functionality
- [ ] HTTPS / SSL certificate
- [ ] S3 migration (`FILESYSTEM_DISK=s3`)

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
- **Coach approval:** `is_verified` flag on coaches table
- **Content access:** exclusive posts only visible to active subscribers
- **Reels:** always free for registered users (`is_exclusive = false`)

---

## Deployment

- **Server:** Ubuntu VPS, nginx + PHP 8.3 FPM
- **Root:** `/opt/pulse/public`
- **Queue:** systemd `pulse-queue.service`, redis driver, tries=3
- **Storage symlink:** `public/storage → storage/app/public`
- **Re-seed:** `php artisan migrate:fresh --seed --force`
- **Build:** `npm run build`

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
- [2026-03-07 19:11:45] d266cae: chore: update AI_MEMORY.md with coach profile feature
- [2026-03-07 19:14:51] e5b6696: feat: add CoachSeeder with Slovak fitness coaches and fan user
- [2026-03-07 19:16:52] 2d6bfe8: feat: download real avatar photos in CoachSeeder
- [2026-03-07 19:22:03] e56d2af: feat: redesign coaches index page
- [2026-03-07 19:22:23] 93ba403: chore: update AI_MEMORY with coaches index redesign
- [2026-03-07 19:31:12] 5d4ec29: feat: polish coaches index UI + fix category filter and coach visibility
- [2026-03-07 19:34:28] 5293459: fix: realistic prices and category scroll hint
- [2026-03-07 19:37:45] 0f725cf: feat: add coaches for Joga, Beh and Wellness categories
- [2026-03-07 19:40:39] c7b6e37: feat: coach detail page redesign
- [2026-03-07 19:40:57] 5b6a4d0: chore: update AI_MEMORY with Show.tsx redesign
- [2026-03-07 19:49:26] 58af863: feat: pulse layout with nav, date formatting, and video/media content support
- [2026-03-07 19:51:54] 03fe728: chore: add CHANGELOG.md with semantic versioning
- [2026-03-07 20:01:42] 4f85cb9: feat: app layout, navigation and home page
- [2026-03-07 20:04:22] 9da0bc5: chore: add v0.3.0 changelog entry for app layout and home page
- [2026-03-07 20:10:05] 41fb550: feat: auth pages and user roles
- [2026-03-07 20:10:21] a4cde0f: chore: add v0.4.0 changelog entry
- [2026-03-07 20:23:16] c62559c: feat: OnlyFans-style content feed with stories and likes
- [2026-03-07 20:23:54] dc70918: chore: add v0.5.0 changelog entry and update AI memory
- [2026-03-07 20:34:27] eb63789: feat: real Pexels stock content with video player
- [2026-03-07 20:34:54] 9b19479: chore: add v0.6.0 changelog entry and update AI memory
- [2026-03-07 20:56:02] 0bf31bc: feat: reels vs long videos, profile tabs, TikTok-style reel player
- [2026-03-07 20:56:39] 360c0ee: chore: update CHANGELOG and memory for v0.7.0
- [2026-03-07 21:12:20] 4be45f4: feat: 11 coaches, 3 reels per coach, reels always free for registered users
- [2026-03-07 21:15:48] f31d41e: fix: reels/videos tabs always show content + persist dominik@haluza.sk
