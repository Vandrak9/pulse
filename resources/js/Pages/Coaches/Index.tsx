import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Coach {
    id: number;
    user_id: number;
    name: string;
    specialization: string | null;
    monthly_price: string;
    avatar_url: string | null;
    bio: string | null;
    rating: string | null;
    subscriber_count: number;
    video_count: number;
    image_count: number;
    is_following: boolean;
}

interface PaginatedCoaches {
    data: Coach[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    coaches: PaginatedCoaches;
}

const CATEGORIES = [
    { label: 'Všetky',      keyword: null },
    { label: '💪 Silové',   keyword: 'silov' },
    { label: '🧘 Joga',     keyword: 'joga' },
    { label: '🥗 Výživa',   keyword: 'výživ' },
    { label: '🏃 Beh',      keyword: 'beh' },
    { label: '🌿 Wellness', keyword: 'wellness' },
];

export default function CoachesIndex({ coaches }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number } | null } };
    const isLoggedIn = !!auth?.user;

    const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

    // Page-level follow state so Inertia re-renders don't reset per-card state
    const [followState, setFollowState] = useState<Record<number, boolean>>(
        () => Object.fromEntries(coaches.data.map(c => [c.user_id, c.is_following]))
    );

    function handleFollow(e: React.MouseEvent, coachUserId: number) {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) return;

        // Optimistic update
        setFollowState(prev => ({ ...prev, [coachUserId]: !prev[coachUserId] }));

        router.post(`/follow/${coachUserId}`, {}, {
            preserveScroll: true,
            preserveState: true,
            only: [],
            onError: () => {
                // Revert on error
                setFollowState(prev => ({ ...prev, [coachUserId]: !prev[coachUserId] }));
            },
        });
    }

    const filtered = activeKeyword
        ? coaches.data.filter((c) =>
              c.specialization?.toLowerCase().includes(activeKeyword),
          )
        : coaches.data;

    return (
        <PulseLayout>
            <Head title="Nájdi svojho kouča" />


            <div className="min-h-screen" style={{ backgroundColor: '#faf6f0' }}>

                {/* ── Hero ── */}
                <div
                    className="px-4 py-10 text-center"
                    style={{
                        background: 'linear-gradient(160deg, #faf6f0 0%, #f5ece0 60%, #eedfd0 100%)',
                    }}
                >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#c4714a' }}>
                        PULSE Coaches
                    </p>
                    <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl" style={{ color: '#2d2118' }}>
                        Nájdi svojho kouča
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: '#9a8a7a' }}>
                        Fitness a wellness profesionáli, ktorí ti skutočne pomôžu
                    </p>
                </div>

                {/* ── Category filter ── */}
                <div
                    className="sticky top-14 z-10 border-b md:top-0"
                    style={{ backgroundColor: 'rgba(250,246,240,0.95)', backdropFilter: 'blur(8px)', borderColor: '#e8d9c4' }}
                >
                    <div className="relative mx-auto max-w-5xl">
                        <div className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto px-4 py-3 pr-10">
                            {CATEGORIES.map((cat) => {
                                const isActive = activeKeyword === cat.keyword;
                                return (
                                    <button
                                        key={cat.label}
                                        onClick={() => setActiveKeyword(cat.keyword)}
                                        className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                                        style={
                                            isActive
                                                ? { backgroundColor: '#c4714a', color: '#fff' }
                                                : { backgroundColor: '#fff', color: '#2d2118', border: '1px solid #e8d9c4' }
                                        }
                                    >
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#faf6f0] to-transparent" />
                    </div>
                </div>

                {/* ── Grid ── */}
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-lg" style={{ color: '#9a8a7a' }}>Žiadni koučovia v tejto kategórii.</p>
                            <button
                                onClick={() => setActiveKeyword(null)}
                                className="mt-4 text-sm font-medium hover:underline"
                                style={{ color: '#c4714a' }}
                            >
                                Zobraziť všetkých
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {filtered.map((coach) => (
                                <CoachCard
                                    key={coach.id}
                                    coach={coach}
                                    isLoggedIn={isLoggedIn}
                                    isFollowing={followState[coach.user_id] ?? coach.is_following}
                                    onFollow={handleFollow}
                                />
                            ))}
                        </div>
                    )}

                    {coaches.last_page > 1 && (
                        <div className="mt-10 flex justify-center gap-2">
                            {coaches.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    style={
                                        link.active
                                            ? { backgroundColor: '#c4714a', color: '#fff' }
                                            : { backgroundColor: '#fff', color: '#2d2118', border: '1px solid #e8d9c4' }
                                    }
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PulseLayout>
    );
}

function CoachCard({
    coach, isLoggedIn, isFollowing, onFollow,
}: {
    coach: Coach;
    isLoggedIn: boolean;
    isFollowing: boolean;
    onFollow: (e: React.MouseEvent, userId: number) => void;
}) {
    const price = parseFloat(coach.monthly_price);
    const rating = coach.rating ? parseFloat(coach.rating) : null;

    const contentBadges: string[] = [];
    if (coach.video_count > 0) contentBadges.push(`🎬 ${coach.video_count} videí`);
    if (coach.image_count > 0) contentBadges.push(`📸 ${coach.image_count} fotiek`);

    return (
        <div
            className="flex flex-col items-center rounded-2xl bg-white px-4 pb-5 pt-6 shadow-sm"
            style={{ border: '1px solid #e8d9c4' }}
        >
            {/* Avatar */}
            <div
                className="mb-3 h-20 w-20 flex-shrink-0 overflow-hidden rounded-full"
                style={{ outline: '2px solid #e8d9c4', outlineOffset: '2px' }}
            >
                {coach.avatar_url ? (
                    <img src={coach.avatar_url} alt={coach.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                        {coach.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <h3 className="text-center text-sm font-semibold leading-tight sm:text-base" style={{ color: '#2d2118' }}>
                {coach.name}
            </h3>

            {coach.specialization && (
                <span className="mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: '#fce8de', color: '#c4714a' }}>
                    {coach.specialization}
                </span>
            )}

            {/* Content type indicators */}
            {contentBadges.length > 0 && (
                <p className="mt-1.5 text-center text-xs" style={{ color: '#9a8a7a' }}>
                    {contentBadges.join(' · ')}
                </p>
            )}

            {coach.bio && (
                <p className="mt-2 line-clamp-1 w-full text-center text-xs leading-relaxed" style={{ color: '#9a8a7a' }}>
                    {coach.bio}
                </p>
            )}

            <div className="mt-2 flex items-center gap-2">
                {rating !== null && (
                    <>
                        <span className="flex items-center gap-0.5 text-xs">
                            <span style={{ color: '#f5a623' }}>★</span>
                            <span className="font-medium" style={{ color: '#2d2118' }}>{rating.toFixed(1)}</span>
                        </span>
                        <span className="h-3 w-px" style={{ backgroundColor: '#e8d9c4' }} />
                    </>
                )}
                <span className="text-xs" style={{ color: '#9a8a7a' }}>
                    {coach.subscriber_count.toLocaleString('sk-SK')} sledovateľov
                </span>
            </div>

            <div className="my-3 w-full border-t" style={{ borderColor: '#f0e4d4' }} />

            <p className="font-serif text-lg font-bold sm:text-xl" style={{ color: '#c4714a' }}>
                {price === 0 ? 'Zadarmo' : `€${price.toFixed(2)}`}
                {price > 0 && <span className="ml-1 font-sans text-xs font-normal" style={{ color: '#9a8a7a' }}>/ mesiac</span>}
            </p>

            <Link
                href={`/coaches/${coach.id}`}
                className="mt-3 w-full rounded-full py-2 text-center text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#c4714a' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c4714a')}
            >
                Predplatiť
            </Link>

            {isLoggedIn && (
                <button
                    onClick={(e) => onFollow(e, coach.user_id)}
                    className="mt-2 w-full rounded-full py-1.5 text-center text-xs font-semibold transition-all"
                    style={{
                        border: `1px solid ${isFollowing ? '#c4714a' : '#9a8a7a'}`,
                        color: isFollowing ? '#c4714a' : '#9a8a7a',
                        background: isFollowing ? '#fce8de' : 'none',
                        cursor: 'pointer',
                    }}
                >
                    {isFollowing ? 'Sledujem ✓' : 'Sledovať'}
                </button>
            )}
        </div>
    );
}
