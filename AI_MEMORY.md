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
messages:      id, sender_id, receiver_id, content, price_paid, stripe_payment_id, is_paid,
               is_read(bool), read_at(timestamp), message_type(text|image|video|voice),
               media_path, media_thumbnail, media_duration(int), media_size, media_mime_type,
               is_broadcast(bool)
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
- [x] Direct messages UI (fan ↔ coach, paid messages) ← DONE Session 2
- [x] Read receipts + unread badges + browser push notifications ← DONE Session 3
- [ ] Coach content upload form (real file upload to storage)
- [ ] Notifications system (in-app / email)
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
- **Domain:** https://pulsehub.fun (+ www redirect)
- **SSL:** Let's Encrypt via Certbot, auto-renews, expires 2026-06-06
- **Root:** `/opt/pulse/public`
- **Queue:** systemd `pulse-queue.service`, redis driver, tries=3
- **Storage symlink:** `public/storage → storage/app/public`
- **Storage dirs:** `storage/app/public/messages/{images,videos,voice}` (775)
- **Re-seed:** `php artisan migrate:fresh --seed --force`
- **Build:** `npm run build`
- **APP_URL:** `https://pulsehub.fun`
- **SESSION_SECURE_COOKIE:** true (set in .env)

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
- [2026-03-07 21:22:40] 92dd247: checkpoint: end of session 1 — full UI MVP ready

---

## Session 2 — 2026-03-08

### What was built

- **DM Chat System** (Phase 1): full fan ↔ coach messaging
- **Multimedia messages** (Phase 2): image/video/voice message support in schema + controller
- **Broadcast messaging** (Phase 3): coach sends one message to all subscribers at once

### New DB schema additions

```
messages (new columns):
  is_read: boolean default false
  read_at: timestamp nullable
  message_type: string default 'text'  (text|image|video|voice|file)
  media_path: string nullable
  media_thumbnail: string nullable
  media_duration: integer nullable (seconds)
  media_size: integer nullable (bytes)
  is_broadcast: boolean default false

broadcasts: id, coach_id (FK→users), content, message_type, media_path,
            media_thumbnail, media_duration, sent_at, timestamps
broadcast_recipients: id, broadcast_id (FK), user_id (FK), is_read, read_at, created_at
  ($timestamps = false on BroadcastRecipient)
```

### New files

```
app/Http/Controllers/
  MessageController.php       ← index/show/store/unreadCount
  MediaStreamController.php   ← stream($messageId) with auth check
  BroadcastController.php     ← index/store for coach broadcast page
app/Jobs/SendBroadcastJob.php ← queued, inserts messages in chunks of 50
app/Models/
  Broadcast.php               ← belongsTo User (coach_id), hasMany BroadcastRecipient
  BroadcastRecipient.php      ← $timestamps = false
database/seeders/MessageSeeder.php ← 19 messages across 3 conversations + 2 broadcasts
resources/js/Pages/
  Messages/Index.tsx          ← conversation list (iMessage-style)
  Messages/Show.tsx           ← chat UI, 5s polling, date separators, read receipts ✓✓
  Dashboard/Broadcast.tsx     ← composer, preview, confirm modal, history list
```

### Routes added (all require auth)

```
GET  /messages                        → MessageController@index
GET  /messages/{userId}               → MessageController@show (marks as read)
POST /messages/{userId}               → MessageController@store
GET  /api/messages/unread-count       → JSON {count: N}
GET  /media/message/{message}         → MediaStreamController@stream
GET  /dashboard/broadcast             → BroadcastController@index (coach only)
POST /dashboard/broadcast             → BroadcastController@store (coach only)
```

### PulseLayout.tsx changes
- Added `unreadCount` state fetched from `/api/messages/unread-count` on mount + every 30s
- Unread badge on 💬 Správy tab in bottom nav
- Badge: terracotta circle with count

### Current version: v0.8.0

### Remaining for MVP

