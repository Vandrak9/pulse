# PULSE — Fitness Creator Platform

## What is PULSE?

PULSE is a fitness creator monetization platform targeting the Slovak (SK) and Czech (CZ) markets. It enables fitness coaches and personal trainers to sell workout plans, training programs, and online coaching services directly to their clients. The platform handles payments, content delivery, and client management so coaches can focus on creating content.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Laravel 11 |
| Frontend | React 18 + TypeScript (via Inertia.js) |
| SSR bridge | Inertia.js (inertiajs/inertia-laravel) |
| Database | PostgreSQL |
| Cache | Redis (predis/predis) |
| Queue | Redis |
| Payments | Stripe + Laravel Cashier (laravel/cashier) |
| Auth scaffolding | Laravel Breeze |
| Sessions | Database |
| File storage | Local (S3 planned) |

---

## Architecture Decisions

### Stateless Application
- Sessions stored in the database, not files — supports horizontal scaling behind a load balancer.
- No in-memory state; all state lives in PostgreSQL or Redis.

### Queue-Driven Jobs
- All async work (email notifications, Stripe webhook processing, video processing, PDF generation) runs through Redis queues via Laravel's job system.
- Prevents slow HTTP responses and improves resilience.

### Inertia.js (no separate API)
- Single Laravel app serves both backend logic and React frontend via Inertia.
- No need for a separate REST/GraphQL API for the frontend — simplifies auth, validation, and data sharing.
- If a public API is needed in future, it can be added as separate API routes.

### Scalability
- Redis for cache and queues allows easy horizontal scaling.
- File storage abstracted via Laravel's Filesystem (local now, S3 later — change `FILESYSTEM_DISK=s3`).
- PostgreSQL chosen over MySQL for better support of JSON columns, full-text search, and future analytics queries.

---

## Database Schema Overview

### Users (`users`)
- Single user table for all roles (coach, client, admin).
- Role determined by `role` enum: `coach`, `client`, `admin`.
- Coaches have a linked Stripe Connect account (`stripe_connect_id`).
- Clients are billed via Stripe Cashier (`stripe_id`, `trial_ends_at`, etc.).

### Programs (`programs`)
- Created by coaches.
- Fields: `title`, `description`, `price`, `currency` (CZK/EUR), `coach_id`, `published_at`.
- A program contains many `workouts`.

### Workouts (`workouts`)
- Belong to a `program`.
- Fields: `title`, `description`, `week`, `day`, `video_url`, `pdf_url`.

### Subscriptions / Purchases (`subscriptions`, `orders`)
- `subscriptions` — managed by Laravel Cashier for recurring plans.
- `orders` — one-time program purchases.
- Both reference `user_id` (client) and `program_id`.

### Payouts (`payouts`)
- Records of funds transferred to coaches via Stripe Connect.
- Fields: `coach_id`, `amount`, `stripe_transfer_id`, `status`, `paid_at`.

---

## Key Business Rules

### Revenue Split
- **85% to coach** — transferred via Stripe Connect after successful purchase.
- **15% to PULSE platform** — retained as application fee on Stripe.
- This is enforced at the Stripe payment level using `application_fee_amount` on Payment Intents.

### Stripe Connect
- Every coach must complete Stripe Connect onboarding before publishing programs.
- Payments are made directly to the coach's connected Stripe account.
- PULSE collects the platform fee automatically — no manual payouts needed.

### Currencies
- Primary currencies: **EUR** (SK) and **CZK** (CZ).
- All amounts stored in the smallest currency unit (cents/haléře) as integers.

### Content Access
- Clients gain access to program content only after confirmed payment.
- Access is revoked if a subscription lapses (for subscription-based programs).

### Coach Approval
- New coach accounts require admin approval before they can publish programs.
- Status tracked via `coaches.status` enum: `pending`, `approved`, `suspended`.
