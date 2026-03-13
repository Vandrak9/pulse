<?php

use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\StripeConnectController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\LiveStreamController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\MediaStreamController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Support\Facades\Route;

// ── Stripe webhook (no CSRF, no auth — verified via Stripe-Signature header) ───
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handle'])
    ->name('stripe.webhook');

// ── Public routes ──────────────────────────────────────────────────────────────

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/coaches', [CoachController::class, 'index'])->name('coaches.index');
Route::get('/coaches/search', [CoachController::class, 'search'])->name('coaches.search');
Route::get('/coaches/{coachId}/reviews', [ReviewController::class, 'index'])->name('reviews.index');
Route::get('/coaches/{coach}', [CoachController::class, 'show'])->name('coaches.show');

// Feed — accessible without auth (guest preview)
Route::get('/feed', [FeedController::class, 'index'])->name('feed');

// Legal pages
Route::get('/legal/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('/legal/terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('/legal/gdpr', [LegalController::class, 'gdpr'])->name('legal.gdpr');
Route::get('/legal/cookies', [LegalController::class, 'cookies'])->name('legal.cookies');

// ── Authenticated routes ───────────────────────────────────────────────────────

Route::middleware('auth')->group(function () {
    // Coach dashboard
    Route::get('/dashboard/earnings', [DashboardController::class, 'earnings'])->name('dashboard.earnings');
    Route::get('/dashboard/subscribers', [DashboardController::class, 'subscribers'])->name('dashboard.subscribers');
    Route::get('/dashboard/followers', [DashboardController::class, 'followers'])->name('dashboard.followers');

    Route::get('/dashboard/profile', [CoachController::class, 'edit'])->name('dashboard.profile.edit');
    Route::put('/dashboard/profile', [CoachController::class, 'update'])->name('dashboard.profile.update');

    Route::post('/feed/like/{post}', [FeedController::class, 'like'])
        ->middleware('throttle:likes')
        ->name('feed.like');

    Route::get('/feed/posts/{post}/comments', [CommentController::class, 'index'])->name('comments.index');
    Route::post('/feed/posts/{post}/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::delete('/feed/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Messages — text send: throttle:messages; media upload: throttle:uploads
    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::get('/messages/{userId}', [MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{userId}', [MessageController::class, 'store'])
        ->middleware('throttle:messages')
        ->name('messages.store');
    Route::get('/api/messages/unread-count', [MessageController::class, 'unreadCount'])->name('messages.unread');
    Route::get('/api/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread');

    // Media streaming
    Route::get('/media/message/{message}', [MediaStreamController::class, 'stream'])->name('media.message');

    // Post creation (coach only — enforced in controller)
    Route::get('/dashboard/posts/create', [PostController::class, 'create'])->name('posts.create');
    Route::post('/dashboard/posts', [PostController::class, 'store'])->name('posts.store');
    Route::delete('/dashboard/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::get('/dashboard/reels/create', [PostController::class, 'createReel'])->name('reels.create');
    Route::post('/dashboard/reels', [PostController::class, 'storeReel'])->name('reels.store');

    // Broadcast (coach only — enforced in controller)
    Route::get('/dashboard/broadcast', [BroadcastController::class, 'index'])->name('broadcast.index');
    Route::post('/dashboard/broadcast', [BroadcastController::class, 'store'])
        ->middleware('throttle:broadcasts')
        ->name('broadcast.store');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markOneRead'])->name('notifications.read-one');

    // Social profiles
    Route::get('/profile/me', [UserProfileController::class, 'me'])->name('profile.me');
    Route::get('/profile/subscriptions', [UserProfileController::class, 'mySubscriptions'])->name('profile.subscriptions');
    Route::get('/profile/{userId}', [UserProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/update', [UserProfileController::class, 'update'])->name('profile.update-social');

    // Follow / unfollow
    Route::post('/follow/{userId}', [FollowController::class, 'toggle'])->name('follow.toggle');

    // Reviews
    Route::post('/coaches/{coachId}/reviews', [ReviewController::class, 'store'])->name('reviews.store');
    Route::delete('/coaches/{coachId}/reviews', [ReviewController::class, 'destroy'])->name('reviews.destroy');

    // Live streaming
    Route::get('/dashboard/live', [LiveStreamController::class, 'index'])->name('live.index');
    Route::post('/dashboard/live', [LiveStreamController::class, 'store'])->name('live.store');
    Route::delete('/dashboard/live/{id}', [LiveStreamController::class, 'destroy'])->name('live.destroy');
    Route::post('/dashboard/live/{streamId}/whip', [LiveStreamController::class, 'whipProxy'])->name('live.whip');
    Route::get('/live/{coachId}', [LiveStreamController::class, 'watch'])->name('live.watch');
    Route::post('/live/{streamId}/message', [LiveStreamController::class, 'sendMessage'])->name('live.message');
    Route::get('/live/{streamId}/poll', [LiveStreamController::class, 'poll'])->name('live.poll');
    Route::post('/live/{streamId}/join', [LiveStreamController::class, 'join'])->name('live.join');
    Route::post('/live/{streamId}/leave', [LiveStreamController::class, 'leave'])->name('live.leave');

    // Subscriptions
    Route::get('/subscribe/{coachId}', [SubscriptionController::class, 'checkout'])->name('subscription.checkout');
    Route::get('/subscription/success', [SubscriptionController::class, 'success'])->name('subscription.success');
    Route::post('/subscription/cancel/{coachId}', [SubscriptionController::class, 'cancel'])->name('subscription.cancel');

    // Stripe Connect — coach payout account onboarding
    Route::get('/stripe/connect/onboard', [StripeConnectController::class, 'onboard'])->name('stripe.connect.onboard');
    Route::get('/stripe/connect/callback', [StripeConnectController::class, 'callback'])->name('stripe.connect.callback');
    Route::get('/stripe/connect/dashboard', [StripeConnectController::class, 'expressDashboard'])->name('stripe.connect.dashboard');
});

// ── Post detail API (auth optional) ───────────────────────────────────────────
Route::get('/api/posts/{post}', [FeedController::class, 'show'])->name('posts.show');

// ── Public API endpoints ───────────────────────────────────────────────────────

Route::get('/api/coaches/suggested', function () {
    $coaches = \App\Models\Coach::with('user')
        ->orderByDesc('subscriber_count')
        ->limit(4)
        ->get()
        ->map(fn ($c) => [
            'id'             => $c->id,
            'name'           => $c->user->name,
            'specialization' => $c->specialization,
            'rating_avg'     => (float) $c->rating_avg,
            'rating_count'   => (int) $c->rating_count,
            'avatar_url'     => $c->avatar_path
                ? \Illuminate\Support\Facades\Storage::url($c->avatar_path)
                : null,
            'is_online'      => $c->user->last_seen_at?->gt(now()->subMinutes(5)) ?? false,
        ]);
    return response()->json($coaches);
});

require __DIR__.'/auth.php';