- [ ] Stripe Connect onboarding flow for coaches
- [ ] Subscription checkout (fan subscribes to coach) — `isSubscribed` hardcoded `false`
- [ ] Tip jar (one-time Stripe Payment Intent)
- [ ] Coach content upload form (real file upload to storage)
- [ ] Voice note recording UI (MediaRecorder API) in Show.tsx
- [ ] Image/video picker with client-side compression in Show.tsx
- [ ] Real Stripe subscriber lookup in BroadcastController (currently uses subscriber_count field)
- [ ] Notifications system
- [ ] Fan profile page (my subscriptions, saved posts)
- [x] Coach dashboard (earnings, subscriber stats) ← DONE Session 3
- [ ] Admin panel (coach verification)
- [ ] Search functionality
- [ ] HTTPS / SSL certificate ← DONE (pulsehub.fun Let's Encrypt)
- [ ] S3 migration (`FILESYSTEM_DISK=s3`)
- [2026-03-08 07:12:59] e43e958: feat: DM chat system with conversation list, messaging UI, multimedia and broadcast
- [2026-03-08 07:23:46] 0f0dfab: fix: multimedia upload bugs and HTTP compatibility
- [2026-03-08 07:27:27] 56b4f44: chore: domain pulsehub.fun with SSL certificate
- [2026-03-08 07:32:43] fe2edb4: fix: complete multimedia upload rewrite — images, video, voice
- [2026-03-08 07:38:18] 5e3deb6: fix: unified media upload, CSRF fix, voice playback fix
- [2026-03-08 07:46:15] fd8109c: fix: media URL in response and empty bubble rendering
- [2026-03-08 07:52:53] da63702: fix: voice bubble UI and image lightbox
- [2026-03-08 08:13:44] 26779c8: fix: file size check and voice bubble final fix
- [2026-03-08 08:19:44] 7d28bd0: fix: iPhone HEIC camera photo compression before upload
- [2026-03-08 08:24:39] 8ffbe02: feat: read receipts, unread badges and browser notifications
- [2026-03-08 08:25:30] fa2918d: chore: update AI_MEMORY with messaging features and schema
- [2026-03-08 08:34:06] 3749e86: chore: full project audit report
- [2026-03-08 08:42:29] 12f4b9e: fix: all critical and important audit issues resolved
- [2026-03-08 08:43:18] 9a1c55c: chore: update AI_MEMORY with audit fixes and new shared utilities
- [2026-03-08 08:55:45] 1045866: feat: coach dashboard with earnings, subscribers and analytics

---

## Session 3 — 2026-03-08 (cont.)

### What was built

- **Audit fixes**: Rate limiting (throttle:messages/uploads/likes/broadcasts), client message_type security, N+1 fix in MessageController, BroadcastController role check, removed debug logs, extracted Avatar.tsx + utils.ts, added .env.example entries, DB performance indexes
- **Shared utilities** `resources/js/lib/utils.ts`: getInitials, formatDuration, formatChatDate, formatFullDate, relativeTime, formatTime, isSameDay
- **Avatar component** `resources/js/Components/Avatar.tsx`: img or terracotta initials fallback, size prop
- **Coach Dashboard** (3 pages):
  - `Dashboard/Index.tsx`: stats grid, 6-month revenue bar chart (recharts), quick actions, recent activity, top post
  - `Dashboard/Earnings.tsx`: summary cards, bar chart, monthly table (gross/fee/net/status), paginated transaction history
  - `Dashboard/Subscribers.tsx`: anonymized list, filter tabs, churn rate banner, avg duration card
- **DashboardController** (`app/Http/Controllers/DashboardController.php`): index/earnings/subscribers + requireCoach() helper
- **PulseLayout** dropdown: avatar button with click-outside close, Dashboard (coach only) / Profil / Odhlásiť sa links
- **posts.views** column added (migration + Post::$fillable)
- **recharts** npm package added

### Routes added

```
GET /dashboard           → DashboardController@index    (auth+verified)
GET /dashboard/earnings  → DashboardController@earnings (auth)
GET /dashboard/subscribers → DashboardController@subscribers (auth)
```

### DashboardController notes

- `requireCoach()`: aborts 403 if `auth()->user()->role !== 'coach'`
- Revenue = `subscriber_count × monthly_price × 0.85` (no real Stripe yet)
- `buildRevenueChart()`: last 6 months using Carbon, current month highlighted
- `buildRecentActivity()`: real PostLike + Message data, icons by type
- `buildTransactions()`: simulated 20 tx (real Stripe later)
- Subscribers anonymized as `Fan#XXXX` format

- [2026-03-08 08:56:16] dc37b20: chore: update AI_MEMORY with session 3 dashboard work

---

## Session 4 — 2026-03-08 (cont.)

### What was built

**Full desktop layout — v0.9.0**

- **PulseLayout.tsx** — full rewrite with three-zone layout:
  - Left sidebar (fixed, 256px, `md+`): PULSE logo, nav links with active state + unread badge, user info + logout at bottom, guest login/register CTA
  - Right sidebar (fixed, 288px, `lg+`): search input, "Odporúčaní kouči" (4 coaches fetched from `/api/coaches/suggested`), trending category pills, "Ako to funguje" bullets
  - Mobile top nav (`md:hidden`): unchanged logo + bell + avatar
  - Mobile bottom tab bar (`md:hidden`): unchanged 5-item tab bar
  - Main content: `md:ml-64 lg:mr-72` margin to account for fixed sidebars

- **routes/web.php** — new `GET /api/coaches/suggested` endpoint (returns 4 coaches ordered by subscriber_count, JSON)

- **Feed.tsx** — coach composer box (desktop only, `hidden md:block`, coaches only), stories row `max-w-2xl mx-auto`, feed posts `max-w-2xl`, tab bar `max-w-2xl mx-auto`

- **Home.tsx** — hero split layout on `md+` (text left + app mockup gradient right), featured coaches 3-col on `md:grid-cols-3 lg:grid-cols-4`, mobile keeps horizontal scroll

- **Coaches/Index.tsx** — grid updated to `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, sticky filter bar `top-14 md:top-0`

- **Coaches/Show.tsx** — two-column desktop layout: left 60% (cover + avatar + info + content tabs), right 40% sticky (subscription box + 4 stat cards + message button); extracted `SubscriptionBox` component used on both mobile and desktop; avatar position: centered on mobile, left-aligned on desktop

- **Messages/Index.tsx** — WhatsApp Web-style two-panel desktop layout: left 360px conversation list with inline search, right panel shows "Vyber konverzáciu" placeholder; mobile layout unchanged

- **Dashboard/Index.tsx** — stats grid responsive `grid-cols-2 lg:grid-cols-4`, taller chart (220px), max-width expanded to 1100px, bottom row grid responsive

### Routes added

```
GET /api/coaches/suggested  → JSON array of 4 coaches (public)
```

### Version: v0.9.0

- [2026-03-08] 0f63924: feat: full desktop layout with sidebars and responsive design
- [2026-03-08 12:57:24] 0f63924: feat: full desktop layout with sidebars and responsive design
- [2026-03-08 12:57:59] 79468d0: chore: update AI_MEMORY with session 4 desktop layout work
- [2026-03-08 13:07:21] 321c68e: feat: desktop polish — lucide icons, feed layout, messages panels
- [2026-03-08 13:17:19] a518404: feat: notifications page, fix coach edit layout and grid

---

## Session 5 — 2026-03-08 (cont.)

### What was fixed

**FIX 1 — Notifications system (new feature)**
- `database/migrations/…_create_notifications_table.php`: id, user_id, type, title, body, data(json), is_read, read_at, timestamps + compound index (user_id, is_read)
- `app/Models/Notification.php`: fillable + casts
- `app/Http/Controllers/NotificationController.php`: index() / markAllRead() / markOneRead()
- `resources/js/Pages/Notifications/Index.tsx`: type icons map, unread styling (white bg + terracotta left border), read styling (cream bg), empty state, "Označiť všetky" button, relative time
- Routes: `GET /notifications`, `POST /notifications/read-all`, `POST /notifications/{id}/read` (all auth)
- Seeded 5 sample notifications (4 unread + 1 read) per user via tinker

**FIX 2 — Coach Edit Profile → PulseLayout + Slovak**
- `Coaches/Edit.tsx`: replaced `AuthenticatedLayout` with `PulseLayout`
- All labels/buttons translated: "Upraviť profil kouča", "Nahrať fotku" / "Zmeniť fotku", "O mne", "Povedz niečo o sebe...", "Špecializácia", "napr. Silový tréning...", "Mesačná cena predplatného (€)", "Ukladám..." / "Uložiť profil"

**FIX 3 — Hide own profile from coaches grid**
- `CoachController::index()`: added `.when(auth()->check(), fn($q) => $q->where('user_id', '!=', auth()->id()))` — safe guard for public route

**FIX 4 — Sidebar "Pridať obsah" link for coaches**
- `PulseLayout.tsx`: added `PlusSquare` to lucide imports
- Added "Pridať obsah" link (href: `/dashboard/broadcast`) in `desktopNavLinks` — only shown when `isCoach === true`
- Dashboard link was already working correctly (isCoach conditional since session 4)

### Notifications table schema
```
notifications: id, user_id(FK), type(string), title(string), body(text nullable),
               data(json nullable), is_read(bool default false), read_at(timestamp nullable), timestamps
index: [user_id, is_read]
```

### Notification types
- `new_subscriber` → 🎉
- `new_message`    → 💬
- `new_like`       → ❤️
- `new_post`       → 📸
- `tip`            → 💰
- [2026-03-08 13:17:46] f34daf4: chore: update AI_MEMORY with session 5 fixes
- [2026-03-08 13:30:34] c2c1996: feat: social follow system, fan profiles, coach-to-coach interaction

---

## Session 6 — 2026-03-08 (cont.)

### What was built — Social follow system & fan profiles

**DB schema additions:**
- `follows`: follower_id, following_id (both FK users), unique constraint, index on following_id
- `users`: profile_bio (text), profile_avatar (string), profile_is_public (bool default true)

**Backend:**
- `FollowController::toggle($userId)`: toggle follow/unfollow, creates `new_follower` notification, JSON response
- `UserProfileController`: show (social profile), me (redirect to own), update (bio/avatar/visibility)
- `CoachController`: show() + index() now include user_id, is_following, followers_count
- `FeedController`: coaches now include user_id + is_followed for story ring color

**Routes added:**
```
GET  /profile/{userId}  → UserProfileController@show
GET  /profile/me        → UserProfileController@me
POST /profile/update    → UserProfileController@update
POST /follow/{userId}   → FollowController@toggle (JSON)
```

**Frontend:**
- `Profile/Show.tsx`: full social profile — cover, overlapping avatar, stats, inline edit mode, follow button, "Sleduje" tab
- `Coaches/Show.tsx`: Follow/Sledujem toggle + followers_count in stats
- `Coaches/Index.tsx`: secondary Sledovať button on every coach card
- `Feed.tsx`: story rings = terracotta if followed, grey if not
- `PulseLayout`: Profil link → `/profile/{user.id}`

**Notification:** `new_follower` type added (uses 🔔 fallback in UI)
- [2026-03-08 13:31:50] 2f24596: chore: update AI_MEMORY with session 6 social features
- [2026-03-08 13:38:47] 1404f38: fix: follow buttons, profile crash, coach home redirect
- [2026-03-08 13:47:20] 56a1f22: fix: follow button Inertia router, profile white screen
- [2026-03-08 13:52:20] 03845b1: fix: follow uses axios not Inertia router, profile crash debug
- [2026-03-08 14:05:14] 06c66f3: feat: coach post creation with media, rich editor, notifications

---

## Session 10 — 2026-03-08 (cont.)

### What was built — Coach post creation system

**DB:**
- `post_media` table: id, post_id(FK cascade), media_path, media_type(image|video), media_thumbnail nullable, sort_order unsignedSmallInteger, created_at
  - index: [post_id, sort_order]
- `PostMedia` model: fillable, `$timestamps = false`, belongsTo Post
- `Post` model: added `media()` hasMany PostMedia ordered by sort_order

**Backend:**
- `PostController`: create(), store(), createReel(), storeReel(), destroy()
  - store(): validate title/content/is_exclusive/media (max:3 files, max:80MB each, images+videos)
    - saves to `posts/images/` or `posts/videos/` via `Storage::disk('public')`
    - creates PostMedia rows + populates legacy media_path/media_type from first file
    - dispatches SendPostNotificationsJob
  - storeReel(): validates video (max 200MB, mp4/mov/webm), saves to `posts/reels/`
    - force is_exclusive=false, video_type='reel'
    - dispatches SendPostNotificationsJob with type 'new_reel'
  - destroy(): verifies coach owns post, deletes storage files, deletes post
- `SendPostNotificationsJob`: queued on 'notifications' queue
  - Reel → notify all followers (follows table)
  - Exclusive → notify subscribers only (subscriptions table, stripe_status=active)
  - Public → notify followers + subscribers merged + deduplicated
  - Batch insert via collect()->chunk(50)->each()
  - Notification title/body differ by type (🔒 exclusive, ⚡ reel, 📸 public)

**Routes added (all auth):**
```
GET  /dashboard/posts/create  → PostController@create
POST /dashboard/posts         → PostController@store
DELETE /dashboard/posts/{post} → PostController@destroy
GET  /dashboard/reels/create  → PostController@createReel
POST /dashboard/reels         → PostController@storeReel
```

**Frontend:**
- `Dashboard/Posts/Create.tsx`: two-column composer
  - Left: serif title input, markdown toolbar (B/I/H2/H3/list/quote), textarea with word count
  - Drag-drop media zone (max 3 files, shows type badge on thumbnails, remove button)
  - Upload progress bar
  - Right: audience selector cards (🌍 Verejný / 🔒 Exkluzívny), reach estimate, post preview card (live), submit button
- `Dashboard/Reels/Create.tsx`: reel composer
  - 9:16 upload zone → video preview player (with duration display)
  - Duration warning if >60s
  - Title + caption inputs
  - Right: reach stats (followers + subscribers + total), tips panel, ⚡ badge, submit
- `PulseLayout.tsx`: "Pridať obsah" is now a dropdown button (not a link)
  - Click toggles dropdown, click outside closes (useEffect + useRef)
  - Options: 📝 Príspevok → /dashboard/posts/create, ⚡ Reel → /dashboard/reels/create
- `Notifications/Index.tsx`: added `new_reel: '⚡'` to TYPE_ICONS map

### Notification types (updated)
- `new_subscriber` → 🎉
- `new_message`    → 💬
- `new_like`       → ❤️
- `new_post`       → 📸
- `new_reel`       → ⚡  ← NEW
- `new_follower`   → 🔔 (fallback)
- `tip`            → 💰
- [2026-03-08 14:05:44] 5297b8a: chore: update AI_MEMORY with session 10 post creation system
- [2026-03-08 14:11:25] 9c1f4f4: fix: nginx 413 upload limit, broadcast in sidebar
- [2026-03-08 14:17:44] 5ad5b5e: feat: complete post creation with exclusive video support

---

## Session 11 — 2026-03-08 (cont.)

### Fixes — Complete post creation with exclusive video support

**Frontend rewrite — `Dashboard/Posts/Create.tsx`:**
- `isExclusive` defaults to `true` (was false)
- Tab switcher below text editor: `📸 Fotka` | `🎬 Video`
- Photo tab: images only (jpg/png/webp/heic), max 3, 80MB each; cover badge on first photo
- Video tab: video only (mp4/mov/webm), max 200MB; preview player + file name/size/duration
  - exclusive+video: blurred overlay preview with 🔒 badge + info card
- Audience selector: two large cards SIDE BY SIDE (grid 2-col)
  - Green border (#4a7c59) = public; terracotta (#c4714a) = exclusive; default = exclusive
- Earnings estimate: shown when exclusive + subscriber_count > 0 (€X/mes at 85%)
- Live preview: photos/video blurred in preview if exclusive
- Submit label: "🔒 Uverejniť exkluzívne" vs "📤 Uverejniť príspevok"

**Backend — `PostController@store`:**
- Validation raised to 200MB, added heic/heif MIME support
- Video files now set `video_type='video'` in DB (was null — broke feed video tab)
- Redirects to `/feed` after publish (was `/dashboard`)
- `create()`: passes `followers_count` + `monthly_price` to frontend

**Bug fix — `FeedController`:**
- `media_url` now uses `Storage::url()` — was raw path, breaking uploaded images/videos in feed

**Storage:** `chown -R www-data:www-data storage/ && chmod -R 775`

**Media type rules:**
- Photo posts: `media_type='image'`, `video_type=null`, multi-file in `post_media`
- Video posts: `media_type='video'`, `video_type='video'`, single file
- Reels:       `media_type='video'`, `video_type='reel'`, always `is_exclusive=false`
- [2026-03-08 14:18:16] 7cc841f: chore: update AI_MEMORY with session 11 post creation fixes
- [2026-03-08 14:29:49] bddf621: feat: new conversation from profile, message privacy settings

---

## Session 12 — 2026-03-08 (cont.)

### What was built — Message privacy + new conversation flow

**DB:**
- `coaches.messages_access` column: string, default `'followers'`, values: `followers` | `subscribers` | `nobody`

**Backend:**
- `CoachController::search()`: GET `/coaches/search?q=...` → JSON (id, user_id, name, specialization, avatar_url), max 8 results, name LIKE query
- `CoachController::show/edit/update()`: include/save `messages_access`
- `MessageController::store()`: access policy check before saving — `nobody` → 403, `subscribers` → check `subscriptions` table, `followers` → check `follows` table; handles both Inertia (back()->withErrors) and axios (JSON 403) requests
- Route: `GET /coaches/search` placed BEFORE `/coaches/{coach}` to avoid route conflict

**Frontend:**
- `Coaches/Show.tsx`: "Napísať správu" button links to `/messages/{coach.user_id}`; access badge shows for non-followers policy; button hidden when access='nobody' or not logged in
- `Coaches/Edit.tsx`: `messages_access` radio selector (3 options) added to coach profile edit form
- `Messages/Show.tsx`: `handleSend` error handler reads `errs.access` first for toast display
- `Messages/Index.tsx`:
  - `NewMessageModal` component: debounced search (250ms), axios GET `/coaches/search?q=...`, coach results list
  - "+ Nová správa" button added to mobile header (top right) and desktop panel header (top right)
  - Opens modal on click, navigates to `/messages/{user_id}` on coach selection
- [2026-03-08 14:47:44] fe6a9ce: feat: messages privacy setting visible in coach profile edit
- [2026-03-08 14:49:41] 1ec71bf: chore: v1.0.0 changelog, scalability report, code cleanup
- [2026-03-08 16:38:34] 0b87fa6: feat: complete fan profile with subscriptions, following, likes tabs

---

## Session 13 — 2026-03-08 (cont.)

### What was built — Complete fan profile page

**Backend — `UserProfileController` full rewrite:**
- `show()` now returns: `email` (own only), `member_since` (Slovak), `likedPostsCount`, `likedPosts` (last 24, with thumbnail_url), `subscriptions` (real Cashier subs or demo from following coaches), `subscriptionsCount`, `monthly_price` on followingList entries
- `mySubscriptions()` added: GET `/profile/subscriptions` → JSON; real Stripe subs or demo following coaches
- Route `/profile/subscriptions` placed BEFORE `/profile/{userId}` to avoid conflict
- Subscriptions demo: following coaches shown as mock active subscriptions when Cashier table is empty

**Frontend — `Profile/Show.tsx` complete rewrite:**
- Stats row: Sleduje / Predplatné / Lajky (3 counts)
- Avatar: hover overlay (📷) always clickable on own profile (no need for edit mode)
- Member since: `"Člen od marca 2026"` under role badge
- Role badge: green (#e8f4ec / #4a7c59) for fan, terracotta for coach
- 4 tabs (own profile): 📋 Predplatné / 👥 Sleduje / ❤️ Páčilo sa mi / ⚙️ Nastavenia
- 1 tab (other profile): 👥 Sleduje
- Default tab: `predplatne` (own profile), `sleduje` (other)
- **Predplatné tab**: subscription rows — avatar, name, spec, subscribed_since, price badge, status pill (green/red), "Profil →" link, ghost "Zrušiť" button (red on hover)
- **Sleduje tab**: 2-col mobile / 4-col desktop grid; "Sledujem ✓" unfollow button (optimistic, fades card on unfollow)
- **Lajky tab**: 3-col grid of liked posts — thumbnail, exclusive lock badge, post title, coach name
- **Nastavenia tab**: email (read-only), "Zmeniť heslo" link, coach settings link (coaches only), danger zone with "Zmazať účet" → confirmation modal
- Delete modal: overlay with confirm/cancel buttons, calls `router.delete('/profile')`
- Message button (💬) on other users' profiles
- `Avatar` component imported from `@/Components/Avatar`

**Seed data added:**
- `fan@pulse.sk`: profile_bio set, profile_is_public=true, 5 post_likes inserted
- [2026-03-08 16:39:05] 03aaacf: chore: update AI_MEMORY with session 13 fan profile
- [2026-03-08 18:12:16] b02875d: fix: fan 403 bug — remove incorrect role middleware from public routes
- [2026-03-08 18:19:59] dce4be4: fix: fan 500 on message send — null coach check and error handling
- [2026-03-08 18:33:27] 901ef5e: feat: Stripe subscription flow with real isSubscribed checks
- [2026-03-08 19:09:39] fad7bb1: feat: UX audit fixes — footer GDPR, login split, clickable cards, mobile hero, reviews sidebar, legal pages
- [2026-03-08 19:14:57] 6660023: feat: Stripe checkout rewrite — direct StripeClient, EUR currency, robust success handler

---

## Session 14 — 2026-03-08 (cont.)

### What was built — Stripe controller rewrite + EUR currency

**SubscriptionController full rewrite (direct Stripe API):**
- `checkout()`: creates Stripe customer if needed (`stripe_id`), uses `\Stripe\StripeClient` directly (not Cashier), `Inertia::location($session->url)` for redirect, guards zero price, catches `ApiErrorException` separately
- `success()`: retrieves Checkout Session from Stripe, upserts `subscriptions` table row with correct `stripe_status`, increments `subscriber_count` only if row is fresh (<5min), inserts `notifications` row to notify coach
- `cancel()`: direct `$stripe->subscriptions->cancel()` + DB update to `canceled` status
- `ensureStripePriceExists()`: accepts `StripeClient` as param (no re-instantiation)

**DB queries standardized:**
- `CoachController::show()`: replaced `subscribed('coach_N')` with direct `DB::table('subscriptions')->whereIn('stripe_status', ['active','trialing'])` check
- `FeedController`: replaced `$user->subscribed()` call in coaches map with `in_array($coach->id, $subscribedCoachIds)` (already built from DB query)

**Config fix:**
- `.env`: added `CASHIER_CURRENCY=eur` (was missing, cashier defaulted to `usd`)

### Pending — Stripe keys not configured

Stripe keys (`STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`) are empty in `.env`.
E2E test cannot be completed until keys are set.

**Stripe keys configured (test mode):**
- `STRIPE_KEY=rk_test_51T8m...` (restricted), `STRIPE_SECRET=sk_test_51T8m...`
- `CASHIER_CURRENCY=eur`
- All 11 coaches have Stripe Products + recurring EUR Prices seeded
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC
- [2026-03-08 19:15:18] ff319c3: chore: update AI_MEMORY with session 14 Stripe rewrite notes
- [2026-03-08 19:20:26] 9541d4c: feat: Stripe checkout tested and working end-to-end
- [2026-03-08 19:30:25] 123be6f: feat: coach review and rating system with star picker

---

## Session 15 — 2026-03-08 (cont.)

### What was built — Coach review & rating system

**DB:**
- `reviews`: id, user_id(FK), coach_id(FK), rating(tinyint 1-5), content(text nullable),
  is_visible(bool default true), timestamps — unique:[user_id,coach_id], index:[coach_id,rating]
- `coaches`: added `rating_avg` (decimal 3,2 default 0), `rating_count` (int default 0)
- `Coach.$fillable`: added `rating_avg`, `rating_count`, `stripe_product_id`, `stripe_price_id`

**Backend:**
- `Review` model: fillable, belongsTo User/Coach
- `ReviewController`: store/destroy (auth), index (public JSON paginated 10/page)
  — subscription check, updateOrCreate pattern, recalculate avg after every write
  — DB notification for coach on first review (not edits)
- `CoachController::show()`: adds `reviews` (last 10), `user_review`, `rating_avg`, `rating_count`
- `CoachController::index()`: returns `rating_avg` + `rating_count` (replaced old `rating`)
- `DashboardController`: rating stats + reviews in `buildRecentActivity()`
- `/api/coaches/suggested`: now includes `rating_avg` + `rating_count`

**Routes:**
```
GET    /coaches/{coachId}/reviews  → public
POST   /coaches/{coachId}/reviews  → auth
DELETE /coaches/{coachId}/reviews  → auth
```

**Frontend:**
- `Show.tsx`: 5th tab "⭐ Recenzie (N)" — rating bar chart, star picker, write/edit/delete,
  ReviewCard with "✓ Overený predplatiteľ" badge, load more via axios pagination
- `Index.tsx`: `rating_avg`/`rating_count`, "Nové" badge when 0 reviews
- `PulseLayout.tsx` right sidebar: ★ avg shown below specialization
- `Dashboard/Index.tsx`: reviews stat card replaces views when rating_count > 0

**Business rules:**
- Only subscribers can review (stripe_status active/trialing)
- One review per user per coach (editable)
- Coach cannot review themselves
- Seeded: 3–6 reviews per coach, real avg stored in rating_avg/rating_count
- [2026-03-08 19:31:15] ea6c12d: chore: update AI_MEMORY with session 15 review system
- [2026-03-08 19:35:35] e4f2fbc: fix: review 500 error — wrong notifications table schema
- [2026-03-08 19:47:35] f6e89cf: chore: developer onboarding — README, CONTRIBUTING, tests, .env.example
- [2026-03-08 19:54:18] 0d3e58d: chore: use pulse_test DB for tests — prevent wiping demo data
- [2026-03-08 19:56:25] 3d3ddc6: fix: dashboard 500 when coach has no profile yet
- [2026-03-08 20:10:57] 99de78f: fix: share flash messages globally via Inertia middleware
- [2026-03-08 20:18:26] 0d147f2: chore: consistency audit, docs, versioning v1.1.0
- [2026-03-09 08:30:52] b9a9faf: feat: coach profile redesign — content tab, reviews, completeness indicator

---

## Session 16 — 2026-03-09 — Coach Profile Redesign

### What was built

**Smart /profile/{id} — role-aware layout:**
- Coach viewing own profile: completely different layout from fan
- 4 coach tabs: 📊 Prehľad / 📝 Môj obsah / ⭐ Recenzie / ⚙️ Nastavenia
- Coach stats row: 👥 predplatitelia, ❤️ sledovatelia, ⭐ hodnotenie, 📝 príspevky
- Action buttons: "Verejný profil" → /coaches/{coach_id}, "Upraviť profil" → /dashboard/profile
- Profile completeness indicator (amber, 5 checks: avatar/bio/spec/price/1post)
- "Môj obsah" tab: post cards + delete with confirmation modal (axios.delete /dashboard/posts/{id})
- Notification preference toggles (on/off switches) for coaches and fans
- Fan tabs unchanged

**Backend changes:**
- `UserProfileController::show()` now returns `ownPosts`, `coachReviews`, `postsCount` for coach own profile
- `HandleInertiaRequests`: auth.user now includes `coach_id` field
- `UserProfileController::update()`: accepts notif_* boolean fields
- Migration: `notif_new_subscriber`, `notif_new_message`, `notif_new_review`, `notif_new_like` on users

**PulseLayout changes:**
- Sidebar bottom: "👤 Môj profil" + "🏋️ Verejný profil" links for coaches
- Mobile nav "Profil" tab: fixed → `/profile/{user.id}`
- [2026-03-09 08:41:10] 2108c04: chore: update AI_MEMORY with session 16 coach profile redesign
- [2026-03-10 07:50:20] 77ea57c: feat: unified desktop+mobile navigation with matching Lucide icons

---

## Session 17 — 2026-03-10 — Unified Navigation Icons

### What was changed

**PulseLayout.tsx — mobile bottom nav rewrite:**
- Replaced emoji icons (🏠📱🔍💬👤) with Lucide icons matching desktop exactly
- Mobile nav is now role-aware: coach nav ≠ fan nav
- Coach mobile nav (5 tabs): LayoutDashboard / Rss / MessageCircle / Bell / User
- Fan mobile nav (5 tabs): Home / Rss / Compass / MessageCircle / User
- Active state: terracotta color (#c4714a) + strokeWidth 2.5 vs 1.8 inactive
- Unread badge (red dot, 9+ max) on Messages AND Notifications tabs on mobile

**Desktop sidebar icon fixes:**
- Dashboard: BarChart2 → LayoutDashboard
- Objaviť: Search → Compass
- Notifikácie now shows unread badge (was always 0)

**Backend — `NotificationController::unreadCount()`:**
- New method returns `{count: N}` for auth user
- Route: `GET /api/notifications/unread-count` (auth, same pattern as messages)
- Both message + notification counts fetched in single polling interval (30s)

**Main content:** `pb-20 md:pb-0` so bottom nav doesn't overlap content on mobile
- [2026-03-10 07:50:38] 1a9a989: chore: update AI_MEMORY with session 17 unified navigation
- [2026-03-10 08:10:40] ccea2b9: feat: followers/subscribers lists, clickable notifications with redirect

---

## Session 18 — 2026-03-10 — Coach Profile Tabs + Clickable Notifications

### What was built

**FIX 1 — Coach profile followers + subscribers lists:**
- `UserProfileController::show()`: new queries for coach own profile:
  - `followers`: JOIN follows + users, ordered by followed_at desc
  - `subscribers`: JOIN subscriptions (active) + users, monthly_price from coach
  - `recentActivity`: last 5 notifications for the coach
- `Profile/Show.tsx`: two new coach tabs added to tab bar:
  - `👥 Sledovatelia (N)`: list with Avatar, name, follow date, role badge (Kouč/Člen)
  - `💳 Predplatitelia (N)`: list with Avatar, name, subscribed date, €price/mes badge + revenue footer
- `CoachTab` type extended: `'sledovatelia' | 'predplatitelia'` added
- New types: `Follower`, `CoachSubscriber`, `ActivityItem` interfaces

**FIX 2 — Notifications clickable with redirect:**
- Migration: `related_id` (unsignedBigInteger nullable) added to notifications table
- `Notification` model: `related_id` added to `$fillable`
- `FollowController::toggle()`: stores `related_id = $follower->id` (new_follower)
- `ReviewController::store()`: stores `related_id = $coach->id` (new_review)
- `SendPostNotificationsJob`: stores `related_id = $post->id` (new_post/reel)
- `NotificationController::index()`: exposes `related_id` in response
- `Notifications/Index.tsx`: each notification is now a `<Link>` using `getNotificationLink(n)`:
  - `new_message` → `/messages/{related_id}`
  - `new_follower` → `/profile/{related_id}`
  - `new_review` → `/coaches/{related_id}`
  - `new_post/reel/like` → `/feed`
  - `new_subscriber` → `/profile/me`
  - Clicking also marks notification as read (if unread)

**FIX 3 — Clickable activity in coach Prehľad tab:**
- "Posledná aktivita" section in Prehľad tab using `recentActivity` prop
- Each item is a `<Link>` using same `getNotificationLink()` logic
- Unread items: slightly tinted background + terracotta border + dot indicator

### Key patterns
- `related_id` stores: user_id (for follows/messages), coach_id (for reviews), post_id (for posts/reels)
- `getNotificationLink(item)` helper used in both Notifications page and Profile Prehľad tab
- [2026-03-10 08:11:02] 9ea5eaa: chore: update AI_MEMORY with session 18 coach profile tabs and notifications
- [2026-03-10 11:32:21] 1de4bc1: feat: email notifications, preferences UI, password reset fix

---

## Session 19 — 2026-03-10 — Email Notifications + Password Reset

### Email provider
- **Resend** (resend.com) — free tier 3000 emails/month
- SMTP: `smtp.resend.com:465` (SSL), username=`resend`, from=`hello@pulsehub.fun`
- API key stored in `.env` as `MAIL_PASSWORD` (gitignored)

### Mail classes
- `app/Mail/NotificationMail.php` — ShouldQueue, params: title/body/actionUrl/actionText/type
- `app/Mail/WelcomeMail.php` — ShouldQueue, sends on registration
- `resources/views/emails/notification.blade.php` — branded markdown template with button
- `resources/views/emails/welcome.blade.php` — welcome with coach discovery CTA

### EmailNotificationService
- `app/Services/EmailNotificationService.php`
- Checks `email_notif_{type}` column — skips if false
- Skips unverified emails
- Builds config per type, queues `NotificationMail`
- Email types handled: `new_subscriber`, `new_message`, `new_review`, `new_like`, `new_post`

### Where emails are triggered
- `FollowController::toggle()` — `new_subscriber` when coach is followed
- `MessageController::store()` — `new_message` to receiver
- `ReviewController::store()` — `new_review` to coach (first review only)
- `SubscriptionController::success()` — `new_subscriber` on Stripe checkout
- `RegisteredUserController::store()` — `WelcomeMail` on registration

### DB schema additions
- `users` table: `email_notif_new_subscriber`, `email_notif_new_message`,
  `email_notif_new_review`, `email_notif_new_like`, `email_notif_new_post` (all boolean)
- Separate from in-app `notif_*` columns (those control in-app only)

### UI — Profile/Show.tsx Nastavenia tab
- "📧 Emailové notifikácie" section added to both coach and fan Nastavenia tabs
- Toggle each type, saves optimistically via `axios.post('/profile/update', {key: 0|1})`
- "🔔 Notifikácie v apke" renamed/separated from email section

### Password reset
- Routes were already correct (Laravel Breeze default)
- Fix was configuring real SMTP (was `log` driver before)
- `ForgotPassword.tsx` → translated to Slovak
- `ResetPassword.tsx` → "Nové heslo" / "Potvrď nové heslo" / "Obnoviť heslo"

### Queue worker
- `pulse-queue.service` restarted and running
- All emails are queued (ShouldQueue interface) — processed async
- [2026-03-10 11:32:44] dbf24be: chore: update AI_MEMORY with session 19 email notifications

---

## Session 20 — 2026-03-10 — Email delivery fix + queue debug

### Problem: emails not arriving
- `NotificationMail` and `WelcomeMail` implement `ShouldQueue`
- Calling `Mail::to()->send()` on ShouldQueue mailable dispatches to Redis queue
- Queue worker ran jobs with old `MAIL_SCHEME=ssl` → failed with `UnsupportedSchemeException`
- Laravel 11 uses Symfony Mailer — only supports `smtp` or `smtps` schemes (NOT `ssl`)

### Fix applied
- `.env`: `MAIL_SCHEME=smtps` (was `ssl`)
- Retried failed jobs: `php artisan queue:retry all`
- All email jobs now process successfully

### Email verification guard
- `EmailNotificationService::send()` skips users with `email_verified_at = null`
- Seeded/test users may lack verified email → emails silently skipped
- Fix: `App\Models\User::whereNull('email_verified_at')->update(['email_verified_at' => now()])`

### Debugging pattern for email issues
1. Check `failed_jobs` table for exceptions
2. Check user `email_verified_at` — null = no email sent
3. Check `email_notif_{type}` preference column — false = no email sent
4. Use `Mail::to()->sendNow()` in tinker for sync test (bypasses queue)
- [2026-03-10 11:44:41] 8855d72: chore: update AI_MEMORY with session 20 email delivery fix
- [2026-03-10 11:49:11] ef0ce97: docs: update README to v1.2.0 — email notifications, nav redesign, coach profile

---

## Session 21 — 2026-03-10 — Mux Live Streaming

### Mux integration
- Package: `muxinc/mux-php` ^5.1
- Config: `config/services.php` → `mux.token_id`, `mux.token_secret`, `mux.webhook_secret`
- Env vars: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`

### New DB tables
- `live_streams`: coach_id(FK), mux_live_stream_id, mux_playback_id, stream_key, rtmp_url, status(idle|active|disabled), access(subscribers|everyone), title, description, started_at, ended_at, peak_viewers, viewers_count
- `live_stream_messages`: live_stream_id(FK), user_id(FK), message(300)

### New Models
- `app/Models/LiveStream.php` — belongsTo Coach, hasMany LiveStreamMessage
- `app/Models/LiveStreamMessage.php` — belongsTo LiveStream, User

### New Service
- `app/Services/MuxService.php`
  - `createLiveStream()` → creates Mux stream + playback ID
  - `deleteLiveStream($id)` → deletes from Mux
  - `getStreamStatus($id)` → polls Mux for current status

### New Controller
- `app/Http/Controllers/LiveStreamController.php`
  - `index()` — coach dashboard `/dashboard/live`
  - `store()` — create new stream via Mux, notify viewers
  - `destroy($id)` — end stream
  - `watch($coachId)` — fan viewer page
  - `sendMessage($streamId)` — live chat
  - `poll($streamId)` — status + new messages (3-5s polling)

### Routes
- GET/POST `/dashboard/live` → live.index / live.store (auth)
- DELETE `/dashboard/live/{id}` → live.destroy (auth)
- GET `/live/{coachId}` → live.watch (auth)
- POST `/live/{streamId}/message` → live.message (auth)
- GET `/live/{streamId}/poll` → live.poll (auth)

### New Pages
- `resources/js/Pages/Dashboard/LiveStream.tsx` — coach management (create form + RTMP/key display)
- `resources/js/Pages/LiveStream/Watch.tsx` — dark theme viewer + Mux player + live chat (3s poll)
- `resources/js/Pages/LiveStream/Locked.tsx` — paywall for subscribers-only streams

### Player
- `@mux/mux-player` loaded via CDN script tag in useEffect
- Uses `<mux-player stream-type="live" playback-id="...">` web component
- No npm package needed — avoids SSR issues

### PulseLayout
- Added `Radio` icon import from lucide-react
- Added "Live Stream" nav link for coaches → `/dashboard/live`

### CoachController
- Added `is_live` field (bool) to both `index()` and `show()` responses
- Checks `LiveStream::where('coach_id',...)->where('status','active')->exists()`

### Coaches/Index.tsx + Show.tsx
- `is_live: boolean` added to Coach interface
- Index: red pulsing LIVE badge on coach card
- Show: "Sledovať LIVE" red button → `/live/{coach.id}` when coach is live

### Access control
- `subscribers` — only active/trialing subscribers (+ coach themselves) can watch
- `everyone` — all authenticated users can watch
- Non-subscribers see `LiveStream/Locked.tsx` with subscribe CTA

### Notifications on stream start
- `notifyViewers()` inserts batch notifications to followers (everyone) or subscribers (subscribers)
- Type: `live_stream`, related_id = stream.id
- [2026-03-10 12:30:45] 58f7a11: feat: Mux live streaming — coach dashboard, viewer page, live chat

---

## Session 22 — 2026-03-10 — Browser WebRTC streaming + 500 fix

### Bug fix: 500 on stream create
- `CreatePlaybackIdRequest` → správne `CreatePlaybackIDRequest` (veľké ID)
- Mux PHP SDK v5.x používa `CreatePlaybackIDRequest` nie `CreatePlaybackIdRequest`

### Browser streaming (WebRTC / WHIP protocol)
- Coach môže streamovať priamo z prehliadača (getUserMedia + RTCPeerConnection)
- WHIP endpoint: `https://global-live.mux.com:443/app/{stream_key}` — POST SDP offer
- `getWebRtcConfig($streamId)` → vráti `whip_endpoint` (len pre vlastníka streamu)
- Route: `GET /dashboard/live/{streamId}/webrtc-config`

### method column na live_streams
- `method` enum: `browser` | `obs`, default `obs`
- Uložené pri vytváraní streamu, zobrazuje správne UI sekciu

### Dashboard/LiveStream.tsx — kompletný rewrite
- **Create form**: title + desc + access selector + method selector (browser vs OBS)
- **Browser view**: camera preview (video element), mic/cam toggles, Spustiť/Ukončiť
- **OBS view**: RTMP URL + stream key display + inštrukcie + Ukončiť
- WebRTC flow: getUserMedia → RTCPeerConnection → createOffer → ICE gather (3s timeout) → POST SDP na WHIP endpoint → setRemoteDescription

### Watch.tsx — player upgrade
- `@mux/mux-player-react` npm balík namiesto CDN script tagu
- `<MuxPlayer streamType="live" playbackId={...} autoPlay muted />`
- Robustnejší, bez hydration issues

### npm packages added
- `@mux/mux-player-react` — HLS live stream player
- [2026-03-10 12:43:09] 4ffd3bb: feat: browser WebRTC streaming + fix Mux 500 error
- [2026-03-10 12:45:51] e6198a0: fix: camera permission not prompted — remove auto-start getUserMedia
- [2026-03-10 12:48:53] f3a3bf4: fix: startBroadcast shows loading + proper error display
- [2026-03-10 12:51:50] b3fdd23: fix: proxy WHIP SDP through Laravel to avoid browser CORS
- [2026-03-10 12:52:51] 09248ed: fix: use axios for WHIP proxy — fixes 419 CSRF error
- [2026-03-10 14:16:28] 51cffce: feat: live streaming with browser WebRTC, real-time chat via Reverb

---

## Session 25 — Dashboard redesign (2026-03-11)

### DashboardController::index() — real data queries
- `totalPosts`, `totalLikes` (post_likes JOIN posts), `totalMessages` (unread) — all real DB queries
- `subscribersCount`, `newThisWeek`, `monthlyEarnings` — from `subscriptions` table (stripe_status IN active/trialing)
- `monthlyEarnings` = `sum('stripe_price') * 0.85` — NOTE: stripe_price is Stripe Price ID string, so returns 0 until real payments set up (correct for now)
- `completeness` — 5 checks × 20pts: profile_avatar, profile_bio, monthly_price, totalPosts > 0, stripe_price_id
- `recentSubscribers` — JOIN subscriptions+users, last 5, with diffForHumans
- `bestPost` — withCount('likes'), orderBy likes_count desc
- `earningsData` — 6-month collect(range(5,0)), real DB sum per month
- `recentActivity` — from `notifications` table (user_id, type, title, body, is_read, related_id)
- `dashboard_sidebar` prop — passed to Inertia for PulseLayout right sidebar

### PulseLayout right sidebar — context-aware
- Reads `page.props.dashboard_sidebar` via `usePage()`
- If `dashboardSidebar && isCoach`: shows coach widgets (quick stats, completeness bar, recent subscribers)
- Otherwise: shows default sidebar (search, suggested coaches, trending categories)
- Removed fake `REVIEWS` constant

### Dashboard/Index.tsx changes
- All 4 stat cards wrapped in `<Link>` (earnings→/dashboard/earnings, subscribers×2→/dashboard/subscribers, views/likes→/feed)
- Hover: shadow + border-color transition on stat cards
- Quick action "Pridať obsah": dropdown with Príspevok/Reel (useRef outside-click close)
- Quick action "Výplaty": modal if !coach.stripe_price_id, else router.visit('/dashboard/earnings')
- Best post: clickable (→/feed or →/dashboard/posts/create if empty)
- Activity feed: each item is `<Link href={activity.link}>`, unread dot indicator
- Earnings chart: uses `earnings_data` prop, tooltip shows Zárobky + Noví predplatitelia, Cell color by isCurrentMonth
- [2026-03-11 07:01:16] c49a5bc: fix: dashboard — right sidebar redesign, stat cards clickable, earnings chart fix, activity feed clickable
- [2026-03-11 07:03:33] de4a5e1: fix: dashboard 500 — stripe_price is varchar not numeric, use monthly_price × count for earnings
- [2026-03-11 07:11:16] 66859c5: feat: dashboard sidebar followers/subscribers + earnings page dual chart
- [2026-03-11 07:26:38] 005556f: fix: followers page + earnings chart consistent values
- [2026-03-11 07:37:49] 4c8743d: fix: recent posts widget, Slovak timestamps, activity actor names, completeness fix

---

## Session 26 — Dashboard remaining fixes (2026-03-11)

- **Carbon locale**: `Carbon::setLocale('sk')` in AppServiceProvider::boot() — all diffForHumans() now Slovak
- **recentPosts**: replaced bestPost — Post withCount('likes') + with('media'), thumbnail from PostMedia->media_thumbnail ?? media_path, ordered by created_at desc, take(3)
- **Post model**: field is `content` (not `body`), no `comments` relation exists
- **PostMedia columns**: media_path, media_thumbnail, media_type, sort_order
- **recentActivity actor names**: `DB::table('users')->where('id', $n->related_id)->value('name')` — safe, returns null if related_id is not a user (e.g. post_id)
- **Completeness avatar**: `Storage::disk('public')->exists($user->profile_avatar)` instead of simple truthy check
- **Dashboard/Index.tsx**: "Moje posledné príspevky" widget — thumbnail/placeholder, title, 🔒 exclusive badge, ❤️ likes, relative time, hover, "+ Pridať" link
- [2026-03-11 07:41:35] fdba4a1: fix: create like notification + email on post like
- [2026-03-12 06:54:45] d17fc95: fix: closes #3 — Dashboard/Earnings — layout nezarovnaný na mobile
