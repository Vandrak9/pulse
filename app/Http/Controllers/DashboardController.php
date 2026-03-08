<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Post;
use App\Models\PostLike;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /** Abort with 403 if user is not a coach with a coach profile. */
    private function requireCoach(): \App\Models\Coach
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

        $posts = Post::where('coach_id', $coach->id)->withCount('likes')->get();

        $subscriberCount   = $coach->subscriber_count ?? 0;
        $monthlyPrice      = floatval($coach->monthly_price);
        $monthlyRevenue    = round($subscriberCount * $monthlyPrice * 0.85, 2);
        $totalRevenue      = round($subscriberCount * $monthlyPrice * 0.85 * 6, 2); // 6-month estimate
        $newThisWeek       = (int) round($subscriberCount * 0.04); // ~4% weekly churn/growth
        $totalPosts        = $posts->count();
        $totalViews        = $posts->sum('views');
        $unreadMessages    = Message::where('receiver_id', $user->id)->where('is_read', false)->count();

        $topPost = $posts->sortByDesc('likes_count')->first();

        // Revenue chart — last 6 months (computed from subscriber progression)
        $revenueChart = $this->buildRevenueChart($subscriberCount, $monthlyPrice);

        // Recent activity (real data: likes + messages, last 10)
        $recentActivity = $this->buildRecentActivity($coach, $user);

        return Inertia::render('Dashboard/Index', [
            'coach'              => [
                'id'             => $coach->id,
                'name'           => $user->name,
                'avatar_url'     => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
                'specialization' => $coach->specialization,
                'is_verified'    => $coach->is_verified,
                'stripe_account_id' => $coach->stripe_account_id,
            ],
            'stats' => [
                'subscriber_count'      => $subscriberCount,
                'monthly_revenue'       => $monthlyRevenue,
                'total_revenue'         => $totalRevenue,
                'new_subscribers_week'  => $newThisWeek,
                'total_posts'           => $totalPosts,
                'total_views'           => $totalViews,
                'unread_messages'       => $unreadMessages,
            ],
            'top_post'       => $topPost ? [
                'id'          => $topPost->id,
                'title'       => $topPost->title,
                'likes_count' => $topPost->likes_count,
                'views'       => $topPost->views,
            ] : null,
            'revenue_chart'   => $revenueChart,
            'recent_activity' => $recentActivity,
        ]);
    }

    // ── Earnings ──────────────────────────────────────────────────────────────

    public function earnings()
    {
        $user  = auth()->user();
        $coach = $this->requireCoach();

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
                'month'  => $month->locale('sk')->isoFormat('MMMM YYYY'),
                'month_short' => $month->locale('sk')->isoFormat('MMM'),
                'year'   => $month->year,
                'gross'  => $gross,
                'fee'    => $fee,
                'net'    => $net,
                'status' => $i === 0 ? 'pending' : 'paid',
                'subscribers' => $subs,
            ];
        }

        $totalEarned  = collect($months)->where('status', 'paid')->sum('net');
        $pendingPayout = collect($months)->where('status', 'pending')->sum('net');
        $nextPayoutDate = Carbon::now()->addMonthNoOverflow()->startOfMonth()->format('j. n. Y');

        // Transaction history — last 20 (simulated from subscriber count)
        $transactions = $this->buildTransactions($subscriberCount, $monthlyPrice);

        return Inertia::render('Dashboard/Earnings', [
            'coach' => [
                'name'       => $user->name,
                'avatar_url' => $coach->avatar_path ? '/storage/' . $coach->avatar_path : null,
            ],
            'summary' => [
                'total_earned'    => round($totalEarned, 2),
                'pending_payout'  => round($pendingPayout, 2),
                'next_payout_date' => $nextPayoutDate,
                'monthly_revenue' => round($subscriberCount * $monthlyPrice * $netRate, 2),
            ],
            'monthly_table'  => $months,
            'transactions'   => $transactions,
        ]);
    }

    // ── Subscribers ───────────────────────────────────────────────────────────

    public function subscribers()
    {
        $user  = auth()->user();
        $coach = $this->requireCoach();

        $subscriberCount = $coach->subscriber_count ?? 0;
        $monthlyPrice    = floatval($coach->monthly_price);

        // Build simulated subscriber list from real fan users + fill to subscriber_count
        $fans = User::where('role', 'fan')->orderBy('created_at')->get();

        $subscribers = [];
        $names = $fans->pluck('name')->all();

        // Supplement names if not enough real fans
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
                'index'          => $i + 1,
                'name_anon'      => $anon,
                'subscribed_days_ago' => $daysAgo,
                'subscribed_since'    => Carbon::now()->subDays($daysAgo)->format('d.m.Y'),
                'total_paid'     => round($paidMonths * $monthlyPrice * 0.85, 2),
                'status'         => $status,
            ];
        }

        // Sort: active first, then by days subscribed desc
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
                'total'          => $subscriberCount,
                'active'         => $activeCount,
                'cancelled'      => $cancelledCount,
                'churn_rate'     => $churnRate,
                'avg_days'       => $avgDays,
                'monthly_price'  => $monthlyPrice,
            ],
            'subscribers' => $subscribers,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildRevenueChart(int $subscriberCount, float $monthlyPrice): array
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $month   = Carbon::now()->subMonths($i);
            $factor  = 1 - ($i * 0.07);
            $subs    = max(1, (int) round($subscriberCount * $factor));
            $months[] = [
                'month'   => $month->locale('sk')->isoFormat('MMM'),
                'net'     => round($subs * $monthlyPrice * 0.85, 2),
                'current' => $i === 0,
            ];
        }
        return $months;
    }

    private function buildRecentActivity(\App\Models\Coach $coach, $user): array
    {
        $activity = [];

        // Recent likes on coach's posts
        $recentLikes = PostLike::whereHas('post', fn($q) => $q->where('coach_id', $coach->id))
            ->with('post:id,title')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($recentLikes as $like) {
            $activity[] = [
                'type'    => 'like',
                'text'    => 'Nový like na "' . ($like->post->title ?? 'príspevok') . '"',
                'icon'    => '❤️',
                'time'    => $like->created_at?->toISOString() ?? now()->toISOString(),
            ];
        }

        // Recent messages received
        $recentMessages = Message::where('receiver_id', $user->id)
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        foreach ($recentMessages as $msg) {
            $activity[] = [
                'type' => 'message',
                'text' => 'Nová ' . ($msg->message_type === 'voice' ? 'hlasová ' : '') . 'správa',
                'icon' => '💬',
                'time' => $msg->created_at?->toISOString() ?? now()->toISOString(),
            ];
        }

        // Sort by time desc, take 10
        usort($activity, fn($a, $b) => strcmp($b['time'], $a['time']));
        return array_slice($activity, 0, 10);
    }

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
                'date'   => $now->copy()->subDays($daysAgo)->format('d.m.Y'),
                'type'   => $type,
                'fan'    => $names[$i % count($names)],
                'gross'  => round($gross, 2),
                'fee'    => round($gross * 0.15, 2),
                'net'    => $net,
            ];
        }

        return $transactions;
    }
}
