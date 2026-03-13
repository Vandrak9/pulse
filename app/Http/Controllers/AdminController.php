<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    // ── Dashboard ─────────────────────────────────────────────────────────────────

    public function dashboard()
    {
        $tipsTotal     = (float) DB::table('tips')->sum('amount');
        $tipsCount     = DB::table('tips')->count();
        $messagesTotal = (float) DB::table('messages')->where('is_paid', true)->sum('price_paid');
        $messagesCount = DB::table('messages')->where('is_paid', true)->count();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users'          => User::count(),
                'new_users_month'      => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'fans'                 => User::where('role', 'fan')->count(),
                'coaches_total'        => Coach::count(),
                'coaches_pending'      => Coach::where('is_verified', false)->where('is_suspended', false)->count(),
                'coaches_verified'     => Coach::where('is_verified', true)->where('is_suspended', false)->count(),
                'coaches_suspended'    => Coach::where('is_suspended', true)->count(),
                'active_subscriptions' => DB::table('subscriptions')
                    ->whereIn('stripe_status', ['active', 'trialing'])->count(),
                'tips_count'           => $tipsCount,
                'tips_total'           => $tipsTotal,
                'messages_count'       => $messagesCount,
                'messages_total'       => $messagesTotal,
                'platform_revenue'     => round(($tipsTotal + $messagesTotal) * 0.15, 2),
            ],
        ]);
    }

    // ── Coaches list ──────────────────────────────────────────────────────────────

    public function coaches(Request $request)
    {
        $filter = $request->input('filter', 'all');

        $query = Coach::with('user')
            ->orderByRaw('is_verified ASC, is_suspended ASC, created_at DESC');

        if ($filter === 'pending')   $query->where('is_verified', false)->where('is_suspended', false);
        elseif ($filter === 'verified')  $query->where('is_verified', true)->where('is_suspended', false);
        elseif ($filter === 'suspended') $query->where('is_suspended', true);

        $coaches = $query->get()->map(fn (Coach $coach) => $this->coachRow($coach));

        return Inertia::render('Admin/Coaches', [
            'coaches' => $coaches,
            'summary' => $this->coachSummary(),
            'filter'  => $filter,
        ]);
    }

    // ── Coach detail ──────────────────────────────────────────────────────────────

    public function coachDetail(int $coachId)
    {
        $coach = Coach::with('user')->findOrFail($coachId);

        $tipsTotal  = (float) DB::table('tips')->where('coach_id', $coachId)->sum('amount');
        $tipsCount  = DB::table('tips')->where('coach_id', $coachId)->count();
        $msgRevenue = (float) DB::table('messages')
            ->where('receiver_id', $coach->user_id)->where('is_paid', true)->sum('price_paid');
        $msgCount   = DB::table('messages')
            ->where('receiver_id', $coach->user_id)->where('is_paid', true)->count();

        $recentPosts = DB::table('posts')
            ->where('coach_id', $coachId)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id'           => $p->id,
                'title'        => $p->title,
                'media_type'   => $p->media_type,
                'is_exclusive' => (bool) $p->is_exclusive,
                'views'        => $p->views,
                'created_at'   => Carbon::parse($p->created_at)->format('d.m.Y'),
            ]);

        $recentSubscribers = DB::table('subscriptions')
            ->join('users', 'users.id', '=', 'subscriptions.billable_id')
            ->where('subscriptions.coach_id', $coachId)
            ->whereIn('subscriptions.stripe_status', ['active', 'trialing'])
            ->orderByDesc('subscriptions.created_at')
            ->limit(10)
            ->get()
            ->map(fn ($s) => [
                'name'          => $s->name,
                'email'         => $s->email,
                'subscribed_at' => Carbon::parse($s->created_at)->format('d.m.Y'),
            ]);

        $status = 'pending';
        if ($coach->is_suspended) $status = 'suspended';
        elseif ($coach->is_verified) $status = 'verified';

        return Inertia::render('Admin/CoachDetail', [
            'coach' => [
                'id'                => $coach->id,
                'name'              => $coach->user->name,
                'email'             => $coach->user->email,
                'bio'               => $coach->bio,
                'specialization'    => $coach->specialization,
                'categories'        => $coach->categories ?? [],
                'monthly_price'     => (float) $coach->monthly_price,
                'rating_avg'        => (float) $coach->rating_avg,
                'rating_count'      => (int) $coach->rating_count,
                'stripe_connected'  => !empty($coach->stripe_account_id),
                'stripe_account_id' => $coach->stripe_account_id,
                'status'            => $status,
                'joined_at'         => $coach->created_at->format('d.m.Y'),
            ],
            'stats' => [
                'subscriber_count'   => DB::table('subscriptions')
                    ->where('coach_id', $coachId)
                    ->whereIn('stripe_status', ['active', 'trialing'])->count(),
                'post_count'         => DB::table('posts')->where('coach_id', $coachId)->count(),
                'tips_count'         => $tipsCount,
                'tips_total'         => $tipsTotal,
                'message_count'      => $msgCount,
                'message_revenue'    => $msgRevenue,
                'live_streams_count' => DB::table('live_streams')->where('coach_id', $coachId)->count(),
            ],
            'recent_posts'       => $recentPosts,
            'recent_subscribers' => $recentSubscribers,
        ]);
    }

    // ── Coach actions ─────────────────────────────────────────────────────────────

    public function approve(int $coachId)
    {
        $coach = Coach::findOrFail($coachId);
        $coach->update(['is_verified' => true, 'is_suspended' => false]);
        return back()->with('success', "Kouč {$coach->user->name} bol schválený.");
    }

    public function suspend(int $coachId)
    {
        $coach = Coach::findOrFail($coachId);
        $coach->update(['is_suspended' => true, 'is_verified' => false]);
        return back()->with('success', "Kouč {$coach->user->name} bol pozastavený.");
    }

    public function revoke(int $coachId)
    {
        $coach = Coach::findOrFail($coachId);
        $coach->update(['is_verified' => false, 'is_suspended' => false]);
        return back()->with('success', "Verifikácia koučovi {$coach->user->name} bola odobratá.");
    }

    // ── Users ─────────────────────────────────────────────────────────────────────

    public function users(Request $request)
    {
        $filter = $request->input('filter', 'all');
        $search = $request->input('search', '');

        $query = User::orderByDesc('created_at');

        if ($filter === 'fan')        $query->where('role', 'fan');
        elseif ($filter === 'coach')  $query->where('role', 'coach');
        elseif ($filter === 'admin')  $query->where('role', 'admin');
        elseif ($filter === 'banned') $query->where('is_banned', true);

        if ($search) {
            $query->where(fn ($q) =>
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
            );
        }

        $users = $query->limit(200)->get()->map(fn (User $u) => [
            'id'           => $u->id,
            'name'         => $u->name,
            'email'        => $u->email,
            'role'         => $u->role,
            'is_banned'    => (bool) $u->is_banned,
            'joined_at'    => $u->created_at->format('d.m.Y'),
            'last_seen_at' => $u->last_seen_at?->diffForHumans() ?? null,
        ]);

        return Inertia::render('Admin/Users', [
            'users'   => $users,
            'summary' => [
                'total'   => User::count(),
                'fans'    => User::where('role', 'fan')->count(),
                'coaches' => User::where('role', 'coach')->count(),
                'admins'  => User::where('role', 'admin')->count(),
                'banned'  => User::where('is_banned', true)->count(),
            ],
            'filter'  => $filter,
            'search'  => $search,
        ]);
    }

    public function banUser(int $userId)
    {
        $user = User::findOrFail($userId);
        abort_if($user->role === 'admin', 403, 'Admina nie je možné zabanovať.');
        $user->update(['is_banned' => true]);
        return back()->with('success', "Používateľ {$user->name} bol zabanovaný.");
    }

    public function unbanUser(int $userId)
    {
        $user = User::findOrFail($userId);
        $user->update(['is_banned' => false]);
        return back()->with('success', "Používateľ {$user->name} bol odbánovaný.");
    }

    // ── Transactions ──────────────────────────────────────────────────────────────

    public function transactions()
    {
        $tips = DB::table('tips')
            ->join('users as fans', 'fans.id', '=', 'tips.fan_id')
            ->join('coaches', 'coaches.id', '=', 'tips.coach_id')
            ->join('users as cu', 'cu.id', '=', 'coaches.user_id')
            ->orderByDesc('tips.created_at')
            ->limit(200)
            ->get(['tips.id', 'fans.name as fan_name', 'fans.email as fan_email',
                   'cu.name as coach_name', 'tips.amount', 'tips.created_at'])
            ->map(fn ($t) => [
                'id'         => $t->id,
                'fan_name'   => $t->fan_name,
                'fan_email'  => $t->fan_email,
                'coach_name' => $t->coach_name,
                'amount'     => (float) $t->amount,
                'created_at' => Carbon::parse($t->created_at)->format('d.m.Y H:i'),
            ]);

        $messages = DB::table('messages')
            ->join('users as senders',   'senders.id',   '=', 'messages.sender_id')
            ->join('users as receivers', 'receivers.id', '=', 'messages.receiver_id')
            ->where('messages.is_paid', true)
            ->orderByDesc('messages.created_at')
            ->limit(200)
            ->get(['messages.id', 'senders.name as sender_name', 'senders.email as sender_email',
                   'receivers.name as receiver_name', 'messages.price_paid', 'messages.created_at'])
            ->map(fn ($m) => [
                'id'            => $m->id,
                'sender_name'   => $m->sender_name,
                'sender_email'  => $m->sender_email,
                'receiver_name' => $m->receiver_name,
                'amount'        => (float) $m->price_paid,
                'created_at'    => Carbon::parse($m->created_at)->format('d.m.Y H:i'),
            ]);

        $subscriptions = DB::table('subscriptions')
            ->join('users', 'users.id', '=', 'subscriptions.billable_id')
            ->join('coaches', 'coaches.id', '=', 'subscriptions.coach_id')
            ->join('users as cu', 'cu.id', '=', 'coaches.user_id')
            ->orderByDesc('subscriptions.created_at')
            ->limit(200)
            ->get(['subscriptions.id', 'users.name as user_name', 'users.email as user_email',
                   'cu.name as coach_name', 'subscriptions.stripe_status', 'subscriptions.created_at'])
            ->map(fn ($s) => [
                'id'            => $s->id,
                'user_name'     => $s->user_name,
                'user_email'    => $s->user_email,
                'coach_name'    => $s->coach_name,
                'price'         => 0.0,
                'stripe_status' => $s->stripe_status,
                'created_at'    => Carbon::parse($s->created_at)->format('d.m.Y'),
            ]);

        $tipsSum     = (float) DB::table('tips')->sum('amount');
        $messagesSum = (float) DB::table('messages')->where('is_paid', true)->sum('price_paid');

        return Inertia::render('Admin/Transactions', [
            'tips'          => $tips,
            'messages'      => $messages,
            'subscriptions' => $subscriptions,
            'totals'        => [
                'tips_sum'             => $tipsSum,
                'messages_sum'         => $messagesSum,
                'active_subscriptions' => DB::table('subscriptions')
                    ->whereIn('stripe_status', ['active', 'trialing'])->count(),
                'platform_fee'         => round(($tipsSum + $messagesSum) * 0.15, 2),
            ],
        ]);
    }

    // ── Legacy redirect ───────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        return redirect()->route('admin.dashboard');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private function coachRow(Coach $coach): array
    {
        $status = 'pending';
        if ($coach->is_suspended) $status = 'suspended';
        elseif ($coach->is_verified) $status = 'verified';

        return [
            'id'               => $coach->id,
            'name'             => $coach->user->name,
            'email'            => $coach->user->email,
            'specialization'   => $coach->specialization,
            'monthly_price'    => (float) $coach->monthly_price,
            'subscriber_count' => DB::table('subscriptions')
                ->where('coach_id', $coach->id)
                ->whereIn('stripe_status', ['active', 'trialing'])->count(),
            'post_count'       => DB::table('posts')->where('coach_id', $coach->id)->count(),
            'rating_avg'       => (float) $coach->rating_avg,
            'stripe_connected' => !empty($coach->stripe_account_id),
            'status'           => $status,
            'joined_at'        => $coach->created_at->format('d.m.Y'),
        ];
    }

    private function coachSummary(): array
    {
        return [
            'total'     => Coach::count(),
            'pending'   => Coach::where('is_verified', false)->where('is_suspended', false)->count(),
            'verified'  => Coach::where('is_verified', true)->where('is_suspended', false)->count(),
            'suspended' => Coach::where('is_suspended', true)->count(),
        ];
    }
}
