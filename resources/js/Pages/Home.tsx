import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link } from '@inertiajs/react';

interface Coach {
    id: number;
    name: string;
    specialization: string | null;
    monthly_price: string;
    rating: string | null;
    subscriber_count: number;
    avatar_url: string | null;
}

interface Props {
    featured: Coach[];
}

const CATEGORIES = [
    { label: 'Silové',   emoji: '💪', keyword: 'silov' },
    { label: 'Joga',     emoji: '🧘', keyword: 'joga' },
    { label: 'Výživa',   emoji: '🥗', keyword: 'výživ' },
    { label: 'Beh',      emoji: '🏃', keyword: 'beh' },
    { label: 'Wellness', emoji: '🌿', keyword: 'wellness' },
    { label: 'Všetky',   emoji: '✨', keyword: '' },
];

const HOW_IT_WORKS = [
    { step: '01', icon: '🔍', title: 'Nájdi kouča',  desc: 'Prehľadaj stovky overených fitness profesionálov a nájdi toho pravého pre teba.' },
    { step: '02', icon: '💳', title: 'Predplať si',   desc: 'Jednoduché mesačné predplatné. Žiadne zmluvy, zruš kedykoľvek.' },
    { step: '03', icon: '💪', title: 'Trénuj',        desc: 'Získaj prístup k exkluzívnemu obsahu, videám a priamej komunikácii s koučom.' },
];

