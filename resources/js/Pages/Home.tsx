import React from 'react';
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
                className="relative overflow-hidden px-4 py-16 sm:py-24"
                style={{ background: 'linear-gradient(160deg, #faf6f0 0%, #f5ece0 50%, #eedfd0 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: '#c4714a' }} />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#4a7c59' }} />

                <div className="relative mx-auto max-w-5xl">
                    {/* Desktop: two-column split. Mobile: centered */}
                    <div className="flex flex-col items-center gap-10 text-center md:flex-row md:items-center md:gap-16 md:text-left">

                        {/* Left: text */}
                        <div className="flex-1">
                            <span
                                className="mb-4 inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                                style={{ backgroundColor: '#c4714a' }}
                            >
                                #1 Fitness platforma na Slovensku
                            </span>

                            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-5xl" style={{ color: '#2d2118' }}>
                                Tvoj fitness journey
                                <br />
                                <span style={{ color: '#c4714a' }}>začína tu</span>
                            </h1>

                            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed md:mx-0 md:text-lg" style={{ color: '#6b5e52' }}>
                                Predplaťte si koučov ktorí vám skutočne pomôžu dosiahnuť vaše ciele — bez zbytočností, len výsledky.
                            </p>

                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
                                <Link
                                    href="/coaches"
                                    className="w-full rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors sm:w-auto"
                                    style={{ backgroundColor: '#c4714a' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#a85e3a')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c4714a')}
                                >
                                    Objaviť koučov
                                </Link>
                                <Link
                                    href="/register"
                                    className="w-full rounded-full px-8 py-4 text-lg font-semibold transition sm:w-auto"
                                    style={{ border: '2px solid rgba(196,113,74,0.4)', color: '#c4714a', background: 'transparent' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#c4714a')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(196,113,74,0.4)')}
                                >
                                    Staň sa koučom
                                </Link>
                            </div>

                            {/* Social proof */}
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm md:justify-start" style={{ color: '#9a8a7a' }}>
                                <span>⭐ 4.8 hodnotenie</span>
                                <span style={{ color: '#e8d9c4' }}>|</span>
                                <span>👥 2 864 fanúšikov</span>
                                <span style={{ color: '#e8d9c4' }}>|</span>
                                <span>🎬 120+ videí</span>
                            </div>
                        </div>

                        {/* Right: app mockup preview — desktop only */}
                        <div className="hidden md:block flex-shrink-0" style={{ width: 300 }}>
                            {/* Phone frame */}
                            <div style={{
                                background: '#1a1a1a', borderRadius: 36, padding: 10,
                                boxShadow: '0 32px 64px rgba(0,0,0,0.28), 0 8px 24px rgba(196,113,74,0.2)',
                                maxHeight: 520,
                            }}>
                                <div style={{
                                    background: '#faf6f0', borderRadius: 28, overflow: 'hidden',
                                    aspectRatio: '9/18', position: 'relative',
                                }}>
                                    {/* App nav bar */}
                                    <div style={{ background: 'white', padding: '12px 14px', borderBottom: '1px solid #e8d9c4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontFamily: 'Georgia, serif', color: '#c4714a', fontWeight: 700, fontSize: 16 }}>PULSE</span>
                                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#c4714a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ color: 'white', fontWeight: 700, fontSize: 11 }}>T</span>
                                        </div>
                                    </div>
                                    {/* Stories strip */}
                                    <div style={{ background: 'white', padding: '8px 12px', display: 'flex', gap: 8, borderBottom: '1px solid #f0e8df' }}>
                                        {['💪','🧘','🥗','🏃'].map((e, i) => (
                                            <div key={i} style={{ textAlign: 'center', flexShrink: 0 }}>
                                                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, #c4714a, #f5a623)`, padding: 2, marginBottom: 2 }}>
                                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#e8d9c4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{e}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Post cards */}
                                    {[
                                        { name: 'Tomáš K.', spec: 'Silový tréning', lines: ['70%','50%'], hasMedia: true, color: '#4a7c59' },
                                        { name: 'Lucia H.', spec: 'Joga & Wellness', lines: ['60%','40%'], hasMedia: false, color: '#c4714a' },
                                    ].map((p, i) => (
                                        <div key={i} style={{ background: 'white', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#2d2118' }}>{p.name}</div>
                                                    <div style={{ fontSize: 9, color: '#c4714a' }}>{p.spec}</div>
                                                </div>
                                            </div>
                                            {p.hasMedia && (
                                                <div style={{ height: 90, background: 'linear-gradient(135deg, #2d2118, #5a3e2b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12 }}>▶</div>
                                                </div>
                                            )}
                                            <div style={{ padding: '6px 12px 8px' }}>
                                                {p.lines.map((w, j) => (
                                                    <div key={j} style={{ height: 6, background: '#f0e8df', borderRadius: 3, marginBottom: 4, width: w }} />
                                                ))}
                                                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                                    <span style={{ fontSize: 12 }}>🤍</span>
                                                    <span style={{ fontSize: 12 }}>💬</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Bottom nav bar */}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e8d9c4', padding: '8px 0', display: 'flex', justifyContent: 'space-around' }}>
                                        {['🏠','📱','🔍','💬','👤'].map((ic, i) => (
                                            <span key={i} style={{ fontSize: i === 0 ? 16 : 13, opacity: i === 0 ? 1 : 0.4 }}>{ic}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
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

                        {/* Mobile: horizontal scroll. Desktop: 3-col grid */}
                        <div className="md:hidden no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
                            {featured.map((coach) => (
                                <FeaturedCoachCard key={coach.id} coach={coach} />
                            ))}
                        </div>
                        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    const [hovered, setHovered] = React.useState(false);

    return (
        <Link
            href={`/coaches/${coach.id}`}
            className="group flex w-40 flex-shrink-0 flex-col items-center rounded-2xl bg-white px-3 pb-4 pt-5 shadow-sm transition hover:shadow-md md:w-auto"
            style={{ border: `1px solid ${hovered ? '#c4714a' : '#e8d9c4'}`, transition: 'border-color 0.2s, box-shadow 0.2s', position: 'relative' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Round avatar */}
            <div
                className="mb-2.5 h-20 w-20 flex-shrink-0 overflow-hidden rounded-full"
                style={{ outline: '2px solid #e8d9c4', outlineOffset: '2px' }}
            >
                {coach.avatar_url ? (
                    <img src={coach.avatar_url} alt={coach.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#c4714a' }}>
                        {coach.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <p className="w-full truncate text-center text-xs font-semibold" style={{ color: '#2d2118' }}>{coach.name}</p>

            {coach.specialization && (
                <span className="mt-1 rounded-full px-2 py-0.5 text-center text-xs font-medium" style={{ backgroundColor: '#fce8de', color: '#c4714a' }}>
                    {coach.specialization}
                </span>
            )}

            <div className="mt-2 flex items-center gap-1.5">
                {rating !== null && (
                    <span className="flex items-center gap-0.5 text-xs">
                        <span style={{ color: '#f5a623' }}>★</span>
                        <span className="font-medium" style={{ color: '#2d2118' }}>{rating.toFixed(1)}</span>
                    </span>
                )}
            </div>

            <div className="my-2 w-full border-t" style={{ borderColor: '#f0e4d4' }} />

            <p className="font-serif text-sm font-bold" style={{ color: '#c4714a' }}>
                {price === 0 ? 'Zadarmo' : `€${price.toFixed(2)}`}
                {price > 0 && <span className="ml-1 font-sans text-xs font-normal" style={{ color: '#9a8a7a' }}>/mes</span>}
            </p>

            {/* Hover CTA — desktop only */}
            <div
                className="hidden md:block"
                style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, white 60%, transparent)',
                    borderRadius: '0 0 16px 16px',
                    padding: '28px 12px 14px',
                    opacity: hovered ? 1 : 0,
                    transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                    transition: 'opacity 0.2s, transform 0.2s',
                    pointerEvents: hovered ? 'auto' : 'none',
                }}
            >
                <div
                    style={{
                        background: '#c4714a', color: 'white', borderRadius: 999,
                        padding: '7px 0', textAlign: 'center',
                        fontSize: 12, fontWeight: 700,
                    }}
                >
                    Predplatiť
                </div>
            </div>
        </Link>
    );
}
