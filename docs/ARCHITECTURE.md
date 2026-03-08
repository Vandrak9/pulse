# PULSE — Architektúra

## Tech Stack

| Vrstva | Technológia | Verzia |
|--------|-------------|--------|
| Backend | Laravel | 11 (PHP 8.3) |
| Frontend | React + TypeScript | 18 (cez Inertia.js) |
| Bridge | Inertia.js | ^2.0 |
| Databáza | PostgreSQL | 16 |
| Cache/Queue | Redis | 7 (predis) |
| Build tool | Vite | 6 |
| CSS | Tailwind CSS | 3 |
| Platby | Stripe + Laravel Cashier | v16.3 |
| Storage | Local (`public` disk) → S3 plánované | — |
| Server | Nginx + PHP-FPM | — |

## Databázová schéma

### Hlavné tabuľky

| Tabuľka | Popis |
|---------|-------|
| `users` | Všetci používatelia (fan aj kouč). Role: `fan` \| `coach` |
| `coaches` | Rozšírený profil kouča (1:1 s users) |
| `posts` | Obsah koučov (články, videá, reels) |
| `subscriptions` | Predplatné fanúšikov — spravuje Laravel Cashier |
| `follows` | Sledovanie koučov (M:N users ↔ users) |
| `messages` | DM správy medzi používateľmi |
| `notifications` | Systémové notifikácie (custom schema, nie Laravel built-in) |
| `reviews` | Hodnotenia koučov od predplatiteľov (1-5 hviezd) |
| `post_likes` | Lajky na príspevky (M:N users ↔ posts) |

### Vzťahy

```
User (1) → (0..1) Coach
Coach (1) → (N) Post
Coach (1) → (N) Review
User (N) ↔ (N) User  [follows tabuľka]
User (N) ↔ (N) Coach [subscriptions tabuľka]
User (1) → (N) Message [sender_id]
User (1) → (N) Notification
```

### Dôležité poznámky

- `notifications` tabuľka používa **custom schéma**: `user_id, type, title, body, data, is_read` — **nie** Laravel polymorphic (`notifiable_type/notifiable_id`)
- Vždy wrapnúť notification inserty do `try/catch`
- Subscription check: `DB::table('subscriptions')->whereIn('stripe_status', ['active','trialing'])` — **nie** Cashier `subscribed()`
- Amounts v centoch (integer), resp. `decimal(10,2)` pre `monthly_price`

## Request flow

```
Browser → Nginx (SSL termination)
       → PHP-FPM → Laravel Router
       → Middleware (auth, throttle, verified)
       → Controller
       → Model / DB Query (PostgreSQL)
       → Inertia::render() → React hydration
         alebo response()->json() → axios
```

## Queue jobs

| Job | Popis |
|-----|-------|
| `SendBroadcastJob` | Hromadné správy kouča predplatiteľom (chunky po 50) |
| `SendPostNotificationsJob` | Notifikácie fanúšikom po novom príspevku |

Queue worker: `systemd pulse-queue.service` (Redis backend)

## Kľúčové architektonické rozhodnutia

| Rozhodnutie | Dôvod |
|-------------|-------|
| Inertia.js namiesto REST API | Eliminuje duplicitu typov, jednoduchšia auth |
| PostgreSQL namiesto MySQL | JSON stĺpce, full-text search, lepšia analytika |
| Redis pre sessions aj queue | Konzistentné škálovanie, bez sticky sessions |
| Custom notifications tabuľka | Jednoduchšia schéma, priame `user_id` lookup |
| Brand farby ako inline styles | Tailwind purge môže odstrániť dynamické triedy |
| `pulse_test` DB pre testy | `RefreshDatabase` nemaže produkčnú `pulse_db` |

## Stripe platobný flow

```
Fan → GET /subscribe/{coachId}
    → SubscriptionController::checkout()
    → Stripe Checkout Session (hosted page)
    → Stripe redirect → GET /subscription/success
    → SubscriptionController::success()
    → DB: subscriptions upsert + subscriber_count++
    → Inertia render Success.tsx
```

Revenue split: **85% kouč / 15% PULSE** (Stripe `application_fee_amount`)

## Brand design systém

```
#c4714a  — terracotta (primárna, CTA buttony)
#5a3e2b  — tmavá terracotta (hover)
#4a7c59  — zelená (success, verified)
#faf6f0  — cream (page background)
#2d2118  — tmavá hnedá (hlavný text)
#9a8a7a  — muted (sekundárny text)
#e8d9c4  — border farba
```

Pravidlo: brand farby **vždy** ako `inline styles`, nikdy Tailwind utility triedy.
