# Changelog

All notable changes to PULSE are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`.

> **MAJOR** — breaking changes
> **MINOR** — new features, backwards compatible
> **PATCH** — bug fixes, small UI tweaks, content changes

---

## [Unreleased]

---

## [0.7.0] — 2026-03-07

### Added
- `database/migrations/2026_03_07_230000_add_video_type_to_posts_table.php` — adds `video_type` enum (reel/video/null) and changes `video_duration` from string to integer (seconds)
- `app/Services/PexelsService.php` — `minDuration`/`maxDuration` filter params, returns `duration` integer from Pexels
- `database/seeders/ContentSeeder.php` — redesigned: assigns reels (maxDuration=60) vs long videos (minDuration=60) per coach; 2 reels + 1-2 videos + 0-2 images per coach
- `resources/js/Pages/Feed.tsx` — 3 tabs:
  - "Pre teba" — mixed post feed (existing PostCard)
  - "Reels" — TikTok-style scroll-snap vertical player, auto-play on scroll, coach overlay, like/comment/share sidebar
  - "Videa" — YouTube-style horizontal video cards with thumbnail + duration + coach
- `resources/js/Pages/Coaches/Show.tsx` — 4 content tabs:
  - "Vsetko" — existing 3-col mixed grid
  - "Reels" — 3-column 9:16 reel thumbnails, click opens VideoModal
  - "Videa" — list cards with 16:9 thumbnail + duration + date
  - "Fotky" — square photo grid

### Changed
- `posts.video_duration` — integer (seconds) instead of string (MM:SS)
- `posts.video_type` — new column: `reel` | `video` | null
- Feed.tsx Post interface: `video_type: 'reel' | 'video' | null`, `video_duration: number | null`
- Show.tsx Post interface: renamed `media_path`→`media_url`, `thumbnail_path`→`thumbnail_url`; added `video_type`

---

## [0.6.0] — 2026-03-07

### Added
- `app/Services/PexelsService.php` — Pexels API client:
  - `searchVideos($query, $perPage)` — fetches HD MP4 links + thumbnail URLs from `/videos/search`
  - `searchImages($query, $perPage)` — fetches large image URLs from `/v1/search`
  - Uses `Authorization` header with `PEXELS_API_KEY` from `.env`
- `database/seeders/ContentSeeder.php` — assigns real Pexels media to all 6 coaches:
  - Per-coach search queries (e.g., "weightlifting", "yoga", "crossfit")
  - Downloads video thumbnails locally to `storage/app/public/thumbnails/`
  - Stores video stream URLs in `posts.media_path`
  - Sets `is_exclusive`: first 2 media posts free, rest exclusive
- `resources/js/Components/VideoModal.tsx` — fullscreen video player:
  - Fixed overlay `bg-black/92`, HTML5 `<video controls autoPlay playsInline>`
  - Post title + coach name at top
  - X close button + click outside to close + Escape key to close
  - Locks page scroll while open
- `PEXELS_API_KEY` added to `.env`

### Changed
- `FeedController` — DTO now includes `media_url` (external URL) and `thumbnail_url` (`Storage::url()`)
- `Feed.tsx` — real media rendering:
  - Video cards show real Pexels thumbnail images (not dark placeholder)
  - Clicking thumbnail or "Prehrať video" opens `VideoModal`
  - Image posts show real Pexels images via `<img src={media_url}>`
  - Exclusive posts show blurred thumbnail hint behind lock overlay
  - `onPlay` callback threads from `Feed` → `PostCard` → `VideoModal`

---

## [0.5.0] — 2026-03-07

### Added
- `Feed.tsx` — OnlyFans-style scrollable content feed:
  - Stories row: horizontal scroll, round 56px avatars, terracotta gradient ring, "Objaviť +" discover button
  - Post cards: coach header (40px avatar with gradient ring), Slovak relative timestamp, 16:9 media area
  - Video posts: dark bg, centered ▶ play button, duration badge, 🎬 badge
  - Image posts: warm placeholder
  - Exclusive locked posts: blur overlay, 🔒 icon, "Predplatiť za €X/mes" CTA button
  - Like toggle with optimistic UI (instant feedback, background sync)
  - Action bar: 🤍/❤️ like (with count), 💬 comments, 🔖 save, share button
  - "▶ Prehrať video" full-width terracotta outline button for free videos
  - Slovak relative times: "pred hodinou", "pred 3 dňami", etc.
- `FeedController` — `index()` + `like()`:
  - Fetches latest 20 posts with eager-loaded coach+user
  - Batch liked IDs query (no N+1): single `whereIn` for current user's likes
  - `like()` toggles PostLike record, returns `back()`
- `post_likes` table — `user_id`, `post_id` with unique constraint, cascade deletes
- `PostLike` model — `belongsTo User/Post`, `$timestamps = false`
- `Post` model — added `likes(): HasMany` relationship
- Routes: `GET /feed` + `POST /feed/like/{post}` (both `auth` middleware)

### Changed
- `PulseLayout.tsx` — "Objaviť" bottom tab now links to `/feed` (was `/coaches`)
- `CoachSeeder` — 6 posts per coach with realistic varied timestamps (`hours_ago` field):
  - Mix of video, image, none media types
  - Range from 1h ago to 5 days ago
  - Slovak fitness content titles

---

## [0.4.0] — 2026-03-07

### Added
- `Auth/Login.tsx` — fully redesigned with PULSE branding:
  - Standalone page (no GuestLayout) with cream background `#faf6f0`
  - PULSE serif logo at top, white card `rounded-2xl`, warm border
  - Custom inputs with warm border focus ring (`#c4714a`)
  - Terracotta rounded-full submit button, SK labels ("Vitaj späť", "Heslo", "Zapamätať si ma", "Zabudol si heslo?")
