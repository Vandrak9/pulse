import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface CoachData {
    id: number;
    name: string;
    email: string;
    bio: string | null;
    specialization: string | null;
    categories: string[];
    monthly_price: number;
    rating_avg: number;
    rating_count: number;
    stripe_connected: boolean;
    stripe_account_id: string | null;
    status: 'pending' | 'verified' | 'suspended';
    joined_at: string;
}

interface CoachStats {
    subscriber_count: number;
    post_count: number;
    tips_count: number;
    tips_total: number;
    message_count: number;
    message_revenue: number;
    live_streams_count: number;
}

interface Post {
    id: number;
    title: string;
    media_type: string | null;
    is_exclusive: boolean;
    views: number;
    created_at: string;
}

interface Subscriber {
    name: string;
    email: string;
    subscribed_at: string;
}

interface Props {
    coach: CoachData;
    stats: CoachStats;
    recent_posts: Post[];
    recent_subscribers: Subscriber[];
    flash?: { success?: string; error?: string };
}

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: '#fff8e6', text: '#b45309', label: 'Čaká na schválenie' },
    verified:  { bg: '#edf7f0', text: '#4a7c59', label: 'Schválený' },
    suspended: { bg: '#fef2f2', text: '#b91c1c', label: 'Pozastavený' },
};

function action(url: string) {
    router.post(url, {}, { preserveScroll: true });
}

function StatBox({ label, value, color = '#2d2118' }: { label: string; value: string | number; color?: string }) {
    return (
        <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 4 }}>{label}</div>
        </div>
    );
}

