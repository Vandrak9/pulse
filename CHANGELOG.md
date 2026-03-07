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
