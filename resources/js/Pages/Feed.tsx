import VideoModal from '@/Components/VideoModal';
import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { formatDuration, relativeTime as relativeTimeUtil } from '@/lib/utils';

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
    video_type: 'reel' | 'video' | null;
    video_duration: number | null;
    is_exclusive: boolean;
    like_count: number;
    is_liked: boolean;
    created_at: string;
    coach: FeedCoach;
}

interface Props {
    posts: Post[];
    reels: Post[];
    videos: Post[];
    coaches: Coach[];
}

// relativeTime, formatDuration → imported from @/lib/utils
const relativeTime = relativeTimeUtil;

type Tab = 'feed' | 'reels' | 'videos';

export default function Feed({ posts, reels, videos, coaches }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { name: string; role?: string } | null } };
    const isCoach = auth?.user?.role === 'coach';
    const [tab, setTab] = useState<Tab>('feed');

    const allPosts = [...posts, ...reels, ...videos].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
    );

    const [likedPosts, setLikedPosts] = useState<Set<number>>(
        () => new Set(allPosts.filter((p) => p.is_liked).map((p) => p.id)),
    );
    const [likeCounts, setLikeCounts] = useState<Record<number, number>>(
        () => Object.fromEntries(allPosts.map((p) => [p.id, p.like_count])),
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

            {activeVideo && activeVideo.media_url && (
                <VideoModal
                    videoUrl={activeVideo.media_url}
                    title={activeVideo.title}
                    coachName={activeVideo.coach.name}
                    onClose={() => setActiveVideo(null)}
                />
            )}

            <div className="min-h-screen" style={{ backgroundColor: '#faf6f0' }}>

                {/* Coach composer — desktop only, coaches only */}
                {isCoach && tab === 'feed' && (
                    <div className="hidden md:block border-b bg-white" style={{ borderColor: '#e8d9c4' }}>
                        <div className="mx-auto max-w-2xl px-4 py-4">
                            <Link href="/dashboard/profile" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#c4714a', color: 'white', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {auth?.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{
                                    flex: 1, padding: '10px 16px', borderRadius: 999,
                                    border: '1px solid #e8d9c4', background: '#faf6f0',
                                    fontSize: 14, color: '#9a8a7a', cursor: 'pointer',
                                }}>
                                    Zdieľaj niečo so svojimi predplatiteľmi...
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ padding: '8px 14px', borderRadius: 999, background: '#fce8de', color: '#c4714a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                        🎬 Video
                                    </div>
                                    <div style={{ padding: '8px 14px', borderRadius: 999, background: '#fce8de', color: '#c4714a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                        📸 Foto
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stories row — hidden on reels tab */}
                {tab !== 'reels' && (
                    <div className="border-b bg-white" style={{ borderColor: '#e8d9c4' }}>
                        <div className="no-scrollbar overflow-x-auto">
                            <div className="mx-auto flex max-w-2xl gap-4 px-4 py-3 md:gap-5 md:py-4" style={{ width: 'max-content' }}>
                                <Link href="/coaches" className="flex flex-col items-center gap-1">
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed text-2xl font-light"
                                        style={{ borderColor: '#c4714a', color: '#c4714a' }}
                                    >
                                        +
                                    </div>
                                    <span className="w-14 truncate text-center text-xs" style={{ color: '#9a8a7a' }}>
                                        Objavit
                                    </span>
                                </Link>
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
                )}

                {/* Tab bar */}
                <div className="sticky top-0 z-10 border-b bg-white md:top-0" style={{ borderColor: '#e8d9c4' }}>
                    <div className="mx-auto flex max-w-2xl">
                        {([
                            ['feed', 'Pre teba'],
                            ['reels', 'Reels'],
                            ['videos', 'Videa'],
                        ] as [Tab, string][]).map(([t, label]) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className="flex-1 py-3 text-sm font-semibold transition"
                                style={{
                                    color: tab === t ? '#c4714a' : '#9a8a7a',
                                    borderBottom: tab === t ? '2px solid #c4714a' : '2px solid transparent',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab: Pre teba (mixed feed) ── */}
                {tab === 'feed' && (
                    <div className="mx-auto max-w-2xl pb-6">
                        {posts.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-lg" style={{ color: '#9a8a7a' }}>Zatial ziadne prispevky.</p>
                                <Link href="/coaches" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: '#c4714a' }}>
                                    Najdi koucov &rarr;
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
                )}

                {/* ── Tab: Reels (TikTok-style) ── */}
                {tab === 'reels' && (
                    <ReelsPlayer
                        reels={reels}
                        likedPosts={likedPosts}
                        likeCounts={likeCounts}
                        onLike={toggleLike}
                    />
                )}

                {/* ── Tab: Videa (YouTube-style) ── */}
                {tab === 'videos' && (
                    <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
                        {videos.length === 0 ? (
                            <div className="py-20 text-center">
                                <p style={{ color: '#9a8a7a' }}>Ziadne dlhe videa.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {videos.map((post) => (
                                    <VideoCard
                                        key={post.id}
                                        post={post}
                                        isLiked={likedPosts.has(post.id)}
                                        likeCount={likeCounts[post.id] ?? post.like_count}
                                        onLike={() => toggleLike(post.id)}
                                        onPlay={() => setActiveVideo(post)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PulseLayout>
    );
}

/* ── Reels player ── */
function ReelsPlayer({
    reels,
    likedPosts,
    likeCounts,
    onLike,
}: {
    reels: Post[];
    likedPosts: Set<number>;
    likeCounts: Record<number, number>;
    onLike: (id: number) => void;
}) {
    const [activeIdx, setActiveIdx] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        function onScroll() {
            if (!container) return;
            const idx = Math.round(container.scrollTop / container.clientHeight);
            setActiveIdx(idx);
        }

        container.addEventListener('scroll', onScroll, { passive: true });
        return () => container.removeEventListener('scroll', onScroll);
    }, []);

    if (reels.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <p style={{ color: '#9a8a7a' }}>Ziadne reels.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                height: 'calc(100dvh - 152px)',
                overflowY: 'scroll',
                scrollSnapType: 'y mandatory',
                backgroundColor: '#000',
            }}
            className="no-scrollbar"
        >
            {reels.map((reel, i) => (
                <ReelSlide
                    key={reel.id}
                    reel={reel}
                    isActive={i === activeIdx}
                    isLiked={likedPosts.has(reel.id)}
                    likeCount={likeCounts[reel.id] ?? reel.like_count}
                    onLike={() => onLike(reel.id)}
                />
            ))}
        </div>
    );
}

function ReelSlide({
    reel,
    isActive,
    isLiked,
    likeCount,
    onLike,
}: {
    reel: Post;
    isActive: boolean;
    isLiked: boolean;
    likeCount: number;
    onLike: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (isActive) {
            v.play().catch(() => {});
        } else {
            v.pause();
            v.currentTime = 0;
        }
    }, [isActive]);

    return (
        <div
            style={{
                height: 'calc(100dvh - 152px)',
                scrollSnapAlign: 'start',
                position: 'relative',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            {/* Video or locked state */}
            {reel.is_exclusive ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    {reel.thumbnail_url && (
                        <img
                            src={reel.thumbnail_url}
                            alt={reel.title}
                            className="absolute inset-0 h-full w-full object-cover opacity-20"
                            style={{ filter: 'blur(12px)', transform: 'scale(1.1)' }}
                        />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <span className="text-5xl">🔒</span>
                        <p className="text-sm font-semibold text-white">Exkluzivny obsah</p>
                        <Link
                            href={`/coaches/${reel.coach.id}`}
                            className="rounded-full px-5 py-2 text-xs font-bold text-white"
                            style={{ backgroundColor: '#c4714a' }}
                        >
                            Predplatit za €{parseFloat(reel.coach.monthly_price).toFixed(2)}/mes
                        </Link>
                    </div>
                </div>
            ) : reel.media_url ? (
                <video
                    ref={videoRef}
                    src={reel.media_url}
                    className="h-full w-full"
                    style={{ objectFit: 'contain' }}
                    loop
                    playsInline
                    muted
                />
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                    {reel.thumbnail_url && (
                        <img src={reel.thumbnail_url} alt={reel.title} className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <svg className="ml-1 h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%, transparent 80%, rgba(0,0,0,0.3) 100%)' }}
            />

            {/* Bottom-left: coach info + caption */}
            <div className="absolute bottom-6 left-4 right-16 z-10">
                <Link href={`/coaches/${reel.coach.id}`} className="flex items-center gap-2">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-white">
                        {reel.coach.avatar_url ? (
                            <img src={reel.coach.avatar_url} alt={reel.coach.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                                {reel.coach.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <span className="text-sm font-semibold text-white drop-shadow">{reel.coach.name}</span>
                </Link>
                {reel.title && (
                    <p className="mt-2 text-sm font-medium text-white/90 drop-shadow">{reel.title}</p>
                )}
                {reel.content && (
                    <p className="mt-1 line-clamp-2 text-xs text-white/70">{reel.content}</p>
                )}
                {reel.video_duration != null && (
                    <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-xs text-white/80" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        {formatDuration(reel.video_duration)}
                    </span>
                )}
            </div>

            {/* Right side: actions */}
            <div className="absolute bottom-6 right-3 z-10 flex flex-col items-center gap-5">
                {/* Like */}
                <button onClick={onLike} className="flex flex-col items-center gap-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                        <span className="text-xl leading-none">{isLiked ? '❤️' : '🤍'}</span>
                    </div>
                    {likeCount > 0 && (
                        <span className="text-xs font-semibold text-white drop-shadow">{likeCount}</span>
                    )}
                </button>

                {/* Comment */}
                <button className="flex flex-col items-center gap-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                        <span className="text-xl leading-none">💬</span>
                    </div>
                    <span className="text-xs font-semibold text-white drop-shadow">0</span>
                </button>

                {/* Share */}
                <button
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm"
                    onClick={() => navigator.share?.({ title: reel.title, url: `/coaches/${reel.coach.id}` })}
                >
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>

                {/* Coach avatar (small) */}
                <Link href={`/coaches/${reel.coach.id}`}>
                    <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white">
                        {reel.coach.avatar_url ? (
                            <img src={reel.coach.avatar_url} alt={reel.coach.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                                {reel.coach.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </div>
    );
}

/* ── YouTube-style video card ── */
function VideoCard({
    post,
    isLiked,
    likeCount,
    onLike,
    onPlay,
}: {
    post: Post;
    isLiked: boolean;
    likeCount: number;
    onLike: () => void;
    onPlay: () => void;
}) {
    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #e8d9c4' }}>
            {/* Thumbnail row */}
            <div className="flex gap-3 p-3">
                {/* Thumbnail */}
                <button
                    onClick={post.is_exclusive ? undefined : onPlay}
                    className="relative flex-shrink-0 overflow-hidden rounded-xl"
                    style={{ width: 140, aspectRatio: '16/9', backgroundColor: '#111' }}
                >
                    {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full" style={{ backgroundColor: '#1a1a1a' }} />
                    )}
                    {post.is_exclusive ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-xl">🔒</span>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm">
                                <svg className="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    )}
                    {post.video_duration != null && !post.is_exclusive && (
                        <span
                            className="absolute bottom-1 right-1 rounded px-1 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                        >
                            {formatDuration(post.video_duration)}
                        </span>
                    )}
                </button>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug" style={{ color: '#2d2118' }}>
                        {post.title || post.content}
                    </p>
                    <Link href={`/coaches/${post.coach.id}`} className="mt-1 flex items-center gap-1.5">
                        <div className="h-5 w-5 flex-shrink-0 overflow-hidden rounded-full">
                            {post.coach.avatar_url ? (
                                <img src={post.coach.avatar_url} alt={post.coach.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                                    {post.coach.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <span className="text-xs" style={{ color: '#9a8a7a' }}>{post.coach.name}</span>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                        <button
                            onClick={onLike}
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs transition hover:bg-gray-50"
                            style={{ color: isLiked ? '#c4714a' : '#9a8a7a' }}
                        >
                            <span>{isLiked ? '❤️' : '🤍'}</span>
                            {likeCount > 0 && <span className="font-medium">{likeCount}</span>}
                        </button>
                        {post.is_exclusive && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: '#c4714a' }}>
                                Exkluzivne
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Standard post card (Pre teba tab) ── */
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
                    <div className="rounded-full p-0.5" style={{ background: 'linear-gradient(135deg, #c4714a, #f5a623)' }}>
                        <div className="rounded-full bg-white p-0.5">
                            <div className="h-9 w-9 overflow-hidden rounded-full">
                                {post.coach.avatar_url ? (
                                    <img src={post.coach.avatar_url} alt={post.coach.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                                        {post.coach.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="min-w-0 flex-1">
                    <Link href={`/coaches/${post.coach.id}`}>
                        <p className="text-sm font-semibold leading-tight" style={{ color: '#2d2118' }}>{post.coach.name}</p>
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
                        <>
                            <div className="absolute inset-0" style={{ backgroundColor: '#1a0e06' }}>
                                {post.thumbnail_url && (
                                    <img src={post.thumbnail_url} alt="" className="h-full w-full object-cover opacity-20" style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }} />
                                )}
                                {!post.thumbnail_url && post.media_url && post.media_type === 'image' && (
                                    <img src={post.media_url} alt="" className="h-full w-full object-cover opacity-20" style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }} />
                                )}
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <span className="text-4xl">🔒</span>
                                <p className="text-sm font-semibold text-white">Exkluzivny obsah</p>
                                <Link
                                    href={`/coaches/${post.coach.id}`}
                                    className="rounded-full px-5 py-2 text-xs font-bold text-white transition"
                                    style={{ backgroundColor: '#c4714a' }}
                                >
                                    Predplatit za €{price.toFixed(2)}/mes
                                </Link>
                            </div>
                        </>
                    ) : post.media_type === 'video' ? (
                        <button onClick={onPlay} className="group relative h-full w-full cursor-pointer" aria-label="Prehrat video">
                            {post.thumbnail_url ? (
                                <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full" style={{ backgroundColor: '#0d0a07' }} />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-white/35">
                                    <svg className="ml-1 h-7 w-7 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                            {post.video_duration != null && (
                                <span className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}>
                                    {formatDuration(post.video_duration)}
                                </span>
                            )}
                            {post.video_type && (
                                <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                                    {post.video_type === 'reel' ? 'Reel' : 'Video'}
                                </span>
                            )}
                        </button>
                    ) : (
                        post.media_url ? (
                            <img src={post.media_url} alt={post.title} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#f0e8df' }}>
                                <span className="text-4xl opacity-30">📸</span>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-1 px-3 pt-2">
                <button onClick={onLike} className="flex items-center gap-1 rounded-full px-2 py-1.5 transition hover:bg-gray-50">
                    <span className="text-lg leading-none">{isLiked ? '❤️' : '🤍'}</span>
                    {likeCount > 0 && (
                        <span className="text-xs font-medium" style={{ color: isLiked ? '#c4714a' : '#9a8a7a' }}>{likeCount}</span>
                    )}
                </button>
                <button className="flex items-center gap-1 rounded-full px-2 py-1.5 transition hover:bg-gray-50">
                    <span className="text-lg leading-none">💬</span>
                    <span className="text-xs font-medium" style={{ color: '#9a8a7a' }}>0</span>
                </button>
                <button onClick={onSave} className="rounded-full px-2 py-1.5 transition hover:bg-gray-50">
                    <span className="text-lg leading-none" style={{ opacity: isSaved ? 1 : 0.5 }}>🔖</span>
                </button>
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

            <div className="px-4 pb-1 pt-1">
                {post.title && (
                    <p className="text-sm font-semibold" style={{ color: '#2d2118' }}>{post.title}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed" style={{ color: '#4a3728' }}>{post.content}</p>
            </div>

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
                        Prehrat video
                    </button>
                </div>
            )}

            {post.media_type === 'none' && <div className="h-3" />}
        </div>
    );
}