- `Auth/Register.tsx` — fully redesigned with PULSE branding:
  - Title: "Pridaj sa k PULSE"
  - Role selector at top: "Som fanúšik 👤" / "Som kouč 💪" (2-column grid, active state highlighted)
  - Same warm input and button styles as Login
- `users.role` column — enum `fan|coach`, default `fan` (migration added)
- `RegisteredUserController` — validates `role`, saves to DB, role-based redirect:
  - `coach` → `/dashboard/profile` (complete your profile)
  - `fan` → `/coaches` (browse coaches)

### Changed
- `Home.tsx` — featured coaches section redesigned:
  - Replaced tall photo cards with compact cards matching `Coaches/Index.tsx` style
  - Round 80px avatar, name, specialization badge, rating, price
  - Horizontal scroll gap reduced to `gap-3`
- `User` model — `role` added to `$fillable`

---

## [0.3.0] — 2026-03-07

### Added
- `Home.tsx` — full landing page:
  - Hero section: warm gradient, decorative blobs, serif title, social proof stats
  - Featured coaches: horizontal scroll row (top 4 by subscriber count)
  - How it works: 3-step guide with large faded step numbers (01/02/03)
  - Categories: 6-tile grid (💪🧘🥗🏃🌿✨) linking to /coaches with keyword filter
  - CTA banner: gradient terracotta for coach recruitment
- `HomeController` — fetches top 4 coaches by `subscriber_count` for featured row
- `PulseLayout.tsx` — complete rewrite:
  - Sticky top nav (z-50): PULSE serif logo, desktop search bar, auth-aware right side
  - Guest: Prihlásiť + Registrovať buttons
  - Logged in: notification bell (with unread dot) + avatar initial
  - Bottom mobile tab bar (fixed, md:hidden): 🏠 Domov / 🔍 Objaviť / 💬 Správy / 👤 Profil
  - Active tab detection via `usePage().url`
  - Page content wrapped in `<main className="animate-fade-in">`
  - Bottom spacer `h-16 md:hidden` to prevent content hiding behind tab bar
- `tailwind.config.js` — `animate-fade-in` keyframe (opacity 0→1, translateY 8px→0, 0.35s)
- `resources/css/app.css` — `.no-scrollbar` moved to `@layer utilities`

### Changed
- `routes/web.php` — `GET /` now renders `Home` via `HomeController@index` (replaced Welcome closure)
- `Coaches/Index.tsx` — sticky filter offset updated to `top-16` to sit below new taller nav
- `Coaches/Index.tsx` — `.no-scrollbar` inline `<style>` tag removed (now uses app.css utility)

### Routes
```
GET  /   → HomeController@index
```

