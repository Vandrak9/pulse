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
