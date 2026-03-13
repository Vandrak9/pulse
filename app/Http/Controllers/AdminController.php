<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Admin coach overview — list all coaches with status and stats.
     */
    public function index(Request $request)
    {
        $filter = $request->input('filter', 'all'); // all | pending | verified | suspended

        $query = Coach::with('user')
            ->orderByRaw('is_verified ASC, is_suspended ASC, created_at DESC');

        if ($filter === 'pending') {
            $query->where('is_verified', false)->where('is_suspended', false);
        } elseif ($filter === 'verified') {
            $query->where('is_verified', true)->where('is_suspended', false);
        } elseif ($filter === 'suspended') {
            $query->where('is_suspended', true);
        }

        $coaches = $query->get()->map(function (Coach $coach) {
            $subscriberCount = DB::table('subscriptions')
                ->where('coach_id', $coach->id)
                ->whereIn('stripe_status', ['active', 'trialing'])
                ->count();

            $postCount = DB::table('posts')->where('coach_id', $coach->id)->count();

            $status = 'pending';
            if ($coach->is_suspended) $status = 'suspended';
            elseif ($coach->is_verified) $status = 'verified';

            return [
                'id'               => $coach->id,
                'name'             => $coach->user->name,
                'email'            => $coach->user->email,
                'specialization'   => $coach->specialization,
                'monthly_price'    => (float) $coach->monthly_price,
                'subscriber_count' => $subscriberCount,
                'post_count'       => $postCount,
                'rating_avg'       => (float) $coach->rating_avg,
                'stripe_connected' => !empty($coach->stripe_account_id),
                'status'           => $status,
                'joined_at'        => $coach->created_at->format('d.m.Y'),
            ];
        });

        $summary = [
            'total'     => Coach::count(),
            'pending'   => Coach::where('is_verified', false)->where('is_suspended', false)->count(),
            'verified'  => Coach::where('is_verified', true)->where('is_suspended', false)->count(),
            'suspended' => Coach::where('is_suspended', true)->count(),
        ];

        return Inertia::render('Admin/Index', [
            'coaches' => $coaches,
            'summary' => $summary,
            'filter'  => $filter,
        ]);
    }

    /**
     * Approve a coach — set is_verified = true.
     */
    public function approve(int $coachId)
    {
        $coach = Coach::findOrFail($coachId);
        $coach->update(['is_verified' => true, 'is_suspended' => false]);

        return back()->with('success', "Kouč {$coach->user->name} bol schválený.");
    }

    /**
     * Suspend a coach — blocks public visibility and new subscriptions.
     */
    public function suspend(int $coachId)
    {
        $coach = Coach::findOrFail($coachId);
        $coach->update(['is_suspended' => true, 'is_verified' => false]);

        return back()->with('success', "Kouč {$coach->user->name} bol pozastavený.");
    }

    /**
     * Revoke verification — set back to pending.
     */
    public function revoke(int $coachId)
    {
        $coach = Coach::findOrFail($coachId);
        $coach->update(['is_verified' => false, 'is_suspended' => false]);

        return back()->with('success', "Verifikácia koučovi {$coach->user->name} bola odobratá.");
    }
}
