import VideoModal from '@/Components/VideoModal';
import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Coach {
    id: number;
    name: string;
    avatar_url: string | null;
}

interface FeedCoach {
    id: number;
    name: string;
    specialization: string | null;
    monthly_price: string;
    avatar_url: string | null;
}

interface Post {
    id: number;
    title: string;
    content: string;
    media_type: 'none' | 'image' | 'video';
    media_url: string | null;
    thumbnail_url: string | null;
    video_duration: string | null;
    is_exclusive: boolean;
    like_count: number;
    is_liked: boolean;
    created_at: string;
    coach: FeedCoach;
}

interface Props {
    posts: Post[];
    coaches: Coach[];
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return 'práve teraz';
    if (mins < 60) return `pred ${mins} min`;
    if (hrs < 24) return `pred ${hrs} ${hrs === 1 ? 'hodinou' : 'hodinami'}`;
    if (days < 7) return `pred ${days} ${days === 1 ? 'dňom' : 'dňami'}`;
    return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long' }).format(new Date(iso));
}

export default function Feed({ posts, coaches }: Props) {
    const [likedPosts, setLikedPosts] = useState<Set<number>>(
        () => new Set(posts.filter((p) => p.is_liked).map((p) => p.id)),
    );
    const [likeCounts, setLikeCounts] = useState<Record<number, number>>(
        () => Object.fromEntries(posts.map((p) => [p.id, p.like_count])),
    );
    const [saved, setSaved] = useState<Set<number>>(new Set());
    const [activeVideo, setActiveVideo] = useState<Post | null>(null);

    function toggleLike(postId: number) {
        const isLiked = likedPosts.has(postId);
        setLikedPosts((prev) => {
            const next = new Set(prev);
            if (isLiked) next.delete(postId);
            else next.add(postId);
            return next;
        });
        setLikeCounts((prev) => ({ ...prev, [postId]: prev[postId] + (isLiked ? -1 : 1) }));
        router.post(`/feed/like/${postId}`, {}, { preserveScroll: true, preserveState: true });
    }

    function toggleSave(postId: number) {
        setSaved((prev) => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    }

    return (
        <PulseLayout>
            <Head title="Feed — PULSE" />

            {/* Video modal */}
            {activeVideo && activeVideo.media_url && (
                <VideoModal
                    videoUrl={activeVideo.media_url}
                    title={activeVideo.title}
                    coachName={activeVideo.coach.name}
                    onClose={() => setActiveVideo(null)}
                />
            )}

            <div className="min-h-screen pb-6" style={{ backgroundColor: '#faf6f0' }}>

                {/* ── Stories row ── */}
                <div className="border-b bg-white" style={{ borderColor: '#e8d9c4' }}>
                    <div className="no-scrollbar overflow-x-auto">
                        <div className="flex gap-4 px-4 py-3" style={{ width: 'max-content' }}>

                            {/* Discover button */}
                            <Link href="/coaches" className="flex flex-col items-center gap-1">
                                <div
                                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed text-2xl font-light"
                                    style={{ borderColor: '#c4714a', color: '#c4714a' }}
                                >
                                    +
                                </div>
                                <span className="w-14 truncate text-center text-xs" style={{ color: '#9a8a7a' }}>
                                    Objaviť
                                </span>
                            </Link>

                            {/* Coach stories */}
                            {coaches.map((coach) => (
                                <Link key={coach.id} href={`/coaches/${coach.id}`} className="flex flex-col items-center gap-1">
                                    <div
                                        className="h-14 w-14 flex-shrink-0 rounded-full p-0.5"
                                        style={{ background: 'linear-gradient(135deg, #c4714a, #f5a623)' }}
                                    >
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white p-0.5">
                                            <div className="h-full w-full overflow-hidden rounded-full">
                                                {coach.avatar_url ? (
                                                    <img src={coach.avatar_url} alt={coach.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div
                                                        className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
                                                        style={{ backgroundColor: '#c4714a' }}
                                                    >
                                                        {coach.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="w-14 truncate text-center text-xs" style={{ color: '#2d2118' }}>
                                        {coach.name.split(' ')[0]}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Posts feed ── */}
                <div className="mx-auto max-w-lg">
                    {posts.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-lg" style={{ color: '#9a8a7a' }}>Zatiaľ žiadne príspevky.</p>
                            <Link href="/coaches" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: '#c4714a' }}>
                                Nájdi koučov →
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: '#e8d9c4' }}>
                            {posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    isLiked={likedPosts.has(post.id)}
                                    likeCount={likeCounts[post.id] ?? post.like_count}
                                    isSaved={saved.has(post.id)}
                                    onLike={() => toggleLike(post.id)}
                                    onSave={() => toggleSave(post.id)}
                                    onPlay={() => setActiveVideo(post)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PulseLayout>
    );
}

function PostCard({
    post,
    isLiked,
    likeCount,
    isSaved,
    onLike,
    onSave,
    onPlay,
}: {
    post: Post;
    isLiked: boolean;
    likeCount: number;
    isSaved: boolean;
    onLike: () => void;
    onSave: () => void;
    onPlay: () => void;
}) {
    const price = parseFloat(post.coach.monthly_price);

    return (
        <div className="bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                <Link href={`/coaches/${post.coach.id}`} className="flex-shrink-0">
                    <div
                        className="rounded-full p-0.5"
                        style={{ background: 'linear-gradient(135deg, #c4714a, #f5a623)' }}
                    >
                        <div className="rounded-full bg-white p-0.5">
                            <div className="h-9 w-9 overflow-hidden rounded-full">
                                {post.coach.avatar_url ? (
                                    <img src={post.coach.avatar_url} alt={post.coach.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div
                                        className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                                        style={{ backgroundColor: '#c4714a' }}
                                    >
                                        {post.coach.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="min-w-0 flex-1">
                    <Link href={`/coaches/${post.coach.id}`}>
                        <p className="text-sm font-semibold leading-tight" style={{ color: '#2d2118' }}>
                            {post.coach.name}
                        </p>
                    </Link>
                    {post.coach.specialization && (
                        <p className="text-xs" style={{ color: '#c4714a' }}>{post.coach.specialization}</p>
                    )}
                </div>

                <span className="flex-shrink-0 text-xs" style={{ color: '#9a8a7a' }}>
                    {relativeTime(post.created_at)}
                </span>
            </div>

            {/* Media area */}
            {post.media_type !== 'none' && (
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    {post.is_exclusive ? (
                        /* ── Exclusive lock ── */
                        <>
                            {/* Blurred background hint */}
                            <div className="absolute inset-0" style={{ backgroundColor: '#1a0e06' }}>
                                {(post.thumbnail_url || post.media_url) && post.media_type !== 'video' && (
                                    <img
                                        src={post.thumbnail_url ?? post.media_url ?? ''}
                                        alt=""
                                        className="h-full w-full object-cover opacity-20"
                                        style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }}
                                    />
                                )}
                                {post.thumbnail_url && post.media_type === 'video' && (
                                    <img
                                        src={post.thumbnail_url}
                                        alt=""
                                        className="h-full w-full object-cover opacity-20"
                                        style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }}
                                    />
                                )}
                            </div>
                            {/* Lock overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <span className="text-4xl">🔒</span>
                                <p className="text-sm font-semibold text-white">Exkluzívny obsah</p>
                                <Link
                                    href={`/coaches/${post.coach.id}`}
                                    className="rounded-full px-5 py-2 text-xs font-bold text-white transition"
                                    style={{ backgroundColor: '#c4714a' }}
                                >
                                    Predplatiť za €{price.toFixed(2)}/mes
                                </Link>
                            </div>
                        </>
                    ) : post.media_type === 'video' ? (
                        /* ── Free video ── */
                        <button
                            onClick={onPlay}
                            className="group relative h-full w-full cursor-pointer"
                            aria-label="Prehrať video"
                        >
                            {/* Thumbnail or dark bg */}
                            {post.thumbnail_url ? (
                                <img
                                    src={post.thumbnail_url}
                                    alt={post.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full" style={{ backgroundColor: '#0d0a07' }} />
                            )}

                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition group-hover:bg-white/35 group-hover:scale-110">
                                    <svg className="ml-1 h-7 w-7 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Duration badge */}
                            {post.video_duration && (
                                <span
                                    className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-xs font-medium text-white"
                                    style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
                                >
                                    {post.video_duration}
                                </span>
                            )}

                            {/* Video type badge */}
                            <span
                                className="absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium text-white"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                            >
                                🎬 Video
                            </span>
                        </button>
                    ) : (
                        /* ── Image post ── */
                        post.media_url ? (
                            <img
                                src={post.media_url}
                                alt={post.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div
                                className="flex h-full w-full items-center justify-center"
                                style={{ backgroundColor: '#f0e8df' }}
                            >
                                <span className="text-4xl opacity-30">📸</span>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-1 px-3 pt-2">
                {/* Like */}
                <button
                    onClick={onLike}
                    className="flex items-center gap-1 rounded-full px-2 py-1.5 transition hover:bg-gray-50"
                >
                    <span className="text-lg leading-none">{isLiked ? '❤️' : '🤍'}</span>
                    {likeCount > 0 && (
                        <span className="text-xs font-medium" style={{ color: isLiked ? '#c4714a' : '#9a8a7a' }}>
                            {likeCount}
                        </span>
                    )}
                </button>

                {/* Comments */}
                <button className="flex items-center gap-1 rounded-full px-2 py-1.5 transition hover:bg-gray-50">
                    <span className="text-lg leading-none">💬</span>
                    <span className="text-xs font-medium" style={{ color: '#9a8a7a' }}>0</span>
                </button>

                {/* Save */}
                <button
                    onClick={onSave}
                    className="rounded-full px-2 py-1.5 transition hover:bg-gray-50"
                    title={isSaved ? 'Uložené' : 'Uložiť'}
                >
                    <span className="text-lg leading-none" style={{ opacity: isSaved ? 1 : 0.5 }}>🔖</span>
                </button>

                {/* Share — right aligned */}
                <div className="flex-1" />
                <button
                    className="rounded-full px-2 py-1.5 transition hover:bg-gray-50"
                    onClick={() => navigator.share?.({ title: post.title, url: `/coaches/${post.coach.id}` })}
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#9a8a7a' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>
            </div>

            {/* Content text */}
            <div className="px-4 pb-1 pt-1">
                {post.title && (
                    <p className="text-sm font-semibold" style={{ color: '#2d2118' }}>{post.title}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed" style={{ color: '#4a3728' }}>
                    {post.content}
                </p>
            </div>

            {/* Prehrať video button (only for free videos with a URL) */}
            {post.media_type === 'video' && !post.is_exclusive && post.media_url && (
                <div className="px-4 pb-4 pt-2">
                    <button
                        onClick={onPlay}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition hover:bg-orange-50"
                        style={{ borderColor: '#c4714a', color: '#c4714a' }}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Prehrať video
                    </button>
                </div>
            )}

            {post.media_type === 'none' && <div className="h-3" />}
        </div>
    );
}
