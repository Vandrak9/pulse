<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Services\EmailNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CommentController extends Controller
{
    /** GET /feed/posts/{post}/comments */
    public function index(Post $post): JsonResponse
    {
        $authId = auth()->id();

        // Only top-level comments; replies are nested inside
        $comments = $post->comments()
            ->with(['user:id,name,profile_avatar', 'replies.user:id,name,profile_avatar'])
            ->whereNull('parent_id')
            ->latest()
            ->take(50)
            ->get()
            ->map(fn($c) => $this->mapComment($c, $authId));

        return response()->json($comments);
    }

    /** POST /feed/posts/{post}/comments */
    public function store(Request $request, Post $post): JsonResponse
    {
        $request->validate([
            'content'   => 'required|string|max:500',
            'parent_id' => 'nullable|integer|exists:post_comments,id',
        ]);

        $user      = $request->user();
        $content   = trim($request->input('content'));
        $parentId  = $request->input('parent_id');

        // If replying, ensure parent belongs to this post
        if ($parentId) {
            $parent = PostComment::where('id', $parentId)
                ->where('post_id', $post->id)
                ->first();
            if (!$parent) {
                return response()->json(['error' => 'Invalid parent comment'], 422);
            }
        }

        $comment = PostComment::create([
            'post_id'   => $post->id,
            'user_id'   => $user->id,
            'parent_id' => $parentId ?: null,
            'content'   => $content,
        ]);
        $comment->load('user:id,name,profile_avatar');

        // ── Notify the coach (new comment on their post) ──────────────────────
        $coachUser = DB::table('coaches')
            ->join('users', 'users.id', '=', 'coaches.user_id')
            ->where('coaches.id', $post->coach_id)
            ->select('users.id as user_id', 'users.notif_new_comment',
                     'users.email_notif_new_comment', 'users.email_verified_at', 'users.name')
            ->first();

        if ($coachUser && $coachUser->user_id !== $user->id) {
            if ($coachUser->notif_new_comment ?? true) {
                try {
                    Notification::create([
                        'user_id'    => $coachUser->user_id,
                        'type'       => 'new_comment',
                        'title'      => $user->name . ' okomentoval tvoj príspevok',
                        'body'       => Str::limit($content, 80),
                        'data'       => ['actor_id' => $user->id, 'actor_name' => $user->name, 'post_id' => $post->id],
                        'related_id' => $user->id,
                        'is_read'    => false,
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Comment notification (coach) failed: ' . $e->getMessage());
                }
            }

            if ($coachUser->email_notif_new_comment && $coachUser->email_verified_at) {
                $coachModel = User::find($coachUser->user_id);
                if ($coachModel) {
                    app(EmailNotificationService::class)->send($coachModel, 'new_comment', [
                        'name'       => $user->name,
                        'post_title' => $post->title ?? Str::limit($post->content ?? '', 40),
                    ]);
                }
            }
        }

        // ── Notify parent comment author (reply notification) ─────────────────
        if ($parentId) {
            $parentComment = PostComment::with('user')->find($parentId);
            $parentAuthor  = $parentComment?->user;

            if ($parentAuthor && $parentAuthor->id !== $user->id) {
                if ($parentAuthor->notif_new_reply ?? true) {
                    try {
                        Notification::create([
                            'user_id'    => $parentAuthor->id,
                            'type'       => 'new_reply',
                            'title'      => $user->name . ' odpovedal na tvoj komentár',
                            'body'       => Str::limit($content, 80),
                            'data'       => ['actor_id' => $user->id, 'actor_name' => $user->name, 'post_id' => $post->id],
                            'related_id' => $user->id,
                            'is_read'    => false,
                        ]);
                    } catch (\Exception $e) {
                        Log::warning('Reply notification failed: ' . $e->getMessage());
                    }
                }

                if (($parentAuthor->email_notif_new_reply ?? false) && $parentAuthor->email_verified_at) {
                    app(EmailNotificationService::class)->send($parentAuthor, 'new_reply', [
                        'name'    => $user->name,
                        'preview' => Str::limit($content, 80),
                    ]);
                }
            }
        }

        return response()->json($this->mapComment($comment, $user->id), 201);
    }

    /** DELETE /feed/comments/{comment} */
    public function destroy(Request $request, PostComment $comment): JsonResponse
    {
        $user = $request->user();

        $isOwn       = $comment->user_id === $user->id;
        $isPostCoach = DB::table('coaches')
            ->where('id', $comment->post->coach_id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isOwn && !$isPostCoach) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $comment->delete();
        return response()->json(['deleted' => true]);
    }

    private function mapComment(PostComment $c, ?int $authId): array
    {
        return [
            'id'         => $c->id,
            'content'    => $c->content,
            'parent_id'  => $c->parent_id,
            'created_at' => $c->created_at->locale('sk')->diffForHumans(),
            'user' => [
                'id'     => $c->user->id,
                'name'   => $c->user->name,
                'avatar' => $c->user->profile_avatar,
            ],
            'is_own'  => $c->user_id === $authId,
            'replies' => $c->relationLoaded('replies')
                ? $c->replies->map(fn($r) => $this->mapComment($r, $authId))->values()->all()
                : [],
        ];
    }
}
