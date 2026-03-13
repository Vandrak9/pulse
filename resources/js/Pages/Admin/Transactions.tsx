import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

interface Tip {
    id: number;
    fan_name: string;
    fan_email: string;
    coach_name: string;
    amount: number;
    created_at: string;
}

interface PaidMessage {
    id: number;
    sender_name: string;
    sender_email: string;
    receiver_name: string;
    amount: number;
    created_at: string;
}

interface Subscription {
    id: number;
    user_name: string;
    user_email: string;
    coach_name: string;
    price: number;
    stripe_status: string;
    created_at: string;
}

interface Totals {
    tips_sum: number;
    messages_sum: number;
    active_subscriptions: number;
    platform_fee: number;
}

interface Props {
    tips: Tip[];
    messages: PaidMessage[];
    subscriptions: Subscription[];
    totals: Totals;
}

const SUB_STATUS: Record<string, { bg: string; text: string }> = {
    active:   { bg: '#edf7f0', text: '#4a7c59' },
    trialing: { bg: '#fff8e6', text: '#b45309' },
    canceled: { bg: '#fef2f2', text: '#b91c1c' },
    past_due: { bg: '#fef2f2', text: '#b91c1c' },
};

export default function Transactions({ tips, messages, subscriptions, totals }: Props) {
    const [tab, setTab] = useState<'tips' | 'messages' | 'subscriptions'>('tips');

    const fmt = (n: number) =>
        new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(n);

    const tabs = [
        { key: 'tips' as const,          label: `Tipy (${tips.length})` },
        { key: 'messages' as const,      label: `Platené správy (${messages.length})` },
        { key: 'subscriptions' as const, label: `Predplatné (${subscriptions.length})` },
    ];

    return (
        <AdminLayout>
            <Head title="Admin — Transakcie" />
            <div style={{ padding: '32px 40px' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', marginBottom: 24 }}>
                    Transakcie
                </h1>

                {/* Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                    {[
                        { label: 'Príjem z tipov', value: fmt(totals.tips_sum), color: '#c4714a' },
                        { label: 'Príjem zo správ', value: fmt(totals.messages_sum), color: '#c4714a' },
                        { label: 'Aktívne predplatné', value: totals.active_subscriptions, color: '#4a7c59' },
                        { label: 'Príjem platformy (15%)', value: fmt(totals.platform_fee), color: '#2d6a9f' },
                    ].map(s => (
                        <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                padding: '7px 18px',
                                borderRadius: 20,
                                fontSize: 13,
                                fontWeight: 500,
                                backgroundColor: tab === t.key ? '#c4714a' : 'white',
                                color: tab === t.key ? 'white' : '#2d2118',
                                border: '1px solid #e8d9c4',
                                cursor: 'pointer',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tips */}
                {tab === 'tips' && (
                    <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, overflow: 'hidden' }}>
                        {tips.length === 0 ? (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9a8a7a', fontSize: 14 }}>Žiadne tipy.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#faf6f0', borderBottom: '1px solid #e8d9c4' }}>
                                        {['Od', 'Pre kouča', 'Suma', 'Dátum'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#2d2118', fontSize: 12 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tips.map((tip, i) => (
                                        <tr key={tip.id} style={{ borderBottom: i < tips.length - 1 ? '1px solid #f5ede4' : 'none' }}>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ fontWeight: 500, color: '#2d2118' }}>{tip.fan_name}</div>
                                                <div style={{ fontSize: 11, color: '#9a8a7a' }}>{tip.fan_email}</div>
                                            </td>
                                            <td style={{ padding: '10px 14px', color: '#2d2118' }}>{tip.coach_name}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#4a7c59' }}>{fmt(tip.amount)}</td>
                                            <td style={{ padding: '10px 14px', color: '#9a8a7a' }}>{tip.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Paid Messages */}
                {tab === 'messages' && (
                    <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, overflow: 'hidden' }}>
                        {messages.length === 0 ? (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9a8a7a', fontSize: 14 }}>Žiadne platené správy.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#faf6f0', borderBottom: '1px solid #e8d9c4' }}>
                                        {['Odosielateľ', 'Príjemca', 'Suma', 'Dátum'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#2d2118', fontSize: 12 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {messages.map((msg, i) => (
                                        <tr key={msg.id} style={{ borderBottom: i < messages.length - 1 ? '1px solid #f5ede4' : 'none' }}>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ fontWeight: 500, color: '#2d2118' }}>{msg.sender_name}</div>
                                                <div style={{ fontSize: 11, color: '#9a8a7a' }}>{msg.sender_email}</div>
                                            </td>
                                            <td style={{ padding: '10px 14px', color: '#2d2118' }}>{msg.receiver_name}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#4a7c59' }}>{fmt(msg.amount)}</td>
                                            <td style={{ padding: '10px 14px', color: '#9a8a7a' }}>{msg.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Subscriptions */}
                {tab === 'subscriptions' && (
                    <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, overflow: 'hidden' }}>
                        {subscriptions.length === 0 ? (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9a8a7a', fontSize: 14 }}>Žiadne predplatné.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#faf6f0', borderBottom: '1px solid #e8d9c4' }}>
                                        {['Predplatiteľ', 'Kouč', 'Cena/mes', 'Status', 'Od'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#2d2118', fontSize: 12 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptions.map((sub, i) => {
                                        const sc = SUB_STATUS[sub.stripe_status] ?? { bg: '#faf6f0', text: '#9a8a7a' };
                                        return (
                                            <tr key={sub.id} style={{ borderBottom: i < subscriptions.length - 1 ? '1px solid #f5ede4' : 'none' }}>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <div style={{ fontWeight: 500, color: '#2d2118' }}>{sub.user_name}</div>
                                                    <div style={{ fontSize: 11, color: '#9a8a7a' }}>{sub.user_email}</div>
                                                </td>
                                                <td style={{ padding: '10px 14px', color: '#2d2118' }}>{sub.coach_name}</td>
                                                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2d2118' }}>{fmt(sub.price)}</td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <span style={{ backgroundColor: sc.bg, color: sc.text, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                                                        {sub.stripe_status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 14px', color: '#9a8a7a' }}>{sub.created_at}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
