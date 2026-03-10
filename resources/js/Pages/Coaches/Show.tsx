import VideoModal from '@/Components/VideoModal';
import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import { formatDuration, formatFullDate, relativeTime } from '@/lib/utils';

interface CoachData {
    id: number;
    user_id: number;
    name: string;
    bio: string | null;
    specialization: string | null;
    monthly_price: string;
    rating_avg: number;
    rating_count: number;
    subscriber_count: number;
    followers_count: number;
    is_verified: boolean;
    is_following: boolean;
    is_live: boolean;
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

interface ReviewItem {
    id: number;
    user_id: number;
    user_name: string;
    user_avatar: string | null;
    rating: number;
    content: string | null;
    created_at: string;
}

interface UserReview {
    id: number;
    rating: number;
    content: string | null;
}

interface Props {
    coach: CoachData;
    posts: Post[];
    isSubscribed: boolean;
    reviews: ReviewItem[];
    user_review: UserReview | null;
}

type Tab = 'all' | 'reels' | 'videos' | 'photos' | 'reviews';

const BENEFITS = ['Exkluzívny obsah', 'Priame správy', 'Personalizované plány'];

export default function CoachShow({ coach, posts, isSubscribed, reviews: initialReviews, user_review: initialUserReview }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number } | null } };

    const price = parseFloat(coach.monthly_price);
    const [tab, setTab] = useState<Tab>('all');
    const [activeVideo, setActiveVideo] = useState<Post | null>(null);

    // Follow state
    const [following, setFollowing] = useState(coach.is_following);
    const [followersCount, setFollowersCount] = useState(coach.followers_count);
    const [followLoading, setFollowLoading] = useState(false);

    // Review state
    const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
    const [userReview, setUserReview] = useState<UserReview | null>(initialUserReview);
    const [ratingAvg, setRatingAvg] = useState(coach.rating_avg);
    const [ratingCount, setRatingCount] = useState(coach.rating_count);
    const [reviewPage, setReviewPage] = useState(1);
    const [hasMoreReviews, setHasMoreReviews] = useState(initialReviews.length === 10);
    const [loadingMore, setLoadingMore] = useState(false);

    // Write/edit form state
    const [editMode, setEditMode] = useState(false);
    const [starValue, setStarValue] = useState(userReview?.rating ?? 0);
    const [starHover, setStarHover] = useState(0);
    const [reviewText, setReviewText] = useState(userReview?.content ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');

    async function handleFollow() {
        if (!auth?.user || followLoading) return;
        const prev = following;
        setFollowing(!prev);
        setFollowLoading(true);
        try {
            const res = await axios.post(`/follow/${coach.user_id}`);
            setFollowing(res.data.following);
            setFollowersCount(res.data.count);
        } catch {
            setFollowing(prev);
        } finally {
            setFollowLoading(false);
        }
    }

    async function handleSubmitReview() {
        if (starValue === 0) { setReviewError('Vyber hodnotenie (1–5 hviezdičiek).'); return; }
        setSubmitting(true);
        setReviewError('');
        try {
            const res = await axios.post(`/coaches/${coach.id}/reviews`, {
                rating: starValue,
                content: reviewText.trim() || null,
            });
            const { review, rating_avg, rating_count } = res.data;
            setUserReview({ id: review.id, rating: review.rating, content: review.content });
            setRatingAvg(rating_avg);
            setRatingCount(rating_count);
            // Upsert in list
            setReviews(prev => {
                const existing = prev.findIndex(r => r.user_id === auth!.user!.id);
                if (existing >= 0) {
                    const next = [...prev];
                    next[existing] = review;
                    return next;
                }
                return [review, ...prev];
            });
            setEditMode(false);
        } catch (e: any) {
            setReviewError(e?.response?.data?.message ?? 'Chyba pri ukladaní recenzie.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteReview() {
        if (!confirm('Naozaj chceš zmazať svoju recenziu?')) return;
        try {
            const res = await axios.delete(`/coaches/${coach.id}/reviews`);
            setUserReview(null);
            setRatingAvg(res.data.rating_avg);
            setRatingCount(res.data.rating_count);
            setReviews(prev => prev.filter(r => r.user_id !== auth?.user?.id));
            setStarValue(0);
            setReviewText('');
            setEditMode(false);
        } catch {}
    }

    function startEdit() {
        setStarValue(userReview?.rating ?? 0);
        setReviewText(userReview?.content ?? '');
        setEditMode(true);
    }

    async function loadMoreReviews() {
        setLoadingMore(true);
        try {
            const nextPage = reviewPage + 1;
            const res = await axios.get(`/coaches/${coach.id}/reviews?page=${nextPage}`);
            const { data, last_page } = res.data;
            setReviews(prev => [...prev, ...data]);
            setReviewPage(nextPage);
            setHasMoreReviews(nextPage < last_page);
        } catch {} finally {
            setLoadingMore(false);
        }
    }

    const reels = posts.filter((p) => p.video_type === 'reel');
    const videos = posts.filter((p) => p.video_type === 'video');
    const photos = posts.filter((p) => p.media_type === 'image');

    // Rating distribution from review list (approximate from full count)
    const distCount = reviews.reduce<Record<number, number>>((acc, r) => {
        acc[r.rating] = (acc[r.rating] ?? 0) + 1;
        return acc;
    }, {});

    const TABS: [Tab, string][] = [
        ['all', 'Všetko'],
        ['reels', 'Reels'],
        ['videos', 'Videá'],
        ['photos', 'Fotky'],
        ['reviews', `⭐ Recenzie${ratingCount > 0 ? ` (${ratingCount})` : ''}`],
    ];

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
                            &larr; Späť na koučov
                        </Link>
                    </div>
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

                        {/* LEFT COLUMN */}
                        <div className="min-w-0 flex-1 md:w-3/5">

                            {/* Coach info */}
                            <div className="pt-20 text-center md:pt-16 md:pl-44 md:text-left">
                                <h1 className="font-serif text-2xl font-bold md:text-3xl" style={{ color: '#2d2118' }}>{coach.name}</h1>
                                {coach.specialization && (
                                    <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: '#fce8de', color: '#c4714a' }}>
                                        {coach.specialization}
                                    </span>
                                )}
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm md:justify-start" style={{ color: '#9a8a7a' }}>
                                    {ratingCount > 0 && (
                                        <>
                                            <button
                                                onClick={() => setTab('reviews')}
                                                className="flex items-center gap-1 transition hover:underline"
                                            >
                                                <span style={{ color: '#f5a623' }}>&#9733;</span>
                                                <span className="font-medium" style={{ color: '#2d2118' }}>{ratingAvg.toFixed(1)}</span>
                                                <span style={{ color: '#9a8a7a' }}>({ratingCount} recenzií)</span>
                                            </button>
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
                                {coach.messages_access !== 'everyone' && coach.messages_access !== 'followers' && (
                                    <p className="mt-2 text-xs" style={{ color: '#9a8a7a' }}>
                                        {coach.messages_access === 'subscribers'
                                            ? '💬 Píše len predplatiteľom'
                                            : '💬 Správy vypnuté'}
                                    </p>
                                )}

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
                                        {coach.is_live && (
                                            <Link
                                                href={`/live/${coach.id}`}
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '8px 18px', borderRadius: 999,
                                                    background: '#dc2626', color: 'white',
                                                    fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                                    animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                                                }}
                                            >
                                                <span style={{ width: 8, height: 8, background: 'white', borderRadius: '50%', display: 'inline-block' }} />
                                                Sledovať LIVE
                                            </Link>
                                        )}
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

                            {/* Subscription box — mobile only */}
                            <div className="mt-8 md:hidden">
                                <SubscriptionBox coach={coach} price={price} isSubscribed={isSubscribed} />
                            </div>

                            {/* Content + Reviews tabs — always shown */}
                            <div className="mt-10">
                                {/* Tab bar */}
                                <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm" style={{ border: '1px solid #e8d9c4', scrollbarWidth: 'none' }}>
                                    {TABS.map(([t, label]) => (
                                        <button
                                            key={t}
                                            onClick={() => setTab(t)}
                                            className="flex-shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition"
                                            style={{
                                                backgroundColor: tab === t ? '#c4714a' : 'transparent',
                                                color: tab === t ? '#fff' : '#9a8a7a',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {tab === 'all' && (
                                    posts.length === 0
                                        ? <p className="py-10 text-center text-sm" style={{ color: '#9a8a7a' }}>Zatiaľ žiadny obsah.</p>
                                        : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {posts.slice(0, 9).map((post) => (
                                                <PostCard key={post.id} post={post} isSubscribed={isSubscribed} onPlay={() => setActiveVideo(post)} />
                                            ))}
                                          </div>
                                )}
                                {tab === 'reels' && (
                                    reels.length === 0
                                        ? <p className="py-10 text-center text-sm" style={{ color: '#9a8a7a' }}>Žiadne reels.</p>
                                        : <div className="grid grid-cols-3 gap-1">
                                            {reels.map((post) => (
                                                <ReelThumbnail key={post.id} post={post} isSubscribed={isSubscribed} onPlay={() => setActiveVideo(post)} />
                                            ))}
                                          </div>
                                )}
                                {tab === 'videos' && (
                                    videos.length === 0
                                        ? <p className="py-10 text-center text-sm" style={{ color: '#9a8a7a' }}>Žiadne videá.</p>
                                        : <div className="space-y-3">
                                            {videos.map((post) => (
                                                <VideoListCard key={post.id} post={post} isSubscribed={isSubscribed} onPlay={() => setActiveVideo(post)} />
                                            ))}
                                          </div>
                                )}
                                {tab === 'photos' && (
                                    photos.length === 0
                                        ? <p className="py-10 text-center text-sm" style={{ color: '#9a8a7a' }}>Žiadne fotky.</p>
                                        : <div className="grid grid-cols-3 gap-1">
                                            {photos.map((post) => (
                                                <PhotoThumbnail key={post.id} post={post} isSubscribed={isSubscribed} />
                                            ))}
                                          </div>
                                )}

                                {tab === 'reviews' && (
                                    <ReviewsTab
                                        coachId={coach.id}
                                        authUser={auth?.user ?? null}
                                        isSubscribed={isSubscribed}
                                        ratingAvg={ratingAvg}
                                        ratingCount={ratingCount}
                                        distCount={distCount}
                                        reviews={reviews}
                                        userReview={userReview}
                                        editMode={editMode}
                                        starValue={starValue}
                                        starHover={starHover}
                                        reviewText={reviewText}
                                        submitting={submitting}
                                        reviewError={reviewError}
                                        hasMoreReviews={hasMoreReviews}
                                        loadingMore={loadingMore}
                                        onStarHover={setStarHover}
                                        onStarSelect={setStarValue}
                                        onTextChange={setReviewText}
                                        onSubmit={handleSubmitReview}
                                        onStartEdit={startEdit}
                                        onDelete={handleDeleteReview}
                                        onCancelEdit={() => setEditMode(false)}
                                        onLoadMore={loadMoreReviews}
                                    />
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN — sticky subscription box (desktop only) */}
                        <div className="hidden md:block md:w-2/5 flex-shrink-0">
                            <div className="sticky top-6">
                                <SubscriptionBox coach={coach} price={price} isSubscribed={isSubscribed} />

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {[
                                        { icon: '💳', value: coach.subscriber_count.toLocaleString('sk-SK'), label: 'Predplatitelia' },
                                        { icon: '👥', value: followersCount.toLocaleString('sk-SK'), label: 'Sledovatelia' },
                                        { icon: '⭐', value: ratingCount > 0 ? ratingAvg.toFixed(1) : '—', label: ratingCount > 0 ? `${ratingCount} recenzií` : 'Hodnotenie' },
                                        { icon: '🎬', value: `${posts.filter(p => p.media_type === 'video').length}`, label: 'Videí' },
                                    ].map((s, i) => (
                                        <div key={i} className="rounded-2xl bg-white p-4 text-center" style={{ border: '1px solid #e8d9c4' }}>
                                            <div className="text-2xl">{s.icon}</div>
                                            <div className="mt-1 font-serif text-lg font-bold" style={{ color: '#2d2118' }}>{s.value}</div>
                                            <div className="text-xs" style={{ color: '#9a8a7a' }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

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

/* ── Reviews tab ── */
function ReviewsTab({
    coachId, authUser, isSubscribed, ratingAvg, ratingCount, distCount,
    reviews, userReview, editMode, starValue, starHover, reviewText,
    submitting, reviewError, hasMoreReviews, loadingMore,
    onStarHover, onStarSelect, onTextChange, onSubmit, onStartEdit, onDelete, onCancelEdit, onLoadMore,
}: {
    coachId: number;
    authUser: { id: number } | null;
    isSubscribed: boolean;
    ratingAvg: number;
    ratingCount: number;
    distCount: Record<number, number>;
    reviews: ReviewItem[];
    userReview: UserReview | null;
    editMode: boolean;
    starValue: number;
    starHover: number;
    reviewText: string;
    submitting: boolean;
    reviewError: string;
    hasMoreReviews: boolean;
    loadingMore: boolean;
    onStarHover: (v: number) => void;
    onStarSelect: (v: number) => void;
    onTextChange: (v: string) => void;
    onSubmit: () => void;
    onStartEdit: () => void;
    onDelete: () => void;
    onCancelEdit: () => void;
    onLoadMore: () => void;
}) {
    const showForm = authUser && isSubscribed && (!userReview || editMode);

    return (
        <div>
            {/* ── Rating summary ── */}
            {ratingCount > 0 && (
                <div className="mb-6 flex gap-6 rounded-2xl bg-white p-5" style={{ border: '1px solid #e8d9c4' }}>
                    {/* Big number */}
                    <div className="flex flex-col items-center justify-center" style={{ minWidth: 80 }}>
                        <div className="font-serif text-5xl font-bold" style={{ color: '#2d2118' }}>
                            {ratingAvg.toFixed(1)}
                        </div>
                        <div className="mt-1 flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                                <span key={s} style={{ color: s <= Math.round(ratingAvg) ? '#c4714a' : '#e8d9c4', fontSize: 16 }}>★</span>
                            ))}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: '#9a8a7a' }}>{ratingCount} recenzií</div>
                    </div>
                    {/* Bar chart */}
                    <div className="flex flex-1 flex-col gap-1.5 justify-center">
                        {[5,4,3,2,1].map(star => {
                            const cnt = distCount[star] ?? 0;
                            const pct = ratingCount > 0 ? Math.round((cnt / ratingCount) * 100) : 0;
                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="w-4 text-right text-xs font-medium" style={{ color: '#2d2118' }}>{star}</span>
                                    <span style={{ color: '#c4714a', fontSize: 12 }}>★</span>
                                    <div className="flex-1 overflow-hidden rounded-full" style={{ height: 6, backgroundColor: '#f0e8df' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#c4714a', borderRadius: 999, transition: 'width 0.4s' }} />
                                    </div>
                                    <span className="w-8 text-right text-xs" style={{ color: '#9a8a7a' }}>{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Own existing review (view mode) ── */}
            {userReview && !editMode && (
                <div className="mb-6 rounded-2xl bg-white p-4" style={{ border: '2px solid #c4714a' }}>
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: '#c4714a' }}>Tvoja recenzia</span>
                        <div className="flex gap-2">
                            <button
                                onClick={onStartEdit}
                                style={{ fontSize: 12, color: '#9a8a7a', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                            >
                                ✏️ Upraviť
                            </button>
                            <button
                                onClick={onDelete}
                                style={{ fontSize: 12, color: '#e05a3a', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                            >
                                🗑️ Zmazať
                            </button>
                        </div>
                    </div>
                    <StarDisplay rating={userReview.rating} size={18} />
                    {userReview.content && (
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: '#4a3728' }}>{userReview.content}</p>
                    )}
                </div>
            )}

            {/* ── Write / Edit form ── */}
            {showForm && (
                <div className="mb-6 rounded-2xl bg-white p-5" style={{ border: '1px solid #e8d9c4' }}>
                    <h3 className="mb-3 font-semibold" style={{ color: '#2d2118', fontSize: 15 }}>
                        {editMode ? 'Upraviť recenziu' : 'Zanechaj hodnotenie'}
                    </h3>
                    {/* Star picker */}
                    <div className="mb-3 flex gap-1">
                        {[1,2,3,4,5].map(star => (
                            <button
                                key={star}
                                onClick={() => onStarSelect(star)}
                                onMouseEnter={() => onStarHover(star)}
                                onMouseLeave={() => onStarHover(0)}
                                style={{
                                    fontSize: 32, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer',
                                    color: star <= (starHover || starValue) ? '#c4714a' : '#d4c4b4',
                                    transform: star <= (starHover || starValue) ? 'scale(1.15)' : 'scale(1)',
                                    transition: 'all 0.1s',
                                }}
                            >
                                ★
                            </button>
                        ))}
                        {starValue > 0 && (
                            <span className="ml-2 self-center text-sm font-medium" style={{ color: '#9a8a7a' }}>
                                {['', 'Slabé', 'Ujde', 'Dobré', 'Výborné', 'Perfektné'][starValue]}
                            </span>
                        )}
                    </div>
                    {/* Text area */}
                    <div className="relative">
                        <textarea
                            value={reviewText}
                            onChange={e => onTextChange(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Napíš recenziu... (voliteľné)"
                            style={{
                                width: '100%', borderRadius: 12, border: '1px solid #e8d9c4',
                                padding: '10px 12px', fontSize: 14, color: '#2d2118',
                                background: '#faf6f0', resize: 'vertical', outline: 'none',
                                fontFamily: 'inherit', lineHeight: 1.6,
                                boxSizing: 'border-box',
                            }}
                            onFocus={e => (e.target.style.borderColor = '#c4714a')}
                            onBlur={e => (e.target.style.borderColor = '#e8d9c4')}
                        />
                        <span className="absolute bottom-2.5 right-3 text-xs" style={{ color: '#c4b8a8' }}>
                            {reviewText.length}/500
                        </span>
                    </div>
                    {reviewError && (
                        <p className="mt-2 text-xs" style={{ color: '#e05a3a' }}>{reviewError}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={onSubmit}
                            disabled={submitting}
                            style={{
                                flex: 1, padding: '10px 0', borderRadius: 999,
                                background: '#c4714a', color: 'white', fontWeight: 600,
                                fontSize: 14, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? 'Ukladám...' : editMode ? 'Uložiť zmeny' : 'Zverejniť hodnotenie'}
                        </button>
                        {editMode && (
                            <button
                                onClick={onCancelEdit}
                                style={{
                                    padding: '10px 18px', borderRadius: 999,
                                    border: '1px solid #e8d9c4', background: 'none',
                                    color: '#9a8a7a', fontSize: 14, cursor: 'pointer',
                                }}
                            >
                                Zrušiť
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* CTA for non-subscribers */}
            {authUser && !isSubscribed && !userReview && (
                <div className="mb-6 rounded-2xl p-4 text-center" style={{ background: '#fce8de', border: '1px solid #f0c4a8' }}>
                    <p className="text-sm font-medium" style={{ color: '#2d2118' }}>
                        Predplaťte sa pre zanechanie recenzie
                    </p>
                    <p className="mt-1 text-xs" style={{ color: '#9a8a7a' }}>Recenzie môžu zanechávať len aktívni predplatitelia</p>
                </div>
            )}

            {/* ── Reviews list ── */}
            {reviews.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-lg" style={{ color: '#9a8a7a' }}>Zatiaľ žiadne recenzie</p>
                    {isSubscribed && (
                        <p className="mt-1 text-sm" style={{ color: '#c4714a' }}>Buď prvý, kto ohodnotí tohto kouča!</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                    {hasMoreReviews && (
                        <button
                            onClick={onLoadMore}
                            disabled={loadingMore}
                            style={{
                                display: 'block', width: '100%', padding: '12px',
                                borderRadius: 12, border: '1px solid #e8d9c4',
                                background: 'white', color: '#c4714a', fontWeight: 600,
                                fontSize: 14, cursor: loadingMore ? 'not-allowed' : 'pointer',
                                opacity: loadingMore ? 0.7 : 1,
                            }}
                        >
                            {loadingMore ? 'Načítavam...' : 'Zobraziť ďalšie recenzie'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Single review card ── */
function ReviewCard({ review }: { review: ReviewItem }) {
    const initials = review.user_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return (
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #e8d9c4' }}>
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                    style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: review.user_avatar ? 'transparent' : '#c4714a',
                        overflow: 'hidden', display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {review.user_avatar ? (
                        <img src={review.user_avatar} alt={review.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{initials}</span>
                    )}
                </div>
                {/* Meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: '#2d2118' }}>{review.user_name}</span>
                        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: '#e8f4ec', color: '#4a7c59' }}>
                            ✓ Overený predplatiteľ
                        </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                        <StarDisplay rating={review.rating} size={14} />
                        <span className="text-xs" style={{ color: '#9a8a7a' }}>
                            {review.created_at ? relativeTime(review.created_at) : ''}
                        </span>
                    </div>
                    {review.content && (
                        <p className="mt-2 text-sm leading-relaxed" style={{ color: '#4a3728' }}>
                            &ldquo;{review.content}&rdquo;
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Star display (read-only) ── */
function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <div style={{ display: 'inline-flex', gap: 1 }}>
            {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: size, color: s <= rating ? '#c4714a' : '#e8d9c4', lineHeight: 1 }}>★</span>
            ))}
        </div>
    );
}

/* ── Subscription box (shared mobile/desktop) ── */
function SubscriptionBox({ coach, price, isSubscribed }: { coach: CoachData; price: number; isSubscribed: boolean }) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number } | null } };
    const [cancelling, setCancelling] = useState(false);

    function handleSubscribe() {
        if (!auth?.user) { router.visit('/login'); return; }
        router.visit(`/subscribe/${coach.id}`);
    }

    function handleCancel() {
        if (!confirm('Naozaj chceš zrušiť predplatné?')) return;
        setCancelling(true);
        router.post(`/subscription/cancel/${coach.id}`, {}, { onFinish: () => setCancelling(false) });
    }

    return (
        <div className="rounded-2xl bg-white p-6 shadow-md" style={{ border: '1px solid #e8d9c4' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9a8a7a' }}>Predplatné</p>
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

/* ── Reel thumbnail ── */
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
                            Exkluzívne
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
        post.media_type === 'image' ? 'Foto' : 'Článok';

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
                                <p className="text-center text-xs font-semibold text-white">Predplaťte sa pre prístup</p>
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
                        Exkluzívne
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
                    <p className="text-center text-xs font-semibold" style={{ color: '#2d2118' }}>Predplaťte sa pre prístup</p>
                </div>
            )}
        </div>
    );
}