export default function Home({ featured }: Props) {
    return (
        <PulseLayout>
            <Head title="PULSE — Fitness koučing" />

            {/* ── Hero ── */}
            <section
                className="relative overflow-hidden px-4 py-20 text-center sm:py-28"
                style={{ background: 'linear-gradient(160deg, #faf6f0 0%, #f5ece0 50%, #eedfd0 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: '#c4714a' }} />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#4a7c59' }} />

                <div className="relative mx-auto max-w-2xl">
                    <span
                        className="mb-4 inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                        style={{ backgroundColor: '#c4714a' }}
                    >
                        #1 Fitness platforma na Slovensku
                    </span>

                    <h1 className="mt-4 font-serif text-5xl font-bold leading-tight sm:text-6xl" style={{ color: '#2d2118' }}>
                        Tvoj fitness journey
                        <br />
                        <span style={{ color: '#c4714a' }}>začína tu</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed" style={{ color: '#6b5e52' }}>
                        Predplaťte si koučov ktorí vám skutočne pomôžu dosiahnuť vaše ciele — bez zbytočností, len výsledky.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/coaches"
                            className="rounded-full px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors"
                            style={{ backgroundColor: '#c4714a' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c4714a')}
                        >
                            Objaviť koučov
                        </Link>
                        <Link
                            href="/register"
                            className="rounded-full border px-8 py-3 text-base font-semibold transition hover:bg-white"
                            style={{ borderColor: '#c4714a', color: '#c4714a' }}
                        >
                            Staň sa koučom
                        </Link>
                    </div>

                    {/* Social proof */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: '#9a8a7a' }}>
                        <span>⭐ 4.8 priemerné hodnotenie</span>
                        <span className="hidden sm:inline" style={{ color: '#e8d9c4' }}>|</span>
                        <span>👥 2 864 sledovateľov</span>
                        <span className="hidden sm:inline" style={{ color: '#e8d9c4' }}>|</span>
                        <span>🎬 120+ videí</span>
                    </div>
                </div>
            </section>

            {/* ── Featured coaches ── */}
            {featured.length > 0 && (
                <section className="px-4 py-14 sm:px-6">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-6 flex items-end justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#c4714a' }}>Top koučovia</p>
                                <h2 className="mt-1 font-serif text-2xl font-bold" style={{ color: '#2d2118' }}>Odporúčaní kouči</h2>
                            </div>
                            <Link href="/coaches" className="text-sm font-medium hover:underline" style={{ color: '#c4714a' }}>
                                Zobraziť všetkých →
                            </Link>
                        </div>

                        {/* Horizontal scroll row */}
                        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
                            {featured.map((coach) => (
                                <FeaturedCoachCard key={coach.id} coach={coach} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── How it works ── */}
            <section className="px-4 py-14 sm:px-6" style={{ backgroundColor: '#fff' }}>
                <div className="mx-auto max-w-4xl">
                    <div className="mb-10 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#c4714a' }}>Ako to funguje</p>
                        <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl" style={{ color: '#2d2118' }}>Tri kroky k lepšiemu ja</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {HOW_IT_WORKS.map((item) => (
                            <div key={item.step} className="relative rounded-2xl p-6 text-center" style={{ backgroundColor: '#faf6f0', border: '1px solid #e8d9c4' }}>
                                <span className="absolute right-4 top-4 font-serif text-5xl font-bold opacity-10" style={{ color: '#c4714a' }}>
                                    {item.step}
                                </span>
                                <div className="mb-3 text-4xl">{item.icon}</div>
                                <h3 className="mb-2 font-serif text-lg font-bold" style={{ color: '#2d2118' }}>{item.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#9a8a7a' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Categories ── */}
            <section className="px-4 py-14 sm:px-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#c4714a' }}>Kategórie</p>
                        <h2 className="mt-1 font-serif text-2xl font-bold" style={{ color: '#2d2118' }}>Čo ťa zaujíma?</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.label}
                                href={cat.keyword ? `/coaches?category=${cat.keyword}` : '/coaches'}
                                className="group flex flex-col items-center gap-2 rounded-2xl bg-white py-6 transition hover:shadow-md"
                                style={{ border: '1px solid #e8d9c4' }}
                            >
                                <span className="text-3xl">{cat.emoji}</span>
                                <span
                                    className="text-sm font-semibold transition-colors group-hover:underline"
                                    style={{ color: '#2d2118' }}
                                >
                                    {cat.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA banner ── */}
            <section className="mx-4 mb-14 overflow-hidden rounded-3xl sm:mx-6" style={{ background: 'linear-gradient(135deg, #c4714a 0%, #5a3e2b 100%)' }}>
                <div className="px-8 py-12 text-center">
                    <h2 className="font-serif text-3xl font-bold text-white">Si tréner?</h2>
                    <p className="mt-2 text-base text-white/80">Zdieľaj svoje know-how a zarábaj na tom čo miluješ.</p>
                    <Link
                        href="/register"
                        className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold transition hover:bg-gray-100"
                        style={{ color: '#c4714a' }}
                    >
                        Začni zarábať →
                    </Link>
                </div>
            </section>
        </PulseLayout>
    );
}

function FeaturedCoachCard({ coach }: { coach: Coach }) {
    const price = parseFloat(coach.monthly_price);
    const rating = coach.rating ? parseFloat(coach.rating) : null;

    return (
        <Link
            href={`/coaches/${coach.id}`}
            className="group w-52 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
            style={{ border: '1px solid #e8d9c4' }}
        >
            {/* Avatar area */}
            <div className="flex h-32 items-center justify-center" style={{ backgroundColor: '#f0e8df' }}>
                {coach.avatar_url ? (
                    <img src={coach.avatar_url} alt={coach.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                        {coach.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <div className="p-3">
                <p className="truncate text-sm font-semibold" style={{ color: '#2d2118' }}>{coach.name}</p>
                {coach.specialization && (
                    <p className="mt-0.5 truncate text-xs" style={{ color: '#c4714a' }}>{coach.specialization}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                    {rating && (
                        <span className="flex items-center gap-0.5 text-xs">
                            <span style={{ color: '#f5a623' }}>★</span>
                            <span style={{ color: '#2d2118' }}>{rating.toFixed(1)}</span>
                        </span>
                    )}
                    <span className="text-xs font-semibold" style={{ color: '#c4714a' }}>
                        €{price.toFixed(2)}/mo
                    </span>
                </div>
            </div>
        </Link>
    );
}
