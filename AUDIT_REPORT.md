# PULSE Platform — Full Code Audit Report

**Date:** 2026-03-08
**Auditor:** Claude Sonnet 4.6
**Codebase:** `/opt/pulse` — Laravel 11 + React 18 + TypeScript + Inertia.js
**Overall Health Score: 6.5 / 10**

---

## CRITICAL ISSUES (fix immediately — security/bugs)

### C1. No rate limiting on file upload + message routes
**Risk:** DoS / spam attack — any authenticated user can flood the server with uploads.
**Location:** `routes/web.php`
**Fix:**
```php
Route::post('/messages/{userId}', ...)->middleware(['auth', 'throttle:30,1']);
Route::post('/dashboard/broadcast', ...)->middleware(['auth', 'throttle:5,1']);
Route::post('/feed/like/{post}', ...)->middleware(['auth', 'throttle:60,1']);
```
**Estimate:** 15 min

---

### C2. Client-side `message_type` trusted over server-side MIME detection
**Risk:** A malicious client can send `message_type=image` with an executable file, bypassing server categorization logic.
**Location:** `app/Http/Controllers/MessageController.php` line 159
**Context:** Added as iOS audio/mp4 workaround. The trust check runs before MIME validation.
**Fix:** Keep the iOS workaround but only allow override when MIME is `audio/*` or `video/*`:
```php
if ($clientType === 'voice' && (str_starts_with($mediaMime, 'audio/') || str_starts_with($mediaMime, 'video/'))) {
    $messageType = 'voice';
}
```
**Estimate:** 15 min

---

### C3. File size mismatch — client allows 100MB, server validates max 50MB
**Risk:** Camera photos being compressed client-side still hit Laravel's `max:51200` (50MB) validation before compression, causing spurious 422 errors.
**Location:** `MessageController.php` line 127 vs `Show.tsx` `MAX_SIZE_CAMERA = 100MB`
**Fix:** Bump server validation to `max:102400` (100MB) to match client. Server gets the _compressed_ file anyway.
**Estimate:** 5 min

---

### C4. N+1 query problem in `MessageController::index()`
**Risk:** With 50 conversation partners → ~150 DB queries per page load. Will cause serious slowdowns at scale.
**Location:** `app/Http/Controllers/MessageController.php` lines 18–57
**Current pattern:**
```php
foreach ($partnerIds as $partnerId) {
    $partner = User::find($partnerId);        // Query ×N
    $lastMessage = Message::where(...)->first(); // Query ×N
    $unreadCount = Message::where(...)->count(); // Query ×N
}
```
**Fix:** Batch queries outside the loop using `whereIn` + eager loading.
**Estimate:** 1 hour

---

### C5. BroadcastController — no coach role check
**Risk:** Any authenticated user (including fans) can send broadcasts.
**Location:** `app/Http/Controllers/BroadcastController.php` `store()`
**Fix:** Add at top of method:
```php
if (auth()->user()->role !== 'coach') abort(403);
```
**Estimate:** 5 min

---

## IMPORTANT ISSUES (UX/performance — fix soon)

### I1. Debug `console.log()` statements left in production
**Location:** `resources/js/Pages/Messages/Show.tsx`
- Line 294: `console.log('[compress] ...')` — image compression sizes
- Line 335: `console.log('[sendMedia] response:', res.data)` — full API response
- Line 363: `console.log('[media] file:', ...)` — file metadata

**Fix:** Remove all three. Keep compression stats in a `__DEV__` check if needed.
**Estimate:** 5 min

---

### I2. Debug `Log::info()` statements left in production controller
**Location:** `app/Http/Controllers/MessageController.php`
- Line 148: Logs MIME type, file size, original name, all request keys
- Line 179: Logs stored media path
- Line 206: Logs message details before response

**Fix:** Remove or move behind `app()->isLocal()` check. Log::info in production pollutes laravel.log.
**Estimate:** 5 min

---