export default function CoachDetail({ coach, stats, recent_posts, recent_subscribers, flash }: Props) {
    const fmt = (n: number) =>
        new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(n);

    const st = STATUS[coach.status];

    return (
        <AdminLayout>
            <Head title={`Admin — ${coach.name}`} />
            <div style={{ padding: '32px 40px', maxWidth: 1000 }}>

                {/* Back */}
                <Link href="/admin/coaches" style={{ fontSize: 13, color: '#9a8a7a', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
                    ← Späť na koučov
                </Link>

                {flash?.success && (
                    <div style={{ marginBottom: 16, padding: '10px 16px', backgroundColor: '#4a7c59', color: 'white', borderRadius: 10, fontSize: 14 }}>
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, padding: '24px 28px', marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', margin: 0 }}>
                                    {coach.name}
                                </h1>
                                <span style={{ backgroundColor: st.bg, color: st.text, borderRadius: 12, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                                    {st.label}
                                </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#9a8a7a' }}>{coach.email}</div>
                            <div style={{ fontSize: 13, color: '#9a8a7a' }}>Registrovaný: {coach.joined_at}</div>
                            {coach.specialization && (
                                <div style={{ fontSize: 13, color: '#c4714a', marginTop: 4 }}>{coach.specialization}</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {coach.status !== 'verified' && (
                                <button
                                    onClick={() => action(`/admin/coaches/${coach.id}/approve`)}
                                    style={{ padding: '8px 16px', backgroundColor: '#4a7c59', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    Schváliť
                                </button>
                            )}
                            {coach.status === 'verified' && (
                                <button
                                    onClick={() => action(`/admin/coaches/${coach.id}/revoke`)}
                                    style={{ padding: '8px 16px', backgroundColor: '#fff8e6', color: '#b45309', border: '1px solid #f5d87a', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Odobrať verifikáciu
                                </button>
                            )}
                            {coach.status !== 'suspended' && (
                                <button
                                    onClick={() => {
                                        if (confirm(`Pozastaviť koučovi ${coach.name} účet?`)) {
                                            action(`/admin/coaches/${coach.id}/suspend`);
                                        }
                                    }}
                                    style={{ padding: '8px 16px', backgroundColor: '#b91c1c', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    Pozastaviť
                                </button>
                            )}
                            {coach.status === 'suspended' && (
                                <button
                                    onClick={() => action(`/admin/coaches/${coach.id}/approve`)}
                                    style={{ padding: '8px 16px', backgroundColor: '#4a7c59', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                >
                                    Obnoviť účet
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {coach.bio && (
                        <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: '#faf6f0', borderRadius: 10, fontSize: 13, color: '#2d2118', lineHeight: 1.6 }}>
                            {coach.bio}
                        </div>
                    )}

                    {/* Categories */}
                    {coach.categories.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {coach.categories.map(c => (
                                <span key={c} style={{ backgroundColor: '#faf6f0', border: '1px solid #e8d9c4', borderRadius: 12, padding: '2px 10px', fontSize: 11, color: '#9a8a7a' }}>
                                    {c}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Details row */}
                    <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                        <span style={{ color: '#2d2118' }}>
                            <strong>Cena:</strong> {coach.monthly_price > 0 ? `€${coach.monthly_price}/mes` : 'Zadarmo'}
                        </span>
                        <span style={{ color: '#2d2118' }}>
                            <strong>Hodnotenie:</strong> {coach.rating_avg > 0 ? `${coach.rating_avg.toFixed(1)} ★ (${coach.rating_count})` : 'Žiadne'}
                        </span>
                        <span style={{ color: coach.stripe_connected ? '#4a7c59' : '#b91c1c' }}>
                            <strong>Stripe:</strong> {coach.stripe_connected ? `✓ Prepojený (${coach.stripe_account_id})` : '✗ Neprepojený'}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                    <StatBox label="Odberatelia" value={stats.subscriber_count} color="#c4714a" />
                    <StatBox label="Príspevky" value={stats.post_count} />
                    <StatBox label="Tipy (počet)" value={stats.tips_count} />
                    <StatBox label="Tipy (suma)" value={fmt(stats.tips_total)} color="#4a7c59" />
                    <StatBox label="Platené správy" value={stats.message_count} />
                    <StatBox label="Príjem zo správ" value={fmt(stats.message_revenue)} color="#4a7c59" />
                    <StatBox label="Live streamy" value={stats.live_streams_count} />
                    <StatBox label="Celk. príjem" value={fmt(stats.tips_total + stats.message_revenue)} color="#c4714a" />
                </div>

                {/* Two columns: posts + subscribers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Recent posts */}
                    <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8d9c4', fontWeight: 700, fontSize: 14, color: '#2d2118' }}>
                            Posledné príspevky
                        </div>
                        {recent_posts.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#9a8a7a', fontSize: 13 }}>Žiadne príspevky</div>
                        ) : (
                            recent_posts.map((post, i) => (
                                <div key={post.id} style={{ padding: '10px 20px', borderBottom: i < recent_posts.length - 1 ? '1px solid #f5ede4' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#2d2118' }}>{post.title || '(bez názvu)'}</div>
                                        <div style={{ fontSize: 11, color: '#9a8a7a' }}>
                                            {post.media_type ?? 'text'} · {post.is_exclusive ? 'Exkluzívne' : 'Verejné'} · {post.views} zobr.
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9a8a7a', flexShrink: 0, marginLeft: 8 }}>{post.created_at}</div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Recent subscribers */}
                    <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8d9c4', fontWeight: 700, fontSize: 14, color: '#2d2118' }}>
                            Poslední odberatelia
                        </div>
                        {recent_subscribers.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#9a8a7a', fontSize: 13 }}>Žiadni odberatelia</div>
                        ) : (
                            recent_subscribers.map((sub, i) => (
                                <div key={i} style={{ padding: '10px 20px', borderBottom: i < recent_subscribers.length - 1 ? '1px solid #f5ede4' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#2d2118' }}>{sub.name}</div>
                                        <div style={{ fontSize: 11, color: '#9a8a7a' }}>{sub.email}</div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9a8a7a', flexShrink: 0, marginLeft: 8 }}>{sub.subscribed_at}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
