<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        // Coaches see their dashboard as their home page
        if (Auth::check() && Auth::user()->role === 'coach') {
            return redirect()->route('dashboard');
        }

        $featured = Coach::with('user')
            ->orderByDesc('subscriber_count')
            ->limit(4)
            ->get()
            ->map(fn ($coach) => [
                'id' => $coach->id,
                'name' => $coach->user->name,
                'specialization' => $coach->specialization,
                'monthly_price' => $coach->monthly_price,
                'rating' => $coach->rating,
                'subscriber_count' => $coach->subscriber_count,
                'avatar_url' => $coach->avatar_path
                    ? Storage::url($coach->avatar_path)
                    : null,
            ]);

        $stats = [
            'coaches' => Coach::count(),
            'fans'    => User::where('role', 'fan')->count(),
            'videos'  => DB::table('post_media')->where('media_type', 'video')->count(),
            'rating'  => round(Coach::avg('rating_avg') ?? 4.8, 1),
        ];

        return Inertia::render('Home', [
            'featured' => $featured,
            'stats'    => $stats,
        ]);
    }
}
