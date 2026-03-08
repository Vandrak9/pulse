<?php

use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CoachController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MediaStreamController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Support\Facades\Route;

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
Route::get('/coaches/{coach}', [CoachController::class, 'show'])->name('coaches.show');

// ── Authenticated routes ───────────────────────────────────────────────────────

Route::middleware('auth')->group(function () {
    // Coach dashboard
    Route::get('/dashboard/earnings', [DashboardController::class, 'earnings'])->name('dashboard.earnings');
    Route::get('/dashboard/subscribers', [DashboardController::class, 'subscribers'])->name('dashboard.subscribers');

    Route::get('/dashboard/profile', [CoachController::class, 'edit'])->name('dashboard.profile.edit');
    Route::put('/dashboard/profile', [CoachController::class, 'update'])->name('dashboard.profile.update');

    Route::get('/feed', [FeedController::class, 'index'])->name('feed');
    Route::post('/feed/like/{post}', [FeedController::class, 'like'])
        ->middleware('throttle:likes')
        ->name('feed.like');

    // Messages — text send: throttle:messages; media upload: throttle:uploads
    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::get('/messages/{userId}', [MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{userId}', [MessageController::class, 'store'])
        ->middleware('throttle:messages')
        ->name('messages.store');
    Route::get('/api/messages/unread-count', [MessageController::class, 'unreadCount'])->name('messages.unread');

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
});

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
            'avatar_url'     => $c->avatar_path
                ? \Illuminate\Support\Facades\Storage::url($c->avatar_path)
                : null,
        ]);
    return response()->json($coaches);
});

require __DIR__.'/auth.php';
