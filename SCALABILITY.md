# PULSE Scalability Assessment

_Last updated: 2026-03-08_

---

## Current State (1 VPS — 96 GB disk, shared CPU)

| Resource | Current | Capacity estimate |
|---|---|---|
| Disk | 4.5 GB used / 96 GB total | ~92 GB free |
| Storage (uploads) | 33 MB | ~50 GB media before disk pressure |
| Database | PostgreSQL (local) | ~500 concurrent connections |
| Cache/Queue | Redis (local) | ~10k ops/sec |
| Web server | nginx + PHP 8.3 FPM | ~200-300 concurrent requests |
| Monthly cost | ~€10-20 VPS | — |

**Estimated capacity: ~200-500 concurrent users on current VPS.**

---

## Ready for Scale ✅

### Architecture
- **Sessions in database** — stateless web tier, can add more web servers without session stickiness issues
- **Cache in Redis** — can be extracted to a separate Redis instance (change `REDIS_HOST` in .env)
- **Queue in Redis** — workers can be scaled horizontally (run multiple `php artisan queue:work` processes)
- **File storage abstracted** via Laravel Filesystem — swap to S3/R2 by changing `FILESYSTEM_DISK=s3`
- **PostgreSQL** — supports read replicas, connection pooling (PgBouncer), partitioning

### Code quality
- All queue jobs use `chunk(50)` for batch inserts — prevents memory exhaustion on large fanouts
- N+1 queries fixed with eager loading (`with('user')`, `withCount(...)`)
- DB indexes on all high-traffic query patterns (messages, posts, follows, notifications)
- Rate limiting on all sensitive routes (messages, uploads, likes, broadcasts)
- Zero debug statements (`dd()`, `var_dump()`, `console.log`) in production code

### Security
- HTTPS (Let's Encrypt, auto-renews until 2026-06-06)
- CSRF on all forms
- Server-side MIME validation on uploads
- Role-based access control enforced server-side

---

## Needs Work Before Scale ⚠️

| Issue | Impact | Fix |
|---|---|---|
| **Local file storage** | Files lost if VPS fails, can't serve from CDN, can't scale to multiple web servers | Migrate to S3/R2 (`FILESYSTEM_DISK=s3`) |
| **No DB connection pooling** | PostgreSQL has ~100 default max connections; PHP FPM processes each hold a connection | Add PgBouncer in transaction pooling mode |
| **Single queue worker** | If worker crashes, jobs queue up silently | Add systemd restart policy (`Restart=always`) or use Laravel Horizon |
| **No CDN for assets** | All JS/CSS served from VPS; high latency for non-EU users | Add Cloudflare (free tier) in front of the app |
| **`isSubscribed` hardcoded `false`** | Paywall doesn't actually work; exclusive content is blurred but not gated | Implement real Stripe subscription check |
| **subscriber_count not updated** | Dashboard shows 0 subscribers for real coaches | Update on Stripe webhook (customer.subscription.created/deleted) |
| **No image compression** | Users upload raw phone photos (10+ MB each) | Add client-side compression (browser-image-compression library) or server-side (Intervention Image) |
| **Polling every 5s in chat** | Each open chat tab = 1 request/5s per user; 100 users = 20 req/s waste | Replace with WebSockets (Laravel Reverb) or SSE |
| **Unread count polling every 30s** | All logged-in users poll every 30s | Same — use WebSockets |
| **No queue monitoring** | Failed jobs go unnoticed | Add Laravel Horizon or set up failed_jobs email alert |
| **No application monitoring** | Errors go unnoticed | Add Sentry (free tier) |

---

## Scale Roadmap

### Phase 1 — 100–500 users (MVP, current VPS)

1. **Cloudflare** — free CDN, DDoS protection, asset caching → reduces VPS load ~40%
2. **S3/R2 file storage** — Cloudflare R2 is free up to 10 GB; change `.env` `FILESYSTEM_DISK=s3`
3. **Implement Stripe subscriptions** — real `isSubscribed` check, webhook-driven `subscriber_count`
4. **Queue worker with auto-restart** — add `Restart=always` to systemd service
5. **Image compression** — add `browser-image-compression` on frontend for photo uploads
6. **Laravel Horizon** — replace bare queue worker for monitoring, retries, metrics

### Phase 2 — 500–5,000 users

1. **Separate database server** — move PostgreSQL to a dedicated VM (2-4 vCPU, 4-8 GB RAM)
2. **PgBouncer** — connection pooling in front of PostgreSQL, allow 10x more app connections
3. **Redis Sentinel or Cluster** — high-availability Redis (prevents queue loss if Redis restarts)
4. **WebSockets (Laravel Reverb)** — replace 5s polling in chat, saves ~90% of chat HTTP requests
5. **Multiple queue workers** — run 3-5 workers; separate `notifications` and `default` queues
6. **Read replica** — add PostgreSQL read replica for analytics/dashboard queries
7. **Sentry** — error monitoring, performance traces

### Phase 3 — 5,000+ users

1. **Kubernetes or managed hosting** — horizontal scaling of web tier (multiple app containers)
2. **CDN for user media** — serve uploads from S3 + CloudFront/Cloudflare CDN (not from app server)
3. **Elasticsearch** — full-text search for coaches, posts, messages
4. **Separate media processing service** — video transcoding, thumbnail generation as async jobs
5. **Multi-region** — deploy in SK/CZ region (Frankfurt) for low latency target market
6. **Database sharding** — messages table is the highest-growth table; shard by user_id range

---

## DB Index Coverage (current)

All critical query patterns are indexed:

| Table | Indexed columns | Query pattern |
|---|---|---|
| `messages` | (sender_id, receiver_id), is_read, created_at | Conversation fetch, unread count |
| `posts` | (coach_id, created_at), is_exclusive | Feed queries |
| `follows` | (follower_id, following_id), following_id | Follow check, follower list |
| `notifications` | (user_id, is_read) | Unread notification count |
| `coaches` | monthly_price, is_verified | Coach directory sort/filter |
| `subscriptions` | (user_id, stripe_status) | Subscription check |
| `sessions` | user_id, last_activity | Session cleanup |

---

## Current .env Scalability Settings

```
SESSION_DRIVER=database   ✅ stateless-ready
CACHE_STORE=redis         ✅ Redis cache
QUEUE_CONNECTION=redis    ✅ Redis queue
FILESYSTEM_DISK=public    ⚠️  local storage — migrate to S3
```
