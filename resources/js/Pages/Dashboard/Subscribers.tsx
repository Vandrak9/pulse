import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';

interface Subscriber {
    index: number;
    name_anon: string;
    subscribed_since: string;
    subscribed_days_ago: number;
    total_paid: number;
    status: 'active' | 'cancelled';
}

interface Props {
    coach: { name: string; avatar_url: string | null };
    summary: {
        total: number;
        active: number;
        cancelled: number;
        churn_rate: number;
        avg_days: number;
        monthly_price: number;
    };
    subscribers: Subscriber[];
}

type Filter = 'all' | 'active' | 'cancelled';

function fmt(n: number) {
    return new Intl.NumberFormat('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function Subscribers({ coach, summary, subscribers }: Props) {
    const [filter, setFilter] = useState<Filter>('all');

    const filtered = filter === 'all' ? subscribers : subscribers.filter(s => s.status === filter);
    const avgMonths = Math.round(summary.avg_days / 30);

    return (
        <PulseLayout>
            <Head title="Predplatitelia — Dashboard" />
            <div style={{ background: '#faf6f0', minHeight: '100vh', paddingBottom: 80 }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

                    {/* Back + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Link href="/dashboard" style={{ color: '#c4714a', fontSize: 20, textDecoration: 'none' }}>←</Link>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                            👥 Predplatitelia
                        </h1>
                    </div>

                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                        {[
                            { label: 'Celkom', value: summary.total, color: '#2d2118' },
                            { label: 'Aktívni', value: summary.active, color: '#4a7c59' },
                            { label: 'Zrušené', value: summary.cancelled, color: '#c4714a' },
                            { label: 'Priemerná dĺžka', value: `${avgMonths} mes.`, color: '#9a8a7a' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '16px 14px', textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 3 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Churn rate banner */}
                    <div style={{
                        background: summary.churn_rate < 5 ? '#e8f5ee' : summary.churn_rate < 15 ? '#fef3c7' : '#fce8de',
                        border: `1px solid ${summary.churn_rate < 5 ? '#c6e8d1' : summary.churn_rate < 15 ? '#fde68a' : '#f5c6b4'}`,
                        borderRadius: 12, padding: '12px 16px', marginBottom: 24,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ fontSize: 18 }}>{summary.churn_rate < 5 ? '🎉' : summary.churn_rate < 15 ? '⚠️' : '🔴'}</span>
                        <div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#2d2118' }}>Churn rate: {summary.churn_rate}%</span>
                            <span style={{ fontSize: 13, color: '#9a8a7a', marginLeft: 8 }}>
                                {summary.churn_rate < 5 ? 'Výborné! Udržuješ si predplatiteľov.' : summary.churn_rate < 15 ? 'Priemerné. Skús pridať viac exkluzívneho obsahu.' : 'Vysoké. Venuj sa udržaniu fanúšikov.'}
                            </span>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {(['all', 'active', 'cancelled'] as Filter[]).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                style={{
                                    padding: '7px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    border: filter === f ? 'none' : '1px solid #e8d9c4',
                                    background: filter === f ? '#c4714a' : 'white',
                                    color: filter === f ? 'white' : '#9a8a7a',
                                }}>
                                {f === 'all' ? `Všetci (${subscribers.length})` : f === 'active' ? `Aktívni (${summary.active})` : `Zrušené (${summary.cancelled})`}
                            </button>
                        ))}
                    </div>

                    {/* Subscriber table */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: '#faf6f0' }}>
                                        {['#', 'Predplatiteľ', 'Od', 'Zaplatené celkom', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9a8a7a', fontSize: 14 }}>
                                                Žiadni predplatitelia v tejto kategórii
                                            </td>
                                        </tr>
                                    ) : filtered.map((sub, i) => (
                                        <tr key={i} style={{ borderTop: '1px solid #f0e8df' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '12px 16px', color: '#9a8a7a', fontSize: 13 }}>{sub.index}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 34, height: 34, borderRadius: '50%',
                                                        background: '#fce8de', color: '#c4714a',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                                                    }}>
                                                        {sub.name_anon.charAt(0)}
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: '#2d2118', fontFamily: 'monospace', fontSize: 13 }}>{sub.name_anon}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#9a8a7a', whiteSpace: 'nowrap' }}>{sub.subscribed_since}</td>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#4a7c59' }}>€{fmt(sub.total_paid)}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 600, borderRadius: 999, padding: '3px 10px',
                                                    background: sub.status === 'active' ? '#e8f5ee' : '#faf6f0',
                                                    color: sub.status === 'active' ? '#4a7c59' : '#9a8a7a',
                                                }}>
                                                    {sub.status === 'active' ? '✓ Aktívny' : '✗ Zrušené'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer info */}
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#fce8de', borderRadius: 12, fontSize: 13, color: '#9a8a7a' }}>
                        💡 Mená predplatiteľov sú anonymizované z dôvodu ochrany súkromia. Mesačná cena: <strong style={{ color: '#c4714a' }}>€{fmt(summary.monthly_price)}</strong>
                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}
