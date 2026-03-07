import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Coach {
    id: number;
    name: string;
    specialization: string | null;
    monthly_price: string;
    avatar_url: string | null;
    bio?: string | null;
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
    { label: 'Všetky', value: null },
    { label: '💪 Silové', value: 'Silové' },
    { label: '🧘 Joga', value: 'Joga' },
    { label: '🥗 Výživa', value: 'Výživa' },
    { label: '🏃 Beh', value: 'Beh' },
    { label: '🌿 Wellness', value: 'Wellness' },
];

export default function CoachesIndex({ coaches }: Props) {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filtered = activeCategory
        ? coaches.data.filter(
              (c) =>
                  c.specialization
                      ?.toLowerCase()
                      .includes(activeCategory.toLowerCase()),
          )
        : coaches.data;

    return (
        <>
            <Head title="Nájdi svojho kouča" />

            <div className="min-h-screen" style={{ backgroundColor: '#faf6f0' }}>

                {/* ── Hero ── */}
                <div
                    className="px-4 pb-14 pt-16 text-center"
                    style={{
                        background:
                            'linear-gradient(160deg, #faf6f0 0%, #f5ece0 60%, #eedfd0 100%)',
                    }}
                >
                    <p
                        className="mb-3 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: '#c4714a' }}
                    >
                        PULSE Coaches
                    </p>
                    <h1
                        className="font-serif text-5xl font-bold leading-tight"
                        style={{ color: '#2d2118' }}
                    >
                        Nájdi svojho kouča
                    </h1>
                    <p
                        className="mx-auto mt-4 max-w-xl text-lg leading-relaxed"
                        style={{ color: '#9a8a7a' }}
                    >
                        Fitness a wellness profesionáli, ktorí ti skutočne pomôžu
                    </p>
                </div>

                {/* ── Category filter ── */}
                <div
                    className="sticky top-0 z-10 border-b px-4 py-3"
                    style={{
                        backgroundColor: 'rgba(250,246,240,0.92)',
                        backdropFilter: 'blur(8px)',
                        borderColor: '#e8d9c4',
                    }}
                >
                    <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-1">
                        {CATEGORIES.map((cat) => {
                            const isActive = activeCategory === cat.value;
                            return (
                                <button
                                    key={cat.label}
                                    onClick={() => setActiveCategory(cat.value)}
                                    className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                                    style={
                                        isActive
                                            ? {
                                                  backgroundColor: '#c4714a',
                                                  color: '#fff',
                                              }
                                            : {
                                                  backgroundColor: '#fff',
                                                  color: '#2d2118',
                                                  border: '1px solid #e8d9c4',
                                              }
                                    }
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Coach grid ── */}
                <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-lg" style={{ color: '#9a8a7a' }}>
                                Žiadni koučovia v tejto kategórii.
                            </p>
                            <button
                                onClick={() => setActiveCategory(null)}
                                className="mt-4 text-sm font-medium hover:underline"
                                style={{ color: '#c4714a' }}
                            >
                                Zobraziť všetkých
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3">
                            {filtered.map((coach) => (
                                <CoachCard key={coach.id} coach={coach} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {coaches.last_page > 1 && (
                        <div className="mt-12 flex justify-center gap-2">
                            {coaches.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                        !link.url
                                            ? 'pointer-events-none opacity-40'
                                            : ''
                                    }`}
                                    style={
                                        link.active
                                            ? {
                                                  backgroundColor: '#c4714a',
                                                  color: '#fff',
                                              }
                                            : {
                                                  backgroundColor: '#fff',
                                                  color: '#2d2118',
                                                  border: '1px solid #e8d9c4',
                                              }
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function CoachCard({ coach }: { coach: Coach }) {
    const price = parseFloat(coach.monthly_price);

    return (
        <div
            className="flex flex-col items-center rounded-2xl bg-white px-5 pb-6 pt-8 shadow-sm"
            style={{ border: '1px solid #e8d9c4' }}
        >
            {/* Avatar */}
            <div
                className="mb-4 h-20 w-20 flex-shrink-0 overflow-hidden rounded-full"
                style={{ outline: '2px solid #e8d9c4', outlineOffset: '2px' }}
            >
                {coach.avatar_url ? (
                    <img
                        src={coach.avatar_url}
                        alt={coach.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                        style={{ backgroundColor: '#c4714a' }}
                    >
                        {coach.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Name */}
            <h3
                className="text-center text-base font-semibold leading-tight"
                style={{ color: '#2d2118' }}
            >
                {coach.name}
            </h3>

            {/* Specialization badge */}
            {coach.specialization && (
                <span
                    className="mt-2 rounded-full px-3 py-0.5 text-xs font-medium"
                    style={{
                        backgroundColor: '#fce8de',
                        color: '#c4714a',
                    }}
                >
                    {coach.specialization}
                </span>
            )}

            {/* Bio — 2 lines max */}
            {coach.bio && (
                <p
                    className="mt-3 line-clamp-2 text-center text-xs leading-relaxed"
                    style={{ color: '#9a8a7a' }}
                >
                    {coach.bio}
                </p>
            )}

            {/* Rating + subscribers */}
            <div className="mt-3 flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs" style={{ color: '#2d2118' }}>
                    <Stars />
                    <span className="font-medium">4.8</span>
                </span>
                <span
                    className="h-3 w-px"
                    style={{ backgroundColor: '#e8d9c4' }}
                />
                <span className="text-xs" style={{ color: '#9a8a7a' }}>
                    128 sledovateľov
                </span>
            </div>

            {/* Divider */}
            <div
                className="my-4 w-full border-t"
                style={{ borderColor: '#f0e4d4' }}
            />

            {/* Price */}
            <p
                className="font-serif text-xl font-bold"
                style={{ color: '#c4714a' }}
            >
                {price === 0 ? 'Zadarmo' : `€${price.toFixed(2)}`}
                {price > 0 && (
                    <span
                        className="ml-1 font-sans text-xs font-normal"
                        style={{ color: '#9a8a7a' }}
                    >
                        / mesiac
                    </span>
                )}
            </p>

            {/* CTA */}
            <Link
                href={`/coaches/${coach.id}`}
                className="mt-4 w-full rounded-full py-2 text-center text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#c4714a' }}
                onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#5a3e2b')
                }
                onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = '#c4714a')
                }
            >
                Predplatiť
            </Link>
        </div>
    );
}

function Stars() {
    return (
        <span style={{ color: '#f5a623' }}>
            {'★★★★★'.split('').map((s, i) => (
                <span key={i} style={{ opacity: i < 5 ? 1 : 0.3 }}>
                    {s}
                </span>
            ))}
        </span>
    );
}