### I3. Bell notification icon always shows red dot (was fixed in badge but not dot)
**Status:** Fixed in last commit — badge is now conditional. Verify the static `<span>` dot is fully removed.
**Location:** `resources/js/Layouts/PulseLayout.tsx`
**Estimate:** 5 min (verify only)

---

### I4. Duplicate avatar rendering across 6+ components
**Pattern repeated in:** `Feed.tsx` (×3), `Coaches/Index.tsx`, `Coaches/Show.tsx`, `Home.tsx`, `Messages/Index.tsx`, `Messages/Show.tsx`
```tsx
{avatar ? <img src={avatar} ... /> : <div style={{ background: '#c4714a' }}>{initials}</div>}
```
**Fix:** Extract to `resources/js/Components/Avatar.tsx`
**Estimate:** 30 min

---

### I5. Duplicate utility functions across components
| Function | Duplicated in |
|---|---|
| `getInitials()` | `Messages/Show.tsx`, `Messages/Index.tsx` |
| `formatDate()` | `Messages/Show.tsx`, `Coaches/Show.tsx`, `Broadcast.tsx` (slightly different implementations) |
| `formatDuration()` | `Feed.tsx`, `Coaches/Show.tsx` |

**Fix:** Create `resources/js/utils/format.ts` with shared exports.
**Estimate:** 30 min

---

### I6. `.env.example` incomplete
**Missing keys:**
- `PEXELS_API_KEY=` (required for ContentSeeder)
- `SESSION_SECURE_COOKIE=true` (required for production HTTPS)
- Stripe key documentation is blank with no comment explaining requirement

**Fix:** Update `.env.example` with all keys and comments.
**Estimate:** 10 min

---

### I7. Missing explicit database indexes on high-traffic columns
**PostgreSQL creates implicit indexes for FK constraints, but explicit composite indexes are missing:**
| Table | Missing Index | Used in query |
|---|---|---|
| `messages` | `(sender_id, receiver_id)` composite | Every conversation load |
| `messages` | `(receiver_id, is_read)` composite | Unread count query |
| `tips` | `sender_id`, `coach_id` | Future tip queries |
| `broadcast_recipients` | `broadcast_id`, `user_id` | Broadcast stats |

**Fix:** Add a new migration with these indexes.
**Estimate:** 20 min

---

### I8. TypeScript `any` type in error handler
**Location:** `resources/js/Pages/Messages/Show.tsx` line 341
```ts
} catch (err: any) {
```
**Fix:**
```ts
import type { AxiosError } from 'axios';
} catch (err) {
    const status = (err as AxiosError)?.response?.status;
```
**Estimate:** 5 min

---

### I9. Feed page runs 3 separate queries that could be 1
**Location:** `app/Http/Controllers/FeedController.php`
- Lines 16–44: Three separate `Post::with(['coach.user'])` queries (posts/reels/videos)

**Fix:** Single query with all posts, filter in PHP using `.filter()` — or use a single query with `whereIn` on `video_type`.
**Estimate:** 30 min

---

## NICE TO HAVE (improvements for later)

### N1. Magic numbers should be in config
**Locations:**
- `FeedController.php`: `.limit(20)`, `.limit(60)`, `.limit(40)`, `.limit(10)`
- `CoachController.php`: `.paginate(24)`
- `HomeController.php`: `.limit(4)`
- `MessageController.php`: `max:51200`

**Fix:** Add to `config/pulse.php`:
```php
'feed_limit' => 20,
'reels_limit' => 60,
'coach_page_size' => 24,
```
**Estimate:** 30 min

---

### N2. No Form Request classes — validation inline in controllers
All validation uses `$request->validate([...])` directly in controller methods. While functional, Form Requests improve testability and reusability.
**Affected:** `MessageController`, `CoachController`, `RegisteredUserController`
**Estimate:** 1 hour

---

### N3. Brand colors as CSS variables / Tailwind theme, not inline styles
Every component uses inline `style={{ color: '#c4714a' }}` etc. Rule in CLAUDE.md says "always inline styles" — but at this scale it creates maintenance burden.
**Alternative:** Keep inline where needed but add CSS variables in `app.css`:
```css
:root { --pulse-terracotta: #c4714a; --pulse-dark: #2d2118; }
```
**Estimate:** 1 hour

