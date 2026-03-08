<?php

namespace App\Http\Controllers;

use App\Models\Coach;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    /**
     * Store or update a review for a coach.
     */
    public function store(Request $request, int $coachId)
    {
        $user  = auth()->user();
        $coach = Coach::with('user')->findOrFail($coachId);

        // Cannot review yourself
        if ($coach->user_id === $user->id) {
            return response()->json(['message' => 'Nemôžeš hodnotiť vlastný profil.'], 403);
        }

        // Must be subscribed
        $isSubscribed = DB::table('subscriptions')
            ->where('user_id', $user->id)
            ->where('coach_id', $coach->id)
            ->whereIn('stripe_status', ['active', 'trialing'])
            ->exists();

        if (!$isSubscribed) {
            return response()->json(['message' => 'Recenzie môžu zanechať len predplatitelia.'], 403);
        }

        $validated = $request->validate([
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'content' => ['nullable', 'string', 'max:500'],
        ]);

        $review = Review::updateOrCreate(
            ['user_id' => $user->id, 'coach_id' => $coach->id],
            [
                'rating'     => $validated['rating'],
                'content'    => $validated['content'] ?? null,
                'is_visible' => true,
            ]
        );

        [$avg, $count] = $this->recalculate($coachId);

        // Notify coach (only on new review, not edit)
        if ($review->wasRecentlyCreated) {
            $stars   = str_repeat('★', $review->rating) . str_repeat('☆', 5 - $review->rating);
            $preview = $review->content ? mb_substr($review->content, 0, 80) : '';

            DB::table('notifications')->insert([
                'id'              => \Illuminate\Support\Str::uuid(),
                'type'            => 'new_review',
                'notifiable_type' => 'App\\Models\\User',
                'notifiable_id'   => $coach->user_id,
                'data'            => json_encode([
                    'fan_name'   => $user->name,
                    'rating'     => $review->rating,
                    'preview'    => $preview,
                ]),
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        return response()->json([
            'review'       => $this->formatReview($review->fresh()->load('user')),
            'rating_avg'   => $avg,
            'rating_count' => $count,
        ]);
    }

    /**
     * Delete current user's own review.
     */
    public function destroy(int $coachId)
    {
        $user = auth()->user();

        Review::where('user_id', $user->id)
            ->where('coach_id', $coachId)
            ->delete();

        [$avg, $count] = $this->recalculate($coachId);

        return response()->json([
            'rating_avg'   => $avg,
            'rating_count' => $count,
        ]);
    }

    /**
     * Paginated review list (public JSON).
     */
    public function index(int $coachId)
    {
        $reviews = Review::where('coach_id', $coachId)
            ->where('is_visible', true)
            ->with('user:id,name,profile_avatar')
            ->orderByDesc('created_at')
            ->paginate(10);

        return response()->json([
            'data'         => $reviews->getCollection()->map(fn ($r) => $this->formatReview($r)),
            'current_page' => $reviews->currentPage(),
            'last_page'    => $reviews->lastPage(),
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function recalculate(int $coachId): array
    {
        $avg   = Review::where('coach_id', $coachId)->avg('rating') ?? 0;
        $count = Review::where('coach_id', $coachId)->count();
        $avg   = round($avg, 2);

        Coach::where('id', $coachId)->update([
            'rating_avg'   => $avg,
            'rating_count' => $count,
        ]);

        return [$avg, $count];
    }

    private function formatReview(Review $r): array
    {
        $avatarPath = $r->user->profile_avatar ?? null;
        return [
            'id'          => $r->id,
            'user_id'     => $r->user_id,
            'user_name'   => $r->user->name,
            'user_avatar' => $avatarPath ? Storage::url($avatarPath) : null,
            'rating'      => (int) $r->rating,
            'content'     => $r->content,
            'created_at'  => $r->created_at?->toISOString(),
        ];
    }
}
