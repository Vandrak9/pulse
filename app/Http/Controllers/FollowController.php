<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FollowController extends Controller
{
    public function toggle(Request $request, $userId): JsonResponse
    {
        $follower  = $request->user();
        $following = User::findOrFail($userId);

        if ($follower->id === $following->id) {
            return response()->json(['error' => 'Cannot follow yourself'], 422);
        }

        $exists = DB::table('follows')
            ->where('follower_id', $follower->id)
            ->where('following_id', $following->id)
            ->exists();

        if ($exists) {
            DB::table('follows')
                ->where('follower_id', $follower->id)
                ->where('following_id', $following->id)
                ->delete();

            $isFollowing = false;
        } else {
            DB::table('follows')->insertOrIgnore([
                'follower_id'  => $follower->id,
                'following_id' => $following->id,
                'created_at'   => now(),
            ]);

            $isFollowing = true;

            // Notify the followed user
            Notification::create([
                'user_id'    => $following->id,
                'type'       => 'new_follower',
                'title'      => 'Nový sledovateľ',
                'body'       => "{$follower->name} ťa začal sledovať.",
                'data'       => ['actor_id' => $follower->id, 'actor_name' => $follower->name],
                'related_id' => $follower->id,
                'is_read'    => false,
            ]);
        }

        $count = DB::table('follows')->where('following_id', $following->id)->count();

        return response()->json([
            'following' => $isFollowing,
            'count'     => $count,
        ]);
    }
}
