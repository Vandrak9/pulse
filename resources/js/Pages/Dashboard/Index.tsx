import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { relativeTime } from '@/lib/utils';

interface Coach {
    id: number;
    name: string;
    avatar_url: string | null;
    specialization: string | null;
    is_verified: boolean;
    stripe_account_id: string | null;
}

interface Stats {
    subscriber_count: number;
    monthly_revenue: number;
    total_revenue: number;
    new_subscribers_week: number;
    total_posts: number;
    total_views: number;
    unread_messages: number;
}

interface RevenuePoint { month: string; net: number; current: boolean; }
interface Activity { type: string; text: string; icon: string; time: string; }

interface Props {
    coach: Coach;
    stats: Stats;
    top_post: { id: number; title: string; likes_count: number; views: number } | null;
    revenue_chart: RevenuePoint[];
    recent_activity: Activity[];
}

function fmt(n: number) {
    return new Intl.NumberFormat('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const QUICK_ACTIONS = [
    { icon: '📤', label: 'Pridať obsah', href: '/dashboard/profile', color: '#c4714a' },
    { icon: '📢', label: 'Broadcast',    href: '/dashboard/broadcast', color: '#5a3e2b' },
    { icon: '💳', label: 'Výplaty',      href: '/dashboard/earnings', color: '#4a7c59' },
    { icon: '👥', label: 'Predplatitelia', href: '/dashboard/subscribers', color: '#9a8a7a' },
];

export default function DashboardIndex({ coach, stats, top_post, revenue_chart, recent_activity }: Props) {
    const hasStripe = !!coach.stripe_account_id;

    return (
        <PulseLayout>
            <Head title="Dashboard" />
            <div style={{ background: '#faf6f0', minHeight: '100vh', paddingBottom: 80 }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 24px' }}>

                    {/* ── Header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                        {coach.avatar_url ? (
                            <img src={coach.avatar_url} alt={coach.name}
                                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                        ) : (
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#c4714a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                                {coach.name.charAt(0)}
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                Ahoj {coach.name.split(' ')[0]} 👋
                            </h1>
                            <div style={{ marginTop: 4 }}>
                                {hasStripe ? (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#4a7c59', background: '#e8f5ee', borderRadius: 999, padding: '3px 10px' }}>
                                        ✓ Tvoj profil je aktívny
                                    </span>
                                ) : (
                                    <Link href="/dashboard/profile" style={{ fontSize: 12, fontWeight: 600, color: '#b45309', background: '#fef3c7', borderRadius: 999, padding: '3px 10px', textDecoration: 'none' }}>
                                        ⚠️ Nastav platby pre výber zarobených peňazí
                                    </Link>
                                )}
                            </div>
                        </div>
                        <Link href={`/coaches/${coach.id}`}
                            style={{ fontSize: 13, color: '#c4714a', textDecoration: 'none', fontWeight: 600, border: '1px solid #e8d9c4', borderRadius: 999, padding: '6px 14px', whiteSpace: 'nowrap' }}>
                            👁 Môj profil
                        </Link>
                    </div>

                    {/* ── Stats grid ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12, marginBottom: 24 }}>
                        {[
                            { label: 'Mesačný zárobok', value: `€${fmt(stats.monthly_revenue)}`, icon: '💰', color: '#c4714a', big: true },
                            { label: 'Predplatitelia', value: stats.subscriber_count.toLocaleString('sk-SK'), icon: '👥', color: '#2d2118' },
                            { label: 'Nových tento týždeň', value: `+${stats.new_subscribers_week}`, icon: '📈', color: '#4a7c59' },
                            { label: 'Celkové zobrazenia', value: stats.total_views.toLocaleString('sk-SK'), icon: '📊', color: '#9a8a7a' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                background: 'white', borderRadius: 16, padding: '18px 16px',
                                border: '1px solid #e8d9c4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                                <div style={{ fontSize: s.big ? 26 : 22, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 3 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Revenue chart ── */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '24px 20px', marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                Zárobky — posledných 6 mesiacov
                            </h2>
                            <Link href="/dashboard/earnings" style={{ fontSize: 13, color: '#c4714a', textDecoration: 'none', fontWeight: 600 }}>
                                Detail →
                            </Link>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={revenue_chart} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9a8a7a' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9a8a7a' }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `€${v}`} />
                                <Tooltip
                                    formatter={(v) => [`€${fmt(Number(v))}`, 'Čistý zárobok']}
                                    contentStyle={{ borderRadius: 10, border: '1px solid #e8d9c4', fontSize: 13 }}
                                />
                                <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                                    {revenue_chart.map((entry, i) => (
                                        <Cell key={i} fill={entry.current ? '#c4714a' : '#f0c4a8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a8a7a' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#c4714a' }} /> Tento mesiac
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a8a7a' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f0c4a8' }} /> Predchádzajúce mesiace
                            </div>
                        </div>
                    </div>

                    {/* ── Quick actions ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
                        {QUICK_ACTIONS.map(a => (
                            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    background: 'white', border: '1px solid #e8d9c4', borderRadius: 14,
                                    padding: '14px 8px', textAlign: 'center', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf6f0'; (e.currentTarget as HTMLElement).style.borderColor = '#c4714a'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                                >
                                    <div style={{ fontSize: 22, marginBottom: 6 }}>{a.icon}</div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#2d2118', lineHeight: '1.3' }}>{a.label}</div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* ── Bottom row: top post + activity ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>

                        {/* Top post */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '18px 16px' }}>
                            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2d2118', marginBottom: 12 }}>
                                🏆 Najlepší príspevok
                            </h3>
                            {top_post ? (
                                <>
                                    <p style={{ fontSize: 14, color: '#2d2118', fontWeight: 600, marginBottom: 10, lineHeight: '1.4' }}>
                                        {top_post.title}
                                    </p>
                                    <div style={{ display: 'flex', gap: 14 }}>
                                        <div style={{ fontSize: 13, color: '#9a8a7a' }}>❤️ {top_post.likes_count} likeov</div>
                                        <div style={{ fontSize: 13, color: '#9a8a7a' }}>👁 {top_post.views.toLocaleString()} zobrazení</div>
                                    </div>
                                </>
                            ) : (
                                <p style={{ fontSize: 14, color: '#9a8a7a' }}>Zatiaľ žiadne príspevky</p>
                            )}
                            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                                <div style={{ fontSize: 13 }}>
                                    <span style={{ fontWeight: 700, color: '#2d2118' }}>{stats.total_posts}</span>
                                    <span style={{ color: '#9a8a7a' }}> príspevkov celkom</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent activity */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '18px 16px' }}>
                            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2d2118', marginBottom: 12 }}>
                                🔔 Posledná aktivita
                            </h3>
                            {recent_activity.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#9a8a7a' }}>Žiadna aktivita</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {recent_activity.slice(0, 6).map((a, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, color: '#2d2118', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</div>
                                                <div style={{ fontSize: 11, color: '#9a8a7a' }}>{relativeTime(a.time)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}
