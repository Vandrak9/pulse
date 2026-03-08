# PULSE — Fitness Creator Platform

[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)

## O projekte

PULSE je fitness subscription platforma pre slovenský a český trh.
Kouči zdieľajú exkluzívny obsah (posty, videá, reels), fanúšikovia sa predplácajú.
Model podobný OnlyFans, ale výlučne pre fitness a wellness.

**Biznis model:**
- Fanúšikovia platia mesačné predplatné konkrétnemu koučovi
- Kouč dostáva **85 %** každej platby, PULSE si ponecháva **15 %** cez Stripe `application_fee`
- Exkluzívny obsah prístupný len predplatiteľom, reels zadarmo pre všetkých

**Live:** [pulsehub.fun](https://pulsehub.fun)

---

## Tech Stack

| Vrstva | Technológia | Verzia |
|--------|-------------|--------|
| Backend | Laravel | 11 (v11.48.0) |
| Frontend | React + TypeScript | 18, cez Inertia.js |
| Auth | Laravel Breeze | v2.3.8 |
| Databáza | PostgreSQL | 16 |
| Cache / Queue | Redis (predis) | v3.4.1 |
| Platby | Stripe + Laravel Cashier | v16.3 |
| File storage | Local → S3 (plánované) | — |
| Node.js | v18 | npm 9, Vite 6, Tailwind 3 |
| PHP | 8.3 FPM | — |

Žiadne separátne API — všetko cez Inertia.js (jedna Laravel app).

---

## Požiadavky

- PHP 8.3+ s rozšíreniami: `pdo_pgsql`, `redis`, `gd`, `mbstring`, `xml`, `zip`
- Node.js 18+ a npm 9+
- PostgreSQL 15+
- Redis 7+
- Composer 2+

---

## Inštalácia (lokálne)

### 1. Klonovanie

```bash
git clone https://github.com/[REPO]/pulse.git
cd pulse
```

### 2. PHP závislosti

```bash
composer install
```

### 3. JS závislosti

```bash
npm install
```

### 4. Environment

```bash
cp .env.example .env
php artisan key:generate
```

Vyplň `.env` — minimálne:
- `DB_*` — PostgreSQL pripojenie
- `REDIS_*` — Redis pripojenie
- `STRIPE_KEY`, `STRIPE_SECRET` — testové kľúče z [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys)
- `PEXELS_API_KEY` — voliteľné, len pre seeder s reálnym obsahom

### 5. Databáza

```bash
# Vytvor PostgreSQL databázu
createdb pulse

# Migrácie
php artisan migrate

# Seed s testovacími dátami (11 koučov, fanúšikovia, obsah)
php artisan db:seed
```

### 6. Storage

```bash
php artisan storage:link
```

### 7. Spustenie

```bash
# V 3 samostatných termináloch:
php artisan serve       # Laravel dev server → http://localhost:8000
npm run dev             # Vite HMR
php artisan queue:work  # Queue worker pre notifikácie a jobs
```

---

## Testovacie účty (po `db:seed`)

| Email | Heslo | Rola |
|-------|-------|------|
| tomas.kovac@pulse.sk | password | Kouč |
| lucia.horakova@pulse.sk | password | Kouč |
| fan@pulse.sk | password | Fanúšik |
| dominik@haluza.sk | password | Kouč |

## Stripe testové platby

```
Karta:  4242 4242 4242 4242
Dátum:  12/29
CVC:    123
```

---

## Architektúra

### Backend (`app/`)

```
Http/Controllers/
  CoachController.php         ← profily koučov (index / show / edit / update / search)
  FeedController.php          ← feed príspevkov + like
  MessageController.php       ← DM chat (fan ↔ kouč) + unread count
  ReviewController.php        ← hodnotenia koučov (len predplatitelia)
  SubscriptionController.php  ← Stripe Checkout flow (checkout / success / cancel)
  DashboardController.php     ← kouč dashboard (príjmy, predplatitelia, analytics)
  PostController.php          ← tvorba obsahu (posty, reels, destroy)
  BroadcastController.php     ← hromadné správy koučov predplatiteľom
  NotificationController.php  ← notifikácie (index / markRead / markAllRead)
  FollowController.php        ← follow / unfollow toggle
  UserProfileController.php   ← verejné profily, predplatné, nastavenia
  LegalController.php         ← GDPR, VOP, Cookies, Privacy stránky

Models/
  User.php     ← Billable (Cashier), role: fan|coach
  Coach.php    ← profil kouča, stripe_price_id, rating_avg, rating_count
  Post.php     ← príspevok s média, is_exclusive, video_type
  Review.php   ← hodnotenie (1-5 hviezdičiek), unique per user+coach
  Message.php  ← správa (text/image/video/voice), is_read, is_broadcast
  Tip.php      ← jednorazový tip (stripe_payment_id)

Jobs/
  SendPostNotificationsJob.php   ← notifikácie fanúšikom po publikovaní postu
  SendBroadcastJob.php           ← hromadné správy v chunkoch po 50

Services/
  PexelsService.php  ← fetchovanie real fitness obsahu pre ContentSeeder
```

### Frontend (`resources/js/`)

```
Layouts/
  PulseLayout.tsx        ← hlavný layout (ľavý sidebar nav, pravý sidebar, mobile nav)

Pages/
  Home.tsx               ← landing page (hero, featured coaches, kategórie)
  Feed.tsx               ← OnlyFans-style feed (posty, reels, videá) + guest preview
  Coaches/
    Index.tsx            ← grid koučov so sticky kategóriami a follow tlačidlami
    Show.tsx             ← profil kouča (5 tabov: Všetko/Reels/Videá/Fotky/Recenzie)
    Edit.tsx             ← editácia profilu kouča
  Dashboard/
    Index.tsx            ← overview (príjmy, bar chart, recenzie, aktivita)
    Earnings.tsx         ← mesačné zárobky s tabuľkou transakcií
    Subscribers.tsx      ← anonymizovaný zoznam predplatiteľov
    Posts/Create.tsx     ← tvorba postu (foto tab / video tab, exclusive toggle)
    Reels/Create.tsx     ← tvorba reelu (9:16 upload, preview)
  Messages/
    Index.tsx            ← WhatsApp Web layout (zoznam + panel)
    Show.tsx             ← chat UI (5s polling, read receipts ✓✓, média)
  Subscription/
    Success.tsx          ← konfetti stránka po úspešnej platbe
  Profile/Show.tsx       ← profil (Predplatné / Sledujem / Lajky / Nastavenia)
  Notifications/Index.tsx ← zoznam notifikácií s ikonami podľa typu
  Auth/Login.tsx         ← split layout (form + motivačný panel)
  Auth/Register.tsx      ← výber roly fan/coach + split layout
  Legal/                 ← Privacy, Terms, GDPR, Cookies (slovenčina)

Components/
  Avatar.tsx             ← kruhový avatar s initials fallback
  VideoModal.tsx         ← fullscreen HTML5 video player

lib/utils.ts             ← getInitials, formatDuration, relativeTime, formatFullDate, ...
```

### Kľúčové súbory

| Súbor | Popis |
|-------|-------|
| `routes/web.php` | Všetky routes (verejné + auth + API endpointy) |
| `AI_MEMORY.md` | Kompletná história vývoja, DB schéma, rozhodnutia |
| `CONTRIBUTING.md` | Git workflow, štandardy, code review checklist |

---

## Databázová schéma (prehľad)

```
users           id, name, email, role(fan|coach), + Cashier stĺpce
coaches         id, user_id, bio, specialization, monthly_price,
                stripe_product_id, stripe_price_id, rating_avg, rating_count,
                subscriber_count, messages_access
posts           id, coach_id, title, content, media_type(none|image|video),
                video_type(reel|video|null), is_exclusive, video_duration
reviews         id, user_id, coach_id, rating(1-5), content, is_visible
messages        id, sender_id, receiver_id, content, message_type,
                media_path, is_read, is_broadcast
subscriptions   id, user_id, coach_id, stripe_id, stripe_status   ← Cashier
notifications   id, user_id, type, title, body, data(json), is_read
follows         follower_id, following_id
post_likes      user_id, post_id
```

Kompletná schéma so všetkými stĺpcami: `AI_MEMORY.md`

---

## Spustenie testov

```bash
php artisan test

# Konkrétna trieda:
php artisan test --filter SubscriptionTest

# So stop-on-failure:
php artisan test --stop-on-failure
```

---

## Deployment (produkcia)

Server: Ubuntu VPS, nginx + PHP 8.3 FPM

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo systemctl restart pulse-queue
```

---

## Git Workflow

Pozri [CONTRIBUTING.md](CONTRIBUTING.md)

---

*PULSE — Poháňané vášňou pre fitness. Postavené na Laravel + React.*
