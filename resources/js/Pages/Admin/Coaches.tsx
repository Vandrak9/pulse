import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Coach {
    id: number;
    name: string;
    email: string;
    specialization: string | null;
    monthly_price: number;
    subscriber_count: number;
    post_count: number;
    rating_avg: number;
    stripe_connected: boolean;
    status: 'pending' | 'verified' | 'suspended';
    joined_at: string;
}

interface Summary {
    total: number;
    pending: number;
    verified: number;
    suspended: number;
}

interface Props {
    coaches: Coach[];
    summary: Summary;
    filter: string;
    flash?: { success?: string; error?: string };
}

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: '#fff8e6', text: '#b45309', label: 'Čaká' },
    verified:  { bg: '#edf7f0', text: '#4a7c59', label: 'Schválený' },
    suspended: { bg: '#fef2f2', text: '#b91c1c', label: 'Pozastavený' },
};

function action(url: string) {
    router.post(url, {}, { preserveScroll: true });
}

export default function Coaches({ coaches, summary, filter, flash }: Props) {
    const filters = [
        { key: 'all',       label: `Všetci (${summary.total})` },
        { key: 'pending',   label: `Čakajú (${summary.pending})` },
        { key: 'verified',  label: `Schválení (${summary.verified})` },
        { key: 'suspended', label: `Pozastavení (${summary.suspended})` },
    ];

    return (
        <AdminLayout>
            <Head title="Admin — Koučovia" />
            <div style={{ padding: '32px 40px' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', marginBottom: 24 }}>
                    Správa koučov
                </h1>

                {flash?.success && (
                    <div style={{ marginBottom: 20, padding: '10px 16px', backgroundColor: '#4a7c59', color: 'white', borderRadius: 10, fontSize: 14 }}>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div style={{ marginBottom: 20, padding: '10px 16px', backgroundColor: '#b91c1c', color: 'white', borderRadius: 10, fontSize: 14 }}>
                        {flash.error}
                    </div>
                )}

                {/* Filter tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => router.get('/admin/coaches', { filter: f.key }, { preserveState: true })}
                            style={{
                                padding: '6px 16px',
                                borderRadius: 20,
                                fontSize: 13,
                                fontWeight: 500,
                                backgroundColor: filter === f.key ? '#c4714a' : 'white',
                                color: filter === f.key ? 'white' : '#2d2118',
                                border: '1px solid #e8d9c4',
                                cursor: 'pointer',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, overflow: 'hidden' }}>
                    {coaches.length === 0 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: '#9a8a7a', fontSize: 14 }}>
                            Žiadni koučovia.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ backgroundColor: '#faf6f0', borderBottom: '1px solid #e8d9c4' }}>
                                    {['Kouč', 'Špecializácia', 'Cena/mes', 'Odberat.', 'Príspevky', 'Stripe', 'Stav', 'Akcie'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#2d2118', fontSize: 12 }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {coaches.map((coach, i) => {
                                    const st = STATUS[coach.status];
                                    return (
                                        <tr key={coach.id} style={{ borderBottom: i < coaches.length - 1 ? '1px solid #f5ede4' : 'none' }}>
                                            <td style={{ padding: '10px 14px' }}>
                                                <Link
                                                    href={`/admin/coaches/${coach.id}`}
                                                    style={{ fontWeight: 600, color: '#c4714a', textDecoration: 'none', fontSize: 13 }}
                                                >
                                                    {coach.name}
                                                </Link>
                                                <div style={{ color: '#9a8a7a', fontSize: 11 }}>{coach.email}</div>
                                                <div style={{ color: '#9a8a7a', fontSize: 11 }}>od {coach.joined_at}</div>
                                            </td>
                                            <td style={{ padding: '10px 14px', color: '#9a8a7a' }}>{coach.specialization ?? '—'}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2d2118' }}>
                                                {coach.monthly_price > 0 ? `€${coach.monthly_price}` : '—'}
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#2d2118' }}>{coach.subscriber_count}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#2d2118' }}>{coach.post_count}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 16, color: coach.stripe_connected ? '#4a7c59' : '#b91c1c' }}>
                                                {coach.stripe_connected ? '✓' : '✗'}
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <span style={{ backgroundColor: st.bg, color: st.text, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {coach.status !== 'verified' && (
                                                        <button
                                                            onClick={() => action(`/admin/coaches/${coach.id}/approve`)}
                                                            style={{ padding: '4px 10px', backgroundColor: '#4a7c59', color: 'white', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                                        >
                                                            Schváliť
                                                        </button>
                                                    )}
                                                    {coach.status === 'verified' && (
                                                        <button
                                                            onClick={() => action(`/admin/coaches/${coach.id}/revoke`)}
                                                            style={{ padding: '4px 10px', backgroundColor: '#fff8e6', color: '#b45309', border: '1px solid #f5d87a', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                                                        >
                                                            Odobrať
                                                        </button>
                                                    )}
                                                    {coach.status !== 'suspended' && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Pozastaviť koučovi ${coach.name} účet?`)) {
                                                                    action(`/admin/coaches/${coach.id}/suspend`);
                                                                }
                                                            }}
                                                            style={{ padding: '4px 10px', backgroundColor: '#b91c1c', color: 'white', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                                        >
                                                            Pozastaviť
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/admin/coaches/${coach.id}`}
                                                        style={{ padding: '4px 10px', backgroundColor: '#faf6f0', color: '#2d2118', border: '1px solid #e8d9c4', borderRadius: 8, fontSize: 11, fontWeight: 600, textDecoration: 'none' }}
                                                    >
                                                        Detail
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
