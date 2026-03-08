import VideoModal from '@/Components/VideoModal';
import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import { formatDuration, formatFullDate } from '@/lib/utils';

interface CoachData {
    id: number;
    user_id: number;
    name: string;
    bio: string | null;
    specialization: string | null;
    monthly_price: string;
    rating: string | null;
    subscriber_count: number;
    followers_count: number;
    is_verified: boolean;
    is_following: boolean;
    messages_access: 'everyone' | 'followers' | 'subscribers' | 'nobody';
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
    created_at: string;
}

interface Props {
    coach: CoachData;
    posts: Post[];
    isSubscribed: boolean;
}

type Tab = 'all' | 'reels' | 'videos' | 'photos';

const BENEFITS = ['Exkluzivny obsah', 'Priame spravy', 'Personalizovane plany'];

export default function CoachShow({ coach, posts, isSubscribed }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number } | null } };

    const price = parseFloat(coach.monthly_price);
    const rating = coach.rating ? parseFloat(coach.rating) : null;
    const [tab, setTab] = useState<Tab>('all');
    const [activeVideo, setActiveVideo] = useState<Post | null>(null);

    // Follow state
    const [following, setFollowing] = useState(coach.is_following);
    const [followersCount, setFollowersCount] = useState(coach.followers_count);
    const [followLoading, setFollowLoading] = useState(false);

    async function handleFollow() {
        if (!auth?.user || followLoading) return;

        const prev = following;
        setFollowing(!prev); // optimistic
        setFollowLoading(true);

        try {
            const res = await axios.post(`/follow/${coach.user_id}`);
            setFollowing(res.data.following);
            setFollowersCount(res.data.count);
        } catch {
            setFollowing(prev); // revert
        } finally {
            setFollowLoading(false);
        }
    }

    const reels = posts.filter((p) => p.video_type === 'reel');
    const videos = posts.filter((p) => p.video_type === 'video');
    const photos = posts.filter((p) => p.media_type === 'image');

    return (
        <PulseLayout>
            <Head title={coach.name} />

            {activeVideo && activeVideo.media_url && (
                <VideoModal
                    videoUrl={activeVideo.media_url}
                    title={activeVideo.title}
                    coachName={coach.name}
                    onClose={() => setActiveVideo(null)}
                />
            )}

            <div className="min-h-screen pb-20" style={{ backgroundColor: '#faf6f0' }}>

                {/* Hero cover */}
                <div className="relative h-[200px] w-full md:h-[240px]" style={{ background: 'linear-gradient(to right, #c4714a, #5a3e2b)' }}>
                    <div className="absolute left-4 top-4 z-10 sm:left-6">
                        <Link
                            href="/coaches"
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
                        >
                            &larr; Spat na koucov
                        </Link>
                    </div>
                    {/* Avatar — mobile: centered, desktop: left-aligned within container */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 md:left-8 md:translate-x-0">
                        <div className="h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-white shadow-lg md:h-[140px] md:w-[140px]" style={{ backgroundColor: '#c4714a' }}>
                            {coach.avatar_url ? (
                                <img src={coach.avatar_url} alt={coach.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                                    {coach.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Desktop two-column layout / Mobile single-column ── */}
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <div className="flex flex-col gap-8 md:flex-row md:gap-10 md:pt-6">

                        {/* LEFT COLUMN — profile info + content (60%) */}
                        <div className="min-w-0 flex-1 md:w-3/5">

                            {/* Coach info — mobile: centered with padding-top for avatar; desktop: left-aligned */}
                            <div className="pt-20 text-center md:pt-16 md:pl-44 md:text-left">
                                <h1 className="font-serif text-2xl font-bold md:text-3xl" style={{ color: '#2d2118' }}>{coach.name}</h1>
                                {coach.specialization && (
                                    <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: '#fce8de', color: '#c4714a' }}>
                                        {coach.specialization}
                                    </span>
                                )}
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm md:justify-start" style={{ color: '#9a8a7a' }}>
                                    {rating !== null && (
                                        <>
                                            <span className="flex items-center gap-1">
                                                <span style={{ color: '#f5a623' }}>&#9733;</span>
                                                <span className="font-medium" style={{ color: '#2d2118' }}>{rating.toFixed(1)}</span>
                                                <span style={{ color: '#9a8a7a' }}>({followersCount} hodnotení)</span>
                                            </span>
                                            <span style={{ color: '#e8d9c4' }}>|</span>
                                        </>
                                    )}
                                    <span>{coach.subscriber_count.toLocaleString('sk-SK')} predplatiteľov</span>
                                    <span style={{ color: '#e8d9c4' }}>|</span>
                                    <span>{followersCount.toLocaleString('sk-SK')} sledovateľov</span>
                                    {coach.is_verified && (
                                        <>
                                            <span style={{ color: '#e8d9c4' }}>|</span>
                                            <span className="font-medium" style={{ color: '#4a7c59' }}>&#10003; Overený</span>
                                        </>
                                    )}
                                </div>
                                {coach.bio && (
                                    <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed md:mx-0" style={{ color: '#6b5e52' }}>{coach.bio}</p>
                                )}
                                {/* Message access badge */}
                                {coach.messages_access !== 'everyone' && coach.messages_access !== 'followers' && (
                                    <p className="mt-2 text-xs" style={{ color: '#9a8a7a' }}>
                                        {coach.messages_access === 'subscribers'
                                            ? '💬 Píše len predplatiteľom'
                                            : '💬 Správy vypnuté'}
                                    </p>
                                )}

                                {/* Follow + Message buttons */}
                                {auth?.user && auth.user.id !== coach.user_id && (
                                    <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                                        <button
                                            onClick={handleFollow}
                                            disabled={followLoading}
                                            style={{
                                                padding: '8px 22px', borderRadius: 999,
                                                border: `1px solid ${following ? '#4a7c59' : '#c4714a'}`,
                                                background: following ? '#4a7c59' : 'none',
                                                color: following ? 'white' : '#c4714a',
                                                fontSize: 13, fontWeight: 600,
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                opacity: followLoading ? 0.6 : 1,
                                            }}
                                        >
                                            {following ? '✓ Sledujem' : '+ Sledovať'}
                                        </button>
                                        {coach.messages_access !== 'nobody' && (
                                            <Link
                                                href={`/messages/${coach.user_id}`}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '8px 18px', borderRadius: 999,
                                                    border: '1px solid #c4714a', color: '#c4714a',
                                                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#fce8de'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                💬 Napísať správu
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Subscription box — mobile only (on desktop it's in right column) */}
                            <div className="mt-8 md:hidden">
                                <SubscriptionBox coach={coach} price={price} isSubscribed={isSubscribed} />
                            </div>

                            {/* Content tabs */}
                            {posts.length > 0 && (
                                <div className="mt-10">
                                    {/* Tab bar */}
                                    <div className="mb-5 flex rounded-2xl bg-white p-1 shadow-sm" style={{ border: '1px solid #e8d9c4' }}>
                                        {([
                                            ['all', 'Vsetko'],
                                            ['reels', 'Reels'],
                                            ['videos', 'Videa'],
                                            ['photos', 'Fotky'],
                                        ] as [Tab, string][]).map(([t, label]) => (
                                            <button
                                                key={t}
                                                onClick={() => setTab(t)}
                                                className="flex-1 rounded-xl py-2 text-xs font-semibold transition"
                                                style={{
                                                    backgroundColor: tab === t ? '#c4714a' : 'transparent',
                                                    color: tab === t ? '#fff' : '#9a8a7a',
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {tab === 'all' && (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {posts.slice(0, 9).map((post) => (
                                                <PostCard key={post.id} post={post} isSubscribed={isSubscribed} onPlay={() => setActiveVideo(post)} />
                                            ))}
                                        </div>
                                    )}
                                    {tab === 'reels' && (
                                        reels.length === 0 ? (
                                            <p className="py-10 text-center text-sm" style={{ color: '#9a8a7a' }}>Ziadne reels.</p>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-1">
                                                {reels.map((post) => (
                                                    <ReelThumbnail key={post.id} post={post} isSubscribed={isSubscribed} onPlay={() => setActiveVideo(post)} />
                                                ))}
                                            </div>
                                        )
                                    )}
                                    {tab === 'videos' && (
                                        videos.length === 0 ? (
                                            <p className="py-10 text-center text-sm" style={{ color: '#9a8a7a' }}>Ziadne videa.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {videos.map((post) => (
                                                    <VideoListCard key={post.id} post={post} isSubscribed={isSubscribed} onPlay={() => setActiveVideo(post)} />
                                                ))}
                                            </div>
                                        )
                                    )}
                                    {tab === 'photos' && (
                                        photos.length === 0 ? (
                                            <p className="py-10 text-center text-sm" style={{ color: '#9a8a7a' }}>Ziadne fotky.</p>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-1">
                                                {photos.map((post) => (
                                                    <PhotoThumbnail key={post.id} post={post} isSubscribed={isSubscribed} />
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN — sticky subscription box (desktop only) */}
                        <div className="hidden md:block md:w-2/5 flex-shrink-0">
                            <div className="sticky top-6">
                                <SubscriptionBox coach={coach} price={price} isSubscribed={isSubscribed} />

                                {/* Extra stats */}
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {[
                                        { icon: '💳', value: coach.subscriber_count.toLocaleString('sk-SK'), label: 'Predplatitelia' },
                                        { icon: '👥', value: followersCount.toLocaleString('sk-SK'), label: 'Sledovatelia' },
                                        { icon: '⭐', value: rating !== null ? rating.toFixed(1) : '—', label: 'Hodnotenie' },
                                        { icon: '🎬', value: `${posts.filter(p => p.media_type === 'video').length}`, label: 'Videí' },
                                    ].map((s, i) => (
                                        <div key={i} className="rounded-2xl bg-white p-4 text-center" style={{ border: '1px solid #e8d9c4' }}>
                                            <div className="text-2xl">{s.icon}</div>
                                            <div className="mt-1 font-serif text-lg font-bold" style={{ color: '#2d2118' }}>{s.value}</div>
                                            <div className="text-xs" style={{ color: '#9a8a7a' }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Message button */}
                                {coach.messages_access !== 'nobody' && auth?.user && auth.user.id !== coach.user_id && (
                                    <Link
                                        href={`/messages/${coach.user_id}`}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition"
                                        style={{ borderColor: '#c4714a', color: '#c4714a' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#fce8de')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        💬 Napísať správu
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}

/* ── Subscription box (shared mobile/desktop) ── */
function SubscriptionBox({ coach, price, isSubscribed }: { coach: CoachData; price: number; isSubscribed: boolean }) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number } | null } };
    const [cancelling, setCancelling] = useState(false);

    function handleSubscribe() {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        router.visit(`/subscribe/${coach.id}`);
    }

    function handleCancel() {
        if (!confirm('Naozaj chceš zrušiť predplatné?')) return;
        setCancelling(true);
        router.post(`/subscription/cancel/${coach.id}`, {}, {
            onFinish: () => setCancelling(false),
        });
    }

    return (
        <div className="rounded-2xl bg-white p-6 shadow-md" style={{ border: '1px solid #e8d9c4' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9a8a7a' }}>Predplatne</p>
            <div className="mt-1 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-bold" style={{ color: '#c4714a' }}>
                    {price === 0 ? 'Zadarmo' : `€${price.toFixed(2)}`}
                </span>
                {price > 0 && <span className="text-sm" style={{ color: '#9a8a7a' }}>/ mesiac</span>}
            </div>
            <ul className="mt-4 space-y-2">
                {BENEFITS.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm" style={{ color: '#2d2118' }}>
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                            &#10003;
                        </span>
                        {b}
                    </li>
                ))}
            </ul>
            {isSubscribed ? (
                <>
                    <div className="mt-5 w-full rounded-full py-3 text-center text-sm font-semibold text-white" style={{ backgroundColor: '#4a7c59' }}>
                        &#10003; Predplatené
                    </div>
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="mt-2 w-full rounded-full py-2 text-xs font-medium transition"
                        style={{ color: '#9a8a7a', background: 'none', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.5 : 1 }}
                    >
                        {cancelling ? 'Rušim...' : 'Zrušiť predplatné'}
                    </button>
                </>
            ) : (
                <button
                    onClick={handleSubscribe}
                    className="mt-5 w-full rounded-full py-3 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#c4714a' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c4714a')}
                >
                    Predplatiť teraz
                </button>
            )}
            <p className="mt-2 text-center text-xs" style={{ color: '#9a8a7a' }}>Zruš kedykoľvek</p>
        </div>
    );
}

/* ── Reel thumbnail (3-col 9:16) ── */
function ReelThumbnail({ post, isSubscribed, onPlay }: { post: Post; isSubscribed: boolean; onPlay: () => void }) {
    const locked = post.is_exclusive && !isSubscribed;
    return (
        <button
            onClick={locked ? undefined : onPlay}
            className="relative overflow-hidden rounded-lg"
            style={{ aspectRatio: '9/16', backgroundColor: '#111', display: 'block', width: '100%' }}
        >
            {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
            ) : (
                <div className="h-full w-full" style={{ backgroundColor: '#1a1a1a' }} />
            )}
            {locked ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="text-xl">🔒</span>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/50 to-transparent p-2">
                    <svg className="h-4 w-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    {post.video_duration != null && (
                        <span className="ml-1 text-xs font-medium text-white">{formatDuration(post.video_duration)}</span>
                    )}
                </div>
            )}
        </button>
    );
}

/* ── Video list card ── */
function VideoListCard({ post, isSubscribed, onPlay }: { post: Post; isSubscribed: boolean; onPlay: () => void }) {
    const locked = post.is_exclusive && !isSubscribed;
    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #e8d9c4' }}>
            <div className="flex gap-3 p-3">
                <button
                    onClick={locked ? undefined : onPlay}
                    className="relative flex-shrink-0 overflow-hidden rounded-xl"
                    style={{ width: 140, aspectRatio: '16/9', backgroundColor: '#111' }}
                >
                    {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full" style={{ backgroundColor: '#1a1a1a' }} />
                    )}
                    {locked ? (
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
                    {post.video_duration != null && !locked && (
                        <span className="absolute bottom-1 right-1 rounded px-1 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
                            {formatDuration(post.video_duration)}
                        </span>
                    )}
                </button>
                <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug" style={{ color: '#2d2118' }}>
                        {post.title || post.content}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: '#9a8a7a' }}>{formatFullDate(post.created_at)}</p>
                    {post.is_exclusive && (
                        <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: '#c4714a' }}>
                            Exkluzivne
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Photo thumbnail ── */
function PhotoThumbnail({ post, isSubscribed }: { post: Post; isSubscribed: boolean }) {
    const locked = post.is_exclusive && !isSubscribed;
    return (
        <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '1/1', backgroundColor: '#e8d9c4' }}>
            {post.media_url && !locked ? (
                <img src={post.media_url} alt={post.title} className="h-full w-full object-cover" />
            ) : locked ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1" style={{ backgroundColor: '#e8d9c4' }}>
                    <span className="text-2xl">🔒</span>
                </div>
            ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#f0e8df' }}>
                    <span className="text-3xl opacity-40">📸</span>
                </div>
            )}
        </div>
    );
}

/* ── All-tab post card ── */
function PostCard({ post, isSubscribed, onPlay }: { post: Post; isSubscribed: boolean; onPlay: () => void }) {
    const locked = post.is_exclusive && !isSubscribed;

    const typeLabel =
        post.video_type === 'reel' ? 'Reel' :
        post.video_type === 'video' ? 'Video' :
        post.media_type === 'image' ? 'Foto' : 'Clanok';

    const typeBg =
        post.media_type === 'video' ? '#1a1a2e' :
        post.media_type === 'image' ? '#2d4a3e' : '#3d2b1f';

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #e8d9c4' }}>
            {post.media_type === 'video' && (
                <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                    {locked ? (
                        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-4xl">🔒</span>
                                <p className="text-center text-xs font-semibold text-white">Predplatime sa pre pristup</p>
                            </div>
                        </div>
                    ) : (
                        <button className="relative flex h-full w-full items-center justify-center" style={{ backgroundColor: '#111827' }} onClick={onPlay}>
                            {post.thumbnail_url && (
                                <img src={post.thumbnail_url} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
                            )}
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30">
                                <span className="ml-1 text-2xl text-white">&#9654;</span>
                            </div>
                        </button>
                    )}
                    {post.video_duration != null && !locked && (
                        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                            {formatDuration(post.video_duration)}
                        </span>
                    )}
                    <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: typeBg }}>
                        {typeLabel}
                    </span>
                </div>
            )}

            {post.media_type === 'image' && (
                <div className="relative aspect-video w-full overflow-hidden">
                    {locked ? (
                        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#e8d9c4' }}>
                            <span className="text-3xl">🔒</span>
                        </div>
                    ) : post.media_url ? (
                        <img src={post.media_url} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#f0e8df' }}>
                            <span className="text-4xl">📸</span>
                        </div>
                    )}
                    <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: typeBg }}>
                        {typeLabel}
                    </span>
                </div>
            )}

            <div className={`p-4 ${locked && post.media_type === 'none' ? 'select-none blur-sm' : ''}`}>
                {post.media_type === 'none' && (
                    <span className="mb-2 inline-block rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: typeBg }}>
                        {typeLabel}
                    </span>
                )}
                {post.is_exclusive && (
                    <span className="mb-2 ml-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: '#c4714a' }}>
                        Exkluzivne
                    </span>
                )}
                <h3 className="text-sm font-semibold leading-snug" style={{ color: '#2d2118' }}>{post.title}</h3>
                {post.media_type === 'none' && (
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed" style={{ color: '#9a8a7a' }}>{post.content}</p>
                )}
                <p className="mt-3 text-xs" style={{ color: '#c4b8a8' }}>{formatFullDate(post.created_at)}</p>
            </div>

            {locked && post.media_type === 'none' && (
                <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(250,246,240,0.75)' }}
                >
                    <span className="text-3xl">🔒</span>
                    <p className="text-center text-xs font-semibold" style={{ color: '#2d2118' }}>Predplatime sa pre pristup</p>
                </div>
            )}
        </div>
    );
}