---

### N4. No loading spinners on Inertia page transitions
Inertia provides a global progress bar but no per-component loading states for the initial page load.
**Locations:** Feed.tsx, Coaches/Index.tsx — data is server-rendered so load is instant, but long DB queries could show blank pages.
**Estimate:** 30 min

---

### N5. `npm run build` warnings
Run `npm run build 2>&1 | grep -i warn` — check for any Vite/TypeScript warnings that should be cleaned up.

---

## MISSING FEATURES (UI exists, backend not built)

| Feature | Status | UI Location | Priority |
|---|---|---|---|
| Subscription checkout | ❌ Not built | `Coaches/Show.tsx` "Predplatiť teraz" button | HIGH |
| `isSubscribed` check | ❌ Hardcoded `false` | `CoachController::show()` | HIGH |
| Stripe Connect onboarding | ❌ Not built | Coach edit profile — no "Connect Stripe" flow | HIGH |
| Tip jar payment | ❌ Not built | No UI yet (model exists) | MEDIUM |
| Coach content upload | ❌ Not built | No create post form | MEDIUM |
| Fan profile page | ❌ Not built | `/profile` goes to Breeze placeholder | MEDIUM |
| Coach earnings dashboard | ❌ Not built | No route/page | MEDIUM |
| Admin panel | ❌ Not built | No route/page | LOW |
| Search functionality | ❌ Not built | Search bar in nav is decorative only | LOW |
| S3 file storage | ❌ Using local | `FILESYSTEM_DISK=public` | LOW |
| Email notifications | ❌ Not built | `MAIL_MAILER=log` in production | LOW |
| Push notifications (server) | ⚠️ Browser-only | Show.tsx uses `new Notification()` | LOW |

---

## SECURITY SUMMARY

| Check | Status | Notes |
|---|---|---|
| Auth middleware on protected routes | ✅ PASS | All routes properly protected |
| CSRF protection | ✅ PASS | Axios sends X-CSRF-TOKEN header |
| SQL injection | ✅ PASS | Eloquent ORM used throughout |
| XSS | ✅ PASS | React escapes all output by default |
| File MIME validation | ⚠️ PARTIAL | See C2 — client type trusted |
| Sensitive data in responses | ✅ PASS | `$hidden = ['password', 'remember_token']` |
| Rate limiting | ❌ FAIL | Missing on upload/message endpoints |
| File size limits | ⚠️ MISMATCH | Client 100MB vs server 50MB |
| Role-based access | ⚠️ PARTIAL | BroadcastController missing coach check |
| Media file access control | ✅ PASS | MediaStreamController validates ownership |

---

## BUNDLE SIZE REPORT

Last build output (`npm run build`):

| Chunk | Size (gzip) | Notes |
|---|---|---|
| `app.js` (vendor) | 113 KB | React + Inertia + Axios — acceptable |
| `Welcome.js` | 5.9 KB | Landing page |
| `Feed.js` | 4.3 KB | Feed page (complex, reasonable) |
| `Messages/Show.js` | 5.6 KB | Chat page |
| `DeleteUserForm.js` | 12 KB | Breeze — includes password confirmation logic |
| `transition.js` | 5.9 KB | Shared transition utilities |
| Total | ~150 KB gzip | Acceptable for this app size |

No oversized bundles or unused large library imports detected.

---

## ESTIMATED FIX TIME

| Priority | Issues | Total Time |
|---|---|---|
| Critical (C1–C5) | 5 issues | ~2 hours |
| Important (I1–I9) | 9 issues | ~3 hours |
| Nice to have (N1–N5) | 5 items | ~3.5 hours |
| Missing features | 11 items | ~40+ hours |

**Quick wins (< 10 min each):** C2, C3, C5, I1, I2, I3, I8 — fixes 7 issues in under 1 hour.

---

*Generated by Claude Code audit — 2026-03-08*
