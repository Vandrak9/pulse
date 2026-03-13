import { Head, router, usePage } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';

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

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    pending:   { bg: '#fff8e6', text: '#b45309', label: 'Čaká na schválenie' },
    verified:  { bg: '#edf7f0', text: '#4a7c59', label: 'Schválený' },
    suspended: { bg: '#fef2f2', text: '#b91c1c', label: 'Pozastavený' },
};

function action(url: string) {
    router.post(url, {}, { preserveScroll: true });
}

export default function AdminIndex({ coaches, summary, filter, flash }: Props) {
    const filters = [
        { key: 'all',       label: `Všetci (${summary.total})` },
        { key: 'pending',   label: `Čakajú (${summary.pending})` },
        { key: 'verified',  label: `Schválení (${summary.verified})` },
        { key: 'suspended', label: `Pozastavení (${summary.suspended})` },
    ];

    return (
        <PulseLayout>
            <Head title="Admin — koučovia" />

            <div className="py-10" style={{ backgroundColor: '#faf6f0', minHeight: '80vh' }}>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

                    <h1 className="mb-6 text-2xl font-bold" style={{ color: '#2d2118', fontFamily: 'Georgia, serif' }}>
                        Správa koučov
                    </h1>

                    {flash?.success && (
                        <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium text-white" style={{ backgroundColor: '#4a7c59' }}>
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-5 rounded-xl px-4 py-3 text-sm font-medium text-white" style={{ backgroundColor: '#b91c1c' }}>
                            {flash.error}
                        </div>
                    )}

                    {/* Summary cards */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'Celkom', value: summary.total, color: '#c4714a' },
                            { label: 'Čakajú', value: summary.pending, color: '#b45309' },
                            { label: 'Schválení', value: summary.verified, color: '#4a7c59' },
                            { label: 'Pozastavení', value: summary.suspended, color: '#b91c1c' },
                        ].map(s => (
                            <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm text-center" style={{ border: '1px solid #e8d9c4' }}>
                                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                                <div className="text-xs mt-1" style={{ color: '#9a8a7a' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filter tabs */}
                    <div className="mb-5 flex gap-2 flex-wrap">
                        {filters.map(f => (
                            <button
                                key={f.key}
                                onClick={() => router.get('/admin', { filter: f.key }, { preserveState: true })}
                                className="rounded-full px-4 py-1.5 text-sm font-medium transition"
                                style={{
                                    backgroundColor: filter === f.key ? '#c4714a' : 'white',
                                    color: filter === f.key ? 'white' : '#2d2118',
                                    border: '1px solid #e8d9c4',
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Coach table */}
                    <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid #e8d9c4' }}>
                        {coaches.length === 0 ? (
                            <div className="py-16 text-center text-sm" style={{ color: '#9a8a7a' }}>
                                Žiadni koučovia v tejto kategórii.
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e8d9c4', backgroundColor: '#faf6f0' }}>
                                        {['Kouč', 'Špecializácia', 'Cena', 'Odberatelia', 'Príspevky', 'Stripe', 'Stav', 'Akcie'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: '#2d2118', fontSize: 12 }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {coaches.map((coach, i) => {
                                        const st = STATUS_COLORS[coach.status];
                                        return (
                                            <tr
                                                key={coach.id}
                                                style={{ borderBottom: i < coaches.length - 1 ? '1px solid #f5ede4' : 'none' }}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold" style={{ color: '#2d2118' }}>{coach.name}</div>
                                                    <div style={{ color: '#9a8a7a', fontSize: 11 }}>{coach.email}</div>
                                                    <div style={{ color: '#9a8a7a', fontSize: 11 }}>od {coach.joined_at}</div>
                                                </td>
                                                <td className="px-4 py-3" style={{ color: '#9a8a7a' }}>
                                                    {coach.specialization ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 font-medium" style={{ color: '#2d2118' }}>
                                                    {coach.monthly_price > 0 ? `€${coach.monthly_price}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center" style={{ color: '#2d2118' }}>
                                                    {coach.subscriber_count}
                                                </td>
                                                <td className="px-4 py-3 text-center" style={{ color: '#2d2118' }}>
                                                    {coach.post_count}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span style={{ fontSize: 16 }}>{coach.stripe_connected ? '✓' : '✗'}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                                        style={{ backgroundColor: st.bg, color: st.text }}
                                                    >
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {coach.status !== 'verified' && (
                                                            <button
                                                                onClick={() => action(`/admin/coaches/${coach.id}/approve`)}
                                                                className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition hover:opacity-80"
                                                                style={{ backgroundColor: '#4a7c59' }}
                                                            >
                                                                Schváliť
                                                            </button>
                                                        )}
                                                        {coach.status === 'verified' && (
                                                            <button
                                                                onClick={() => action(`/admin/coaches/${coach.id}/revoke`)}
                                                                className="rounded-lg px-3 py-1 text-xs font-semibold transition hover:opacity-80"
                                                                style={{ backgroundColor: '#fff8e6', color: '#b45309', border: '1px solid #f5d87a' }}
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
                                                                className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition hover:opacity-80"
                                                                style={{ backgroundColor: '#b91c1c' }}
                                                            >
                                                                Pozastaviť
                                                            </button>
                                                        )}
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
            </div>
        </PulseLayout>
    );
}
