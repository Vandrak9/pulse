import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';
import PostDetailModal from '@/Components/PostDetailModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Coach {
    id: number;
    name: string;
    avatar_url: string | null;
    specialization: string | null;
    is_verified: boolean;
    stripe_account_id: string | null;
    price: number | null;
    stripe_price_id: string | null;
}

interface Stats {
    subscriber_count: number;
    monthly_revenue: number;
    new_subscribers_week: number;
    total_posts: number;
    total_views: number;
    total_likes: number;
    unread_messages: number;
    rating_avg: number;
    rating_count: number;
}

interface EarningsPoint {
    month: string;
    year: number;
    earnings: number;
    subscribers: number;
    isCurrentMonth: boolean;
}

interface Activity {
    id: number | string;
    type: string;
    title: string | null;
    body: string | null;
    is_read: boolean;
    time: string;
    link: string;
    icon: string;
}

interface RecentPost {
    id: number;
    title: string;
    likes: number;
    created_at: string;
    thumbnail: string | null;
    is_exclusive: boolean;
}

interface Props {
    coach: Coach;
    stats: Stats;
    recent_posts: RecentPost[];
    earnings_data: EarningsPoint[];
    recent_activity: Activity[];
}

function fmt(n: number) {
    return new Intl.NumberFormat('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function DashboardIndex({ coach, stats, recent_posts, earnings_data, recent_activity }: Props) {
    const hasStripe = !!coach.stripe_account_id;
    const [showContentDropdown, setShowContentDropdown] = useState(false);
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!showContentDropdown) return;
        function handler(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowContentDropdown(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showContentDropdown]);

    const viewLabel = stats.total_views > 0 ? 'Celkové zobrazenia' : 'Celkové lajky';
    const viewValue = stats.total_views > 0 ? stats.total_views : stats.total_likes;

    return (
        <PulseLayout>
            <Head title="Dashboard" />
            <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
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
                        {/* Monthly earnings */}
                        <Link href="/dashboard/earnings" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'white', borderRadius: 16, padding: '18px 16px',
                                border: '1px solid #e8d9c4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                cursor: 'pointer', transition: 'all 0.15s', height: '100%',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,113,74,0.3)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 6 }}>💰</div>
                                <div style={{ fontSize: 26, fontWeight: 700, color: '#c4714a', fontFamily: 'Georgia, serif' }}>
                                    €{fmt(stats.monthly_revenue)}
                                </div>
                                <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 3 }}>Mesačný zárobok</div>
                            </div>
                        </Link>

                        {/* Subscribers */}
                        <Link href="/dashboard/subscribers" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'white', borderRadius: 16, padding: '18px 16px',
                                border: '1px solid #e8d9c4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                cursor: 'pointer', transition: 'all 0.15s', height: '100%',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,113,74,0.3)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 6 }}>👥</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif' }}>
                                    {stats.subscriber_count.toLocaleString('sk-SK')}
                                </div>
                                <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 3 }}>Predplatitelia</div>
                            </div>
                        </Link>

                        {/* New this week */}
                        <Link href="/dashboard/subscribers" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'white', borderRadius: 16, padding: '18px 16px',
                                border: '1px solid #e8d9c4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                cursor: 'pointer', transition: 'all 0.15s', height: '100%',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,113,74,0.3)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 6 }}>📈</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#4a7c59', fontFamily: 'Georgia, serif' }}>
                                    {stats.new_subscribers_week > 0 ? `+${stats.new_subscribers_week}` : '0'}
                                </div>
                                <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 3 }}>Nových tento týždeň</div>
                            </div>
                        </Link>

                        {/* Views / likes */}
                        <Link href="/feed" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'white', borderRadius: 16, padding: '18px 16px',
                                border: '1px solid #e8d9c4', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                cursor: 'pointer', transition: 'all 0.15s', height: '100%',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,113,74,0.3)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 6 }}>{stats.total_views > 0 ? '👁️' : '❤️'}</div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#9a8a7a', fontFamily: 'Georgia, serif' }}>
                                    {viewValue.toLocaleString('sk-SK')}
                                </div>
                                <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 3 }}>{viewLabel}</div>
                            </div>
                        </Link>
                    </div>

                    {/* ── Earnings chart ── */}
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
                            <BarChart data={earnings_data} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9a8a7a' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9a8a7a' }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => `€${v}`} />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'earnings'
                                            ? `€${fmt(Number(value))}`
                                            : value,
                                        name === 'earnings' ? 'Zárobky' : 'Noví predplatitelia',
                                    ]}
                                    contentStyle={{ borderRadius: 10, border: '1px solid #e8d9c4', fontSize: 13 }}
                                />
                                <Bar dataKey="earnings" radius={[6, 6, 0, 0]}>
                                    {earnings_data.map((entry, i) => (
                                        <Cell key={i} fill={entry.isCurrentMonth ? '#c4714a' : '#e8b898'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a8a7a' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#c4714a' }} /> Tento mesiac
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a8a7a' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#e8b898' }} /> Predchádzajúce mesiace
                            </div>
                        </div>
                    </div>

                    {/* ── Quick actions ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>

                        {/* Pridať obsah — dropdown */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowContentDropdown(v => !v)}
                                style={{
                                    width: '100%', background: 'white', border: '1px solid #e8d9c4',
                                    borderRadius: 14, padding: '14px 8px', textAlign: 'center',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    borderColor: showContentDropdown ? '#c4714a' : '#e8d9c4',
                                    backgroundColor: showContentDropdown ? '#faf6f0' : 'white',
                                }}
                                onMouseEnter={e => { if (!showContentDropdown) { (e.currentTarget as HTMLElement).style.background = '#faf6f0'; (e.currentTarget as HTMLElement).style.borderColor = '#c4714a'; } }}
                                onMouseLeave={e => { if (!showContentDropdown) { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; } }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 6 }}>✏️</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#2d2118', lineHeight: '1.3' }}>Pridať obsah</div>
                            </button>
                            {showContentDropdown && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                                    background: 'white', border: '1px solid #e8d9c4',
                                    borderRadius: 12, overflow: 'hidden', zIndex: 50,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                }}>
                                    <Link
                                        href="/dashboard/posts/create"
                                        onClick={() => setShowContentDropdown(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', textDecoration: 'none', fontSize: 13, color: '#2d2118', transition: 'background 0.12s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        📝 Príspevok
                                    </Link>
                                    <div style={{ height: 1, background: '#f0e8df' }} />
                                    <Link
                                        href="/dashboard/reels/create"
                                        onClick={() => setShowContentDropdown(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', textDecoration: 'none', fontSize: 13, color: '#2d2118', transition: 'background 0.12s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        ⚡ Reel
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Broadcast */}
                        <Link href="/dashboard/broadcast" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'white', border: '1px solid #e8d9c4', borderRadius: 14,
                                padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf6f0'; (e.currentTarget as HTMLElement).style.borderColor = '#c4714a'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 6 }}>📢</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#2d2118', lineHeight: '1.3' }}>Broadcast</div>
                            </div>
                        </Link>

                        {/* Výplaty — modal if no Stripe */}
                        <button
                            onClick={() => {
                                if (!coach.stripe_price_id) {
                                    setShowStripeModal(true);
                                } else {
                                    router.visit('/dashboard/earnings');
                                }
                            }}
                            style={{
                                background: 'white', border: '1px solid #e8d9c4', borderRadius: 14,
                                padding: '14px 8px', textAlign: 'center', cursor: 'pointer',
                                transition: 'all 0.15s', width: '100%',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf6f0'; (e.currentTarget as HTMLElement).style.borderColor = '#c4714a'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                        >
                            <div style={{ fontSize: 22, marginBottom: 6 }}>💳</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#2d2118', lineHeight: '1.3' }}>Výplaty</div>
                        </button>

                        {/* Predplatitelia */}
                        <Link href="/dashboard/subscribers" style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'white', border: '1px solid #e8d9c4', borderRadius: 14,
                                padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#faf6f0'; (e.currentTarget as HTMLElement).style.borderColor = '#c4714a'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#e8d9c4'; }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 6 }}>👥</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#2d2118', lineHeight: '1.3' }}>Predplatitelia</div>
                            </div>
                        </Link>
                    </div>

                    {/* ── Bottom row: best post + activity ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>

                        {/* Recent posts widget */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '18px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                    📝 Moje posledné príspevky
                                </h3>
                                <Link href="/dashboard/posts/create"
                                    style={{ fontSize: 12, color: '#c4714a', textDecoration: 'none', fontWeight: 600 }}
                                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                >
                                    + Pridať
                                </Link>
                            </div>

                            {recent_posts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <p style={{ fontSize: 13, color: '#9a8a7a', marginBottom: 8 }}>Zatiaľ žiadne príspevky</p>
                                    <Link href="/dashboard/posts/create"
                                        style={{ fontSize: 12, color: '#c4714a', textDecoration: 'none', fontWeight: 600 }}
                                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                    >
                                        Pridaj prvý príspevok →
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {recent_posts.map(post => (
                                        <button key={post.id} onClick={() => setSelectedPostId(post.id)}
                                            style={{ textDecoration: 'none', background: 'none', border: 'none', padding: 0, width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px', borderRadius: 12, transition: 'background 0.12s',
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                {/* Thumbnail */}
                                                {post.thumbnail ? (
                                                    <img src={post.thumbnail} alt=""
                                                        style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                                                ) : (
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                                                        background: '#fce8de', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', fontSize: 18,
                                                    }}>📝</div>
                                                )}

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                                        <span style={{
                                                            fontSize: 13, fontWeight: 600, color: '#2d2118',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        }}>
                                                            {post.title}
                                                        </span>
                                                        {post.is_exclusive && (
                                                            <span style={{
                                                                fontSize: 10, background: '#fce8de', color: '#c4714a',
                                                                padding: '1px 6px', borderRadius: 999, flexShrink: 0, fontWeight: 600,
                                                            }}>🔒</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#9a8a7a' }}>
                                                        <span>❤️ {post.likes}</span>
                                                        <span style={{ marginLeft: 'auto' }}>{post.created_at}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}

                                    <Link href="/feed"
                                        style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#c4714a', textDecoration: 'none', fontWeight: 600, paddingTop: 6 }}
                                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                    >
                                        Zobraziť všetky →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Recent activity — each item clickable */}
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '18px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                    🔔 Posledná aktivita
                                </h3>
                                <Link href="/notifications" style={{ fontSize: 12, color: '#c4714a', textDecoration: 'none', fontWeight: 600 }}>
                                    Všetky →
                                </Link>
                            </div>
                            {recent_activity.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#9a8a7a' }}>Žiadna aktivita</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {recent_activity.slice(0, 6).map((a, i) => (
                                        <Link key={i} href={a.link} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px 6px', borderRadius: 10,
                                                transition: 'background 0.12s',
                                                fontWeight: a.is_read ? 400 : 600,
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: '50%',
                                                    background: '#fce8de', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 14, flexShrink: 0,
                                                }}>
                                                    {a.icon}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, color: '#2d2118', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {a.title || a.body}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#9a8a7a' }}>{a.time}</div>
                                                </div>
                                                {!a.is_read && (
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c4714a', flexShrink: 0 }} />
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stripe modal ── */}
            {showStripeModal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                    onClick={() => setShowStripeModal(false)}
                >
                    <div
                        style={{ background: 'white', borderRadius: 20, padding: 24, maxWidth: 360, margin: '0 16px', width: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2d2118', marginBottom: 8 }}>
                            💳 Nastav výplaty
                        </h3>
                        <p style={{ fontSize: 14, color: '#5a4a3a', marginBottom: 12, lineHeight: '1.5' }}>
                            Pre výber zarobených peňazí potrebuješ prepojiť bankový účet cez Stripe.
                        </p>
                        <p style={{ fontSize: 12, color: '#9a8a7a', marginBottom: 20, lineHeight: '1.5' }}>
                            Stripe Connect nie je zatiaľ dostupný. Výplaty budú spracované manuálne každý mesiac.
                        </p>
                        <button
                            onClick={() => setShowStripeModal(false)}
                            style={{
                                width: '100%', background: '#c4714a', color: 'white',
                                padding: '12px 0', borderRadius: 12, border: 'none',
                                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#5a3e2b')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#c4714a')}
                        >
                            Rozumiem
                        </button>
                    </div>
                </div>
            )}
        </PulseLayout>
    );
}
