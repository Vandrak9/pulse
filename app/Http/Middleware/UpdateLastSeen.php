<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UpdateLastSeen
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            $user = auth()->user();
            // Update at most once every 2 minutes to reduce DB writes
            if (! $user->last_seen_at || now()->diffInMinutes($user->last_seen_at) >= 2) {
                DB::table('users')->where('id', $user->id)->update(['last_seen_at' => now()]);
            }
        }

        return $next($request);
    }
}
