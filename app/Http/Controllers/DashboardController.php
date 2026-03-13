<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Review;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /** Abort with 403 if user is not a coach with a coach profile. */
    private function requireCoach(): \App\Models\Coach|\Illuminate\Http\RedirectResponse
    {
        $user = auth()->user();
        if ($user->role !== 'coach') abort(403, 'Prístup len pre koučov.');
        $coach = $user->coach;
        if (!$coach) return redirect('/dashboard/profile');
        return $coach;
    }

    // ── Overview ──────────────────────────────────────────────────────────────

    public function index()
    {
        $user  = auth()->user();
        $coach = $this->requireCoach();
        if ($coach instanceof \Illuminate\Http\RedirectResponse) return $coach;

        // Real counts
        $totalPosts = DB::table('posts')->where('coach_id', $coach->id)->count();

        $totalLikes = DB::table('post_likes')
            ->join('posts', 'posts.id', '=', 'post_likes.post_id')
            ->where('posts.coach_id', $coach->id)
            ->count();

        $totalMessages = DB::table('messages')
            ->where('receiver_id', auth()->id())
            ->where('is_read', false)
            ->count();

        $totalViews = (int) DB::table('posts')->where('coach_id', $coach->id)->sum('views');

        // Subscriber stats (real)
        $subscribersCount = DB::table('subscriptions')
            ->where('coach_id', $coach->id)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->count();

        $newThisWeek = DB::table('subscriptions')
            ->where('coach_id', $coach->id)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->where('created_at', '>=', now()->startOfWeek())
            ->count();

        // Monthly earnings: count active subscriptions × price × 0.85 (platform fee).
        // This is accurate for the current month since billing is monthly.
        $monthlyPrice    = floatval($coach->monthly_price);
        $monthlyEarnings = round($subscribersCount * $monthlyPrice * 0.85, 2);

        $followersCount = DB::table('follows')
            ->where('following_id', $user->id)
            ->count();

        // Profile completeness — check avatar file actually exists on disk
        $avatarOk = !empty($user->profile_avatar)
            && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->profile_avatar);

        $completeness = 0;
        if ($avatarOk) $completeness += 20;
        if (!empty($user->profile_bio)) $completeness += 20;
        if ($coach->monthly_price) $completeness += 20;
        if ($totalPosts > 0) $completeness += 20;
        if ($coach->stripe_price_id) $completeness += 20;

        $missingItems = [];
        if (!$avatarOk) $missingItems[] = 'Nahraj profilovú fotku';
        if (empty($user->profile_bio)) $missingItems[] = 'Doplň bio';
        if (!$coach->monthly_price) $missingItems[] = 'Nastav cenu predplatného';
        if ($totalPosts === 0) $missingItems[] = 'Pridaj prvý príspevok';
        if (!$coach->stripe_price_id) $missingItems[] = 'Nastav platby';

        // Recent subscribers for sidebar
        $recentSubscribers = DB::table('subscriptions')
            ->where('coach_id', $coach->id)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->join('users', 'users.id', '=', 'subscriptions.user_id')
            ->select('users.id', 'users.name', 'users.profile_avatar',
                     'subscriptions.created_at as subscribed_at')
            ->orderBy('subscriptions.created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'id'           => $s->id,
                'name'         => $s->name,
                'avatar'       => $s->profile_avatar,
                'subscribed_at' => Carbon::parse($s->subscribed_at)->locale('sk')->diffForHumans(),
            ])->all();

        // Recent posts (last 3, with thumbnail)
        $recentPosts = Post::where('coach_id', $coach->id)
            ->withCount('likes')
            ->with('media')
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get()
            ->map(function ($post) {
                $firstMedia = $post->media->first();
                $thumbnail  = $firstMedia?->media_thumbnail
                    ? '/storage/' . $firstMedia->media_thumbnail
                    : ($firstMedia?->media_path && str_starts_with($firstMedia->media_path, 'images/')
                        ? '/storage/' . $firstMedia->media_path
                        : ($post->thumbnail_path ? '/storage/' . $post->thumbnail_path : null));

                return [
                    'id'           => $post->id,
                    'title'        => $post->title ?? Str::limit($post->content ?? '', 50, '…'),
                    'likes'        => $post->likes_count,
                    'created_at'   => $post->created_at->locale('sk')->diffForHumans(),
                    'thumbnail'    => $thumbnail,
                    'is_exclusive' => (bool) $post->is_exclusive,
                ];
            })->all();

        // Earnings chart — last 6 months based on real subscription created_at dates.
        // For each month, count subscriptions that were active during that month.
        $earningsData = collect(range(5, 0))->map(function ($monthsAgo) use ($coach, $monthlyPrice) {
            $date      = now()->subMonths($monthsAgo);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd   = $date->copy()->endOfMonth();

            // Active subs: created on or before end of that month and not canceled before start
            $subs = DB::table('subscriptions')
                ->where('coach_id', $coach->id)
                ->where('created_at', '<=', $monthEnd)
                ->where(function ($q) use ($monthStart) {
                    $q->whereNull('ends_at')
                      ->orWhere('ends_at', '>=', $monthStart);
                })
                ->whereNotIn('stripe_status', ['canceled', 'incomplete_expired'])
                ->count();

            return [
                'month'          => $date->locale('sk')->isoFormat('MMM'),
                'year'           => $date->year,
                'earnings'       => round($subs * $monthlyPrice * 0.85, 2),
                'subscribers'    => $subs,
                'isCurrentMonth' => $monthsAgo === 0,
            ];
        })->values()->all();

        // Recent activity from notifications table — with actor names
        $recentActivity = DB::table('notifications')
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($n) {
                $actorName = $n->related_id
                    ? DB::table('users')->where('id', $n->related_id)->value('name')
                    : null;

                $displayTitle = match($n->type) {
                    'new_message'    => ($actorName ?? 'Niekto') . ' ti poslal správu',
                    'new_subscriber' => ($actorName ?? 'Niekto') . ' sa prihlásil na odber',
                    'new_follower'   => ($actorName ?? 'Niekto') . ' ťa začal sledovať',
                    'new_like'       => ($actorName ?? 'Niekto') . ' lajkol tvoj príspevok',
                    'new_review'     => ($actorName ?? 'Niekto') . ' zanechal recenziu',
                    default          => $n->title ?? $n->body ?? 'Nová aktivita',
                };

                return [
                    'id'      => $n->id,
                    'type'    => $n->type,
                    'title'   => $displayTitle,
                    'is_read' => (bool)$n->is_read,
                    'time'    => Carbon::parse($n->created_at)->locale('sk')->diffForHumans(),
                    'link'    => match($n->type) {
                        'new_message'    => '/messages/' . ($n->related_id ?? ''),
                        'new_subscriber' => '/dashboard/subscribers',
                        'new_follower'   => '/dashboard/followers',
                        'new_review'     => '/profile/me',
                        'new_like'       => '/feed',
                        default          => '/notifications',
                    },
                    'icon'    => match($n->type) {
                        'new_message'    => '💬',
                        'new_subscriber' => '🎉',
                        'new_follower'   => '👤',
                        'new_review'     => '⭐',
                        'new_like'       => '❤️',
                        default          => '🔔',
                    },
                ];
            })->all();

        return Inertia::render('Dashboard/Index', [
            'coach' => [
                'id'               => $coach->id,
                'name'             => $user->name,
                'avatar_url'       => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
                'specialization'   => $coach->specialization,
                'is_verified'      => $coach->is_verified,
                'stripe_account_id' => $coach->stripe_account_id,
                'price'            => $coach->monthly_price,
                'stripe_price_id'  => $coach->stripe_price_id,
            ],
            'stats' => [
                'subscriber_count'     => $subscribersCount,
                'monthly_revenue'      => $monthlyEarnings,
                'new_subscribers_week' => $newThisWeek,
                'total_posts'          => $totalPosts,
                'total_views'          => $totalViews,
                'total_likes'          => $totalLikes,
                'unread_messages'      => $totalMessages,
                'rating_avg'           => (float) $coach->rating_avg,
                'rating_count'         => (int) $coach->rating_count,
            ],
            'recent_posts'    => $recentPosts,
            'earnings_data'   => $earningsData,
            'recent_activity' => $recentActivity,
            'dashboard_sidebar' => [
                'total_likes'         => $totalLikes,
                'total_posts'         => $totalPosts,
                'unread_messages'     => $totalMessages,
                'completeness'        => $completeness,
                'missing_items'       => $missingItems,
                'recent_subscribers'  => $recentSubscribers,
                'followers_count'     => $followersCount,
                'subscribers_count'   => $subscribersCount,
            ],
        ]);
    }

    // ── Earnings ──────────────────────────────────────────────────────────────

    public function earnings()
    {
        $user  = auth()->user();
        $coach = $this->requireCoach();
        if ($coach instanceof \Illuminate\Http\RedirectResponse) return $coach;

        $monthlyPrice = floatval($coach->monthly_price);
        $netRate      = 0.85;

        // Monthly table — last 12 months using real subscription data
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $date       = Carbon::now()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd   = $date->copy()->endOfMonth();

            $subs = DB::table('subscriptions')
                ->where('coach_id', $coach->id)
                ->where('created_at', '<=', $monthEnd)
                ->where(function ($q) use ($monthStart) {
                    $q->whereNull('ends_at')
                      ->orWhere('ends_at', '>=', $monthStart);
                })
                ->whereNotIn('stripe_status', ['canceled', 'incomplete_expired'])
                ->count();

            $gross    = round($subs * $monthlyPrice, 2);
            $fee      = round($gross * 0.15, 2);
            $net      = round($gross * $netRate, 2);
            $months[] = [
                'month'       => $date->locale('sk')->isoFormat('MMMM YYYY'),
                'month_short' => $date->locale('sk')->isoFormat('MMM'),
                'year'        => $date->year,
                'gross'       => $gross,
                'fee'         => $fee,
                'net'         => $net,
                'status'      => $i === 0 ? 'pending' : 'paid',
                'subscribers' => $subs,
            ];
        }

        $totalEarned    = collect($months)->where('status', 'paid')->sum('net');
        $pendingPayout  = collect($months)->where('status', 'pending')->sum('net');
        $nextPayoutDate = Carbon::now()->addMonthNoOverflow()->startOfMonth()->format('j. n. Y');

        $activeCount   = DB::table('subscriptions')
            ->where('coach_id', $coach->id)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->count();

        $transactions = $this->buildTransactions($coach->id, $monthlyPrice);

        return Inertia::render('Dashboard/Earnings', [
            'coach' => [
                'name'       => $user->name,
                'avatar_url' => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
            ],
            'summary' => [
                'total_earned'     => round($totalEarned, 2),
                'pending_payout'   => round($pendingPayout, 2),
                'next_payout_date' => $nextPayoutDate,
                'monthly_revenue'  => round($activeCount * $monthlyPrice * $netRate, 2),
            ],
            'monthly_table' => $months,
            'transactions'  => $transactions,
        ]);
    }

    // ── Subscribers ───────────────────────────────────────────────────────────

    public function subscribers()
    {
        $user  = auth()->user();
        $coach = $this->requireCoach();
        if ($coach instanceof \Illuminate\Http\RedirectResponse) return $coach;

        $monthlyPrice = floatval($coach->monthly_price);

        $rows = DB::table('subscriptions')
            ->where('coach_id', $coach->id)
            ->join('users', 'users.id', '=', 'subscriptions.user_id')
            ->select(
                'users.name',
                'subscriptions.stripe_status',
                'subscriptions.created_at as subscribed_at',
                'subscriptions.ends_at'
            )
            ->orderBy('subscriptions.created_at', 'desc')
            ->get();

        $subscribers = $rows->values()->map(function ($row, $index) use ($monthlyPrice) {
            $subscribedAt = Carbon::parse($row->subscribed_at);
            $daysAgo      = (int) $subscribedAt->diffInDays(now());
            $paidMonths   = max(1, (int) ceil($daysAgo / 30));
            $isActive     = in_array($row->stripe_status, ['active', 'trialing']);

            // Anonymize: "J*** N***"
            $parts = explode(' ', trim($row->name));
            $anon  = collect($parts)->map(fn($p) => ($p[0] ?? '?') . '***')->implode(' ');

            return [
                'index'               => $index + 1,
                'name_anon'           => $anon,
                'subscribed_days_ago' => $daysAgo,
                'subscribed_since'    => $subscribedAt->format('d.m.Y'),
                'total_paid'          => round($paidMonths * $monthlyPrice * 0.85, 2),
                'status'              => $isActive ? 'active' : 'cancelled',
            ];
        })->all();

        $activeCount    = count(array_filter($subscribers, fn($s) => $s['status'] === 'active'));
        $cancelledCount = count($subscribers) - $activeCount;
        $total          = count($subscribers);
        $churnRate      = $total > 0 ? round(($cancelledCount / $total) * 100) : 0;
        $avgDays        = $total > 0 ? round(collect($subscribers)->avg('subscribed_days_ago')) : 0;

        return Inertia::render('Dashboard/Subscribers', [
            'coach' => [
                'name'       => $user->name,
                'avatar_url' => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
            ],
            'summary' => [
                'total'         => $total,
                'active'        => $activeCount,
                'cancelled'     => $cancelledCount,
                'churn_rate'    => $churnRate,
                'avg_days'      => $avgDays,
                'monthly_price' => $monthlyPrice,
            ],
            'subscribers' => $subscribers,
        ]);
    }

    // ── Followers ─────────────────────────────────────────────────────────────

    public function followers()
    {
        $user  = auth()->user();
        $coach = $this->requireCoach();
        if ($coach instanceof \Illuminate\Http\RedirectResponse) return $coach;

        $followers = DB::table('follows')
            ->where('following_id', $user->id)
            ->join('users', 'users.id', '=', 'follows.follower_id')
            ->select('users.id', 'users.name', 'users.profile_avatar', 'follows.created_at as followed_at')
            ->orderBy('follows.created_at', 'desc')
            ->get()
            ->map(fn($f) => [
                'id'          => $f->id,
                'name'        => $f->name,
                'avatar'      => $f->profile_avatar,
                'followed_at' => Carbon::parse($f->followed_at)->locale('sk')->diffForHumans(),
            ])->all();

        return Inertia::render('Dashboard/Followers', [
            'coach' => [
                'name'       => $user->name,
                'avatar_url' => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
            ],
            'followers' => $followers,
            'total'     => count($followers),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildTransactions(int $coachId, float $monthlyPrice): array
    {
        // Real subscription events (new subscriptions = payments received)
        $subscriptions = DB::table('subscriptions')
            ->where('coach_id', $coachId)
            ->join('users', 'users.id', '=', 'subscriptions.user_id')
            ->select('users.name', 'subscriptions.created_at', 'subscriptions.stripe_status')
            ->orderBy('subscriptions.created_at', 'desc')
            ->limit(20)
            ->get();

        return $subscriptions->map(function ($row) use ($monthlyPrice) {
            $gross = $monthlyPrice;
            $parts = explode(' ', trim($row->name));
            $anon  = collect($parts)->map(fn($p) => ($p[0] ?? '?') . '***')->implode(' ');

            return [
                'date'  => Carbon::parse($row->created_at)->format('d.m.Y'),
                'type'  => 'subscription',
                'fan'   => $anon,
                'gross' => round($gross, 2),
                'fee'   => round($gross * 0.15, 2),
                'net'   => round($gross * 0.85, 2),
            ];
        })->all();
    }
}
