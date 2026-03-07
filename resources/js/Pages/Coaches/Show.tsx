import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link } from '@inertiajs/react';

interface CoachData {
    id: number;
    name: string;
    bio: string | null;
    specialization: string | null;
    monthly_price: string;
    rating: string | null;
    subscriber_count: number;
    is_verified: boolean;
    avatar_url: string | null;
}

interface Post {
    id: number;
    title: string;
    content: string;
    media_type: 'none' | 'image' | 'video';
    media_path: string | null;
    thumbnail_path: string | null;
    video_duration: string | null;
    is_exclusive: boolean;
    created_at: string;
}

interface Props {
    coach: CoachData;
    posts: Post[];
    isSubscribed: boolean;
}

const BENEFITS = ['Exkluzívny obsah', 'Priame správy', 'Personalizované plány'];

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('sk-SK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(dateStr));
}

export default function CoachShow({ coach, posts, isSubscribed }: Props) {
    const price = parseFloat(coach.monthly_price);
    const rating = coach.rating ? parseFloat(coach.rating) : null;

    return (
        <PulseLayout>
            <Head title={coach.name} />

            <div className="min-h-screen pb-20" style={{ backgroundColor: '#faf6f0' }}>

                {/* ── Hero cover ── */}
                <div
                    className="relative h-[200px] w-full"
                    style={{ background: 'linear-gradient(to right, #c4714a, #5a3e2b)' }}
                >
                    {/* Back button inside cover */}
                    <div className="absolute left-4 top-4 z-10 sm:left-6">
                        <Link
                            href="/coaches"
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
                        >
                            ← Späť na koučov
                        </Link>
                    </div>

                    {/* Avatar overlapping cover */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <div
                            className="h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-white shadow-lg"
                            style={{ backgroundColor: '#c4714a' }}
                        >
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

                <div className="mx-auto max-w-2xl px-4 sm:px-6">

                    {/* ── Coach info ── */}
                    <div className="pt-20 text-center">
                        <h1 className="font-serif text-2xl font-bold" style={{ color: '#2d2118' }}>
                            {coach.name}
                        </h1>

                        {coach.specialization && (
                            <span
                                className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                                style={{ backgroundColor: '#fce8de', color: '#c4714a' }}
                            >
                                {coach.specialization}
                            </span>
                        )}

                        <div className="mt-3 flex items-center justify-center gap-3 text-sm" style={{ color: '#9a8a7a' }}>
                            {rating !== null && (
                                <>
                                    <span className="flex items-center gap-1">
                                        <span style={{ color: '#f5a623' }}>★</span>
                                        <span className="font-medium" style={{ color: '#2d2118' }}>{rating.toFixed(1)}</span>
                                    </span>
                                    <span style={{ color: '#e8d9c4' }}>|</span>
                                </>
                            )}
                            <span>{coach.subscriber_count.toLocaleString('sk-SK')} sledovateľov</span>
                            {coach.is_verified && (
                                <>
                                    <span style={{ color: '#e8d9c4' }}>|</span>
                                    <span className="font-medium" style={{ color: '#4a7c59' }}>✓ Overený</span>
                                </>
                            )}
                        </div>

                        {coach.bio && (
                            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed" style={{ color: '#6b5e52' }}>
                                {coach.bio}
                            </p>
                        )}
                    </div>

                    {/* ── Subscription box ── */}
                    <div className="mt-8 rounded-2xl bg-white p-6 shadow-md" style={{ border: '1px solid #e8d9c4' }}>
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9a8a7a' }}>
                            Predplatné
                        </p>
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
                                        ✓
                                    </span>
                                    {b}
                                </li>
                            ))}
                        </ul>

                        {isSubscribed ? (
                            <div className="mt-5 w-full rounded-full py-3 text-center text-sm font-semibold text-white" style={{ backgroundColor: '#4a7c59' }}>
                                ✓ Predplatené
                            </div>
                        ) : (
                            <button
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

                    {/* ── Content preview ── */}
                    {posts.length > 0 && (
                        <div className="mt-10">
                            <h2 className="mb-4 font-serif text-xl font-bold" style={{ color: '#2d2118' }}>
                                Ukážka obsahu
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {posts.slice(0, 3).map((post) => (
                                    <PostCard key={post.id} post={post} isSubscribed={isSubscribed} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PulseLayout>
    );
}

function PostCard({ post, isSubscribed }: { post: Post; isSubscribed: boolean }) {
    const locked = post.is_exclusive && !isSubscribed;

    const typeLabel =
        post.media_type === 'video' ? '🎬 Video' :
        post.media_type === 'image' ? '📸 Foto' : '📝 Článok';

    const typeBg =
        post.media_type === 'video' ? '#1a1a2e' :
        post.media_type === 'image' ? '#2d4a3e' : '#3d2b1f';

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm" style={{ border: '1px solid #e8d9c4' }}>

            {/* Media area — video or image */}
            {post.media_type === 'video' && (
                <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
                    {locked ? (
                        /* Blurred locked video */
                        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-4xl">🔒</span>
                                <p className="text-center text-xs font-semibold text-white">Predplaťte sa pre prístup</p>
                            </div>
                        </div>
                    ) : (
                        /* Playable video thumbnail */
                        <button
                            className="flex h-full w-full items-center justify-center"
                            style={{ backgroundColor: '#111827' }}
                            onClick={() => alert('Video prehrávanie bude dostupné čoskoro')}
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30">
                                <span className="ml-1 text-2xl text-white">▶</span>
                            </div>
                        </button>
                    )}

                    {/* Duration badge */}
                    {post.video_duration && !locked && (
                        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                            {post.video_duration}
                        </span>
                    )}

                    {/* Type badge */}
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

            {/* Text content */}
            <div className={`p-4 ${locked && post.media_type === 'none' ? 'select-none blur-sm' : ''}`}>
                {post.media_type === 'none' && (
                    <span className="mb-2 inline-block rounded px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: typeBg }}>
                        {typeLabel}
                    </span>
                )}

                {post.is_exclusive && (
                    <span className="mb-2 ml-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: '#c4714a' }}>
                        Exkluzívne
                    </span>
                )}

                <h3 className="text-sm font-semibold leading-snug" style={{ color: '#2d2118' }}>
                    {post.title}
                </h3>

                {post.media_type === 'none' && (
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed" style={{ color: '#9a8a7a' }}>
                        {post.content}
                    </p>
                )}

                <p className="mt-3 text-xs" style={{ color: '#c4b8a8' }}>
                    {formatDate(post.created_at)}
                </p>
            </div>

            {/* Full overlay for locked text posts */}
            {locked && post.media_type === 'none' && (
                <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(250,246,240,0.75)' }}
                >
                    <span className="text-3xl">🔒</span>
                    <p className="text-center text-xs font-semibold" style={{ color: '#2d2118' }}>
                        Predplaťte sa pre prístup
                    </p>
                </div>
            )}
        </div>
    );
}