---

## [0.2.0] — 2026-03-07

### Added
- `PulseLayout.tsx` — sticky navigation bar with PULSE serif logo, auth-aware
  links (Prihlásiť sa / Registrovať for guests, Dashboard for logged-in users)
- `Coaches/Show.tsx` — full redesign of coach detail page:
  - Hero cover: 200px warm gradient (#c4714a → #5a3e2b)
  - Avatar 120px overlapping the cover (translate-y-1/2)
  - Subscription box with price, 3 benefit items, CTA button, "Zruš kedykoľvek"
  - Post cards with type badge (🎬 Video / 📸 Foto / 📝 Článok)
  - Video posts: 16:9 dark thumbnail, play button ▶, duration badge
  - Exclusive locked posts: blur/dark overlay with 🔒
  - Slovak date formatting via `Intl.DateTimeFormat('sk-SK')`
- `Coaches/Index.tsx` — content type indicators on coach cards (🎬 2 videí · 📸 1 fotiek)
- `posts` table: `media_type` (none/image/video), `thumbnail_path`, `video_duration` columns
- CoachSeeder: 3 posts per coach — 1 article (free) + 1 video (free) + 1 video (exclusive)

### Changed
- `CoachController@index` uses `withCount` for `video_count` and `image_count`
- `CoachController@show` passes `media_type`, `video_duration`, `thumbnail_path` to frontend
- Filter bar `top` offset updated to `57px` to sit below sticky nav
- Back button on Show page moved inside hero cover

---

## [0.1.0] — 2026-03-07

### Added
- Laravel 11 + Breeze (React + TypeScript) + Inertia.js scaffold
- PostgreSQL database `pulse_db` with full schema:
  - `users` (Billable — Laravel Cashier)
  - `coaches` (bio, specialization, monthly_price, avatar_path, is_verified, rating, subscriber_count)
  - `posts` (title, content, media_path, is_exclusive)
  - `tips` (fan_id, coach_id, amount, stripe_payment_id)
  - `messages` (sender_id, receiver_id, content, price_paid, is_paid)
  - Cashier tables: subscriptions, subscription_items
- Eloquent models with full relationships (User, Coach, Post, Tip, Message)
- `CoachController` — index, show, edit, update (with avatar upload)
- `Coaches/Index.tsx` — coach grid with:
  - Warm cream hero with serif Slovak title
  - Sticky category filter bar with emoji labels and scroll-fade hint
  - Client-side keyword filtering (stem matching for Slovak declensions)
  - 2-col mobile / 3-col desktop grid
  - Round avatar, specialization badge, rating, subscriber count, price, CTA
- `Coaches/Show.tsx` — coach profile with subscription box and post feed
- `Coaches/Edit.tsx` — authenticated form: bio, specialization, price, avatar upload
- `CoachSeeder` — 6 verified Slovak coaches (one per category):
  - Tomáš Kováč — 💪 Silový tréning, €12.99, ⭐4.8, 342 sledovateľov
  - Lucia Horáková — 🥗 Výživa, €7.99, ⭐4.9, 891 sledovateľov
  - Marek Blaho — 💪 CrossFit & Silový, €14.99, ⭐4.6, 156 sledovateľov
  - Zuzana Procházková — 🧘 Joga, €9.99, ⭐5.0, 674 sledovateľov
  - Peter Horváth — 🏃 Beh, €8.99, ⭐4.7, 289 sledovateľov
  - Katarína Molnárová — 🌿 Wellness, €11.99, ⭐4.9, 512 sledovateľov
  - Avatary stiahnuté z randomuser.me, seeder je idempotentný
- Nginx production config + systemd queue worker (`deployment/`)
- Storage symlink (`public/storage → storage/app/public`)
- AI memory system (AI_MEMORY.md + git post-commit hook)

### Routes
```
GET  /coaches           → CoachController@index
GET  /coaches/{coach}   → CoachController@show
GET  /dashboard/profile → CoachController@edit   (auth)
PUT  /dashboard/profile → CoachController@update (auth)
```

---

## [0.0.1] — 2026-03-07

### Added
- Initial Laravel project setup
- Git repository, .gitignore
- AI_MEMORY.md + git post-commit hook for automatic logging
