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

        // stripe_price stores a Stripe Price ID string — not a monetary amount.
        // Until real payment tracking exists, estimate from subscriber count × price.
        $monthlyPrice    = floatval($coach->monthly_price);
        $monthlyEarnings = round($subscribersCount * $monthlyPrice * 0.85, 2);

        $followersCount = DB::table('follows')
            ->where('following_id', $user->id)
            ->count();

        // Profile completeness
        $completeness = 0;
        if ($user->profile_avatar) $completeness += 20;
        if ($user->profile_bio) $completeness += 20;
        if ($coach->monthly_price) $completeness += 20;
        if ($totalPosts > 0) $completeness += 20;
        if ($coach->stripe_price_id) $completeness += 20;

        $missingItems = [];
        if (!$user->profile_avatar) $missingItems[] = 'Nahraj profilovú fotku';
        if (!$user->profile_bio) $missingItems[] = 'Doplň bio';
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
                'subscribed_at' => Carbon::parse($s->subscribed_at)->diffForHumans(),
            ])->all();

        // Best post (real)
        $bestPost = Post::where('coach_id', $coach->id)
            ->withCount('likes')
            ->orderBy('likes_count', 'desc')
            ->first();

        $bestPostData = $bestPost ? [
            'id'         => $bestPost->id,
            'title'      => $bestPost->title ?? Str::limit($bestPost->content ?? '', 40),
            'likes'      => $bestPost->likes_count,
            'views'      => (int)($bestPost->views ?? 0),
            'created_at' => $bestPost->created_at->diffForHumans(),
        ] : null;

        // Earnings chart — last 6 months
        // stripe_price is a Stripe Price ID string, not a number — estimate via newSubs × monthly_price
        $earningsData = collect(range(5, 0))->map(function ($monthsAgo) use ($coach, $monthlyPrice) {
            $date    = now()->subMonths($monthsAgo);
            $newSubs = DB::table('subscriptions')
                ->where('coach_id', $coach->id)
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            return [
                'month'          => $date->locale('sk')->isoFormat('MMM'),
                'year'           => $date->year,
                'earnings'       => round($newSubs * $monthlyPrice * 0.85, 2),
                'subscribers'    => $newSubs,
                'isCurrentMonth' => $monthsAgo === 0,
            ];
        })->values()->all();

        // Recent activity from notifications table
        $recentActivity = DB::table('notifications')
            ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($n) {
                return [
                    'id'      => $n->id,
                    'type'    => $n->type,
                    'title'   => $n->title,
                    'body'    => $n->body,
                    'is_read' => (bool)$n->is_read,
                    'time'    => Carbon::parse($n->created_at)->diffForHumans(),
                    'link'    => match($n->type) {
                        'new_message'    => '/messages/' . ($n->related_id ?? ''),
                        'new_subscriber' => '/dashboard/subscribers',
                        'new_follower'   => '/profile/' . ($n->related_id ?? ''),
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
            'best_post'       => $bestPostData,
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

        $subscriberCount = $coach->subscriber_count ?? 0;
        $monthlyPrice    = floatval($coach->monthly_price);
        $netRate         = 0.85;

        // Monthly table — last 12 months
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            // Simulate subscriber growth: fewer subscribers in earlier months
            $factor  = 1 - ($i * 0.06); // ~6% growth per month
            $subs    = max(1, (int) round($subscriberCount * $factor));
            $gross   = round($subs * $monthlyPrice, 2);
            $fee     = round($gross * 0.15, 2);
            $net     = round($gross * $netRate, 2);
            $months[] = [
                'month'       => $month->locale('sk')->isoFormat('MMMM YYYY'),
                'month_short' => $month->locale('sk')->isoFormat('MMM'),
                'year'        => $month->year,
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

        $transactions = $this->buildTransactions($subscriberCount, $monthlyPrice);

        return Inertia::render('Dashboard/Earnings', [
            'coach' => [
                'name'       => $user->name,
                'avatar_url' => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
            ],
            'summary' => [
                'total_earned'     => round($totalEarned, 2),
                'pending_payout'   => round($pendingPayout, 2),
                'next_payout_date' => $nextPayoutDate,
                'monthly_revenue'  => round($subscriberCount * $monthlyPrice * $netRate, 2),
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

        $subscriberCount = $coach->subscriber_count ?? 0;
        $monthlyPrice    = floatval($coach->monthly_price);

        $fans       = \App\Models\User::where('role', 'fan')->orderBy('created_at')->get();
        $subscribers = [];
        $names      = $fans->pluck('name')->all();

        $extraNames = ['Maroš B.', 'Katka S.', 'Tomáš H.', 'Jana K.', 'Martin P.',
                       'Zuzana V.', 'Peter N.', 'Lucia M.', 'Radovan O.', 'Eva D.',
                       'Michal F.', 'Simona R.', 'Jakub T.', 'Andrea W.', 'Rastislav C.',
                       'Monika L.', 'Dušan B.', 'Veronika J.', 'Ondrej K.', 'Helena S.'];

        for ($i = 0; $i < min($subscriberCount, 50); $i++) {
            $name       = $names[$i] ?? $extraNames[$i % count($extraNames)];
            $parts      = explode(' ', $name);
            $first      = $parts[0] ?? 'A';
            $last       = $parts[1] ?? 'B';
            $anon       = $first[0] . '*** ' . ($last[0] ?? '') . '***';
            $daysAgo    = rand(1, 180);
            $paidMonths = max(1, (int) floor($daysAgo / 30));
            $status     = $daysAgo < 150 ? 'active' : 'cancelled';

            $subscribers[] = [
                'index'               => $i + 1,
                'name_anon'           => $anon,
                'subscribed_days_ago' => $daysAgo,
                'subscribed_since'    => Carbon::now()->subDays($daysAgo)->format('d.m.Y'),
                'total_paid'          => round($paidMonths * $monthlyPrice * 0.85, 2),
                'status'              => $status,
            ];
        }

        usort($subscribers, fn($a, $b) =>
            $a['status'] === $b['status']
                ? $b['subscribed_days_ago'] - $a['subscribed_days_ago']
                : ($a['status'] === 'active' ? -1 : 1)
        );

        $activeCount    = count(array_filter($subscribers, fn($s) => $s['status'] === 'active'));
        $cancelledCount = count($subscribers) - $activeCount;
        $churnRate      = $subscriberCount > 0 ? round(($cancelledCount / max(1, count($subscribers))) * 100) : 0;
        $avgDays        = count($subscribers) > 0
            ? round(collect($subscribers)->avg('subscribed_days_ago'))
            : 0;

        return Inertia::render('Dashboard/Subscribers', [
            'coach' => [
                'name'       => $user->name,
                'avatar_url' => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
            ],
            'summary' => [
                'total'         => $subscriberCount,
                'active'        => $activeCount,
                'cancelled'     => $cancelledCount,
                'churn_rate'    => $churnRate,
                'avg_days'      => $avgDays,
                'monthly_price' => $monthlyPrice,
            ],
            'subscribers' => $subscribers,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildTransactions(int $subscriberCount, float $monthlyPrice): array
    {
        $transactions = [];
        $now = Carbon::now();

        for ($i = 0; $i < 20; $i++) {
            $daysAgo = $i * 4 + rand(0, 3);
            $type    = $i % 5 === 0 ? 'tip' : 'subscription';
            $gross   = $type === 'tip' ? rand(2, 20) : $monthlyPrice;
            $net     = round($gross * 0.85, 2);

            $names = ['M*** K***', 'J*** N***', 'P*** H***', 'Z*** V***', 'L*** S***',
                      'T*** B***', 'E*** D***', 'R*** O***', 'K*** M***', 'A*** F***'];

            $transactions[] = [
                'date'  => $now->copy()->subDays($daysAgo)->format('d.m.Y'),
                'type'  => $type,
                'fan'   => $names[$i % count($names)],
                'gross' => round($gross, 2),
                'fee'   => round($gross * 0.15, 2),
                'net'   => $net,
            ];
        }

        return $transactions;
    }
}
