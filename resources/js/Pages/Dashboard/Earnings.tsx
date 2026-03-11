import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

interface MonthRow {
    month: string;
    month_short: string;
    year: number;
    gross: number;
    fee: number;
    net: number;
    status: 'paid' | 'pending';
    subscribers: number;
}

interface Transaction {
    date: string;
    type: 'subscription' | 'tip';
    fan: string;
    gross: number;
    fee: number;
    net: number;
}

interface Props {
    coach: { name: string; avatar_url: string | null };
    summary: {
        total_earned: number;
        pending_payout: number;
        next_payout_date: string;
        monthly_revenue: number;
    };
    monthly_table: MonthRow[];
    transactions: Transaction[];
}

function fmt(n: number) {
    return new Intl.NumberFormat('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function EarningsCharts({
    chartData,
    growthData,
    fmt,
}: {
    chartData: { month_short: string; net: number; gross: number; status: string }[];
    growthData: { month: string; predplatitelia: number; hrube: number; ciste: number }[];
    fmt: (n: number) => string;
}) {
    const [tab, setTab] = useState<'earnings' | 'subscribers'>('earnings');

    return (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '20px 16px', marginBottom: 24 }}>
            {/* Tab switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                    {tab === 'earnings' ? 'Zárobky za posledných 6 mesiacov' : 'Rast predplatiteľov (12 mesiacov)'}
                </h2>
                <div style={{ display: 'flex', gap: 4, background: '#faf6f0', borderRadius: 10, padding: 3, border: '1px solid #e8d9c4' }}>
                    {(['earnings', 'subscribers'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                                background: tab === t ? '#c4714a' : 'transparent',
                                color: tab === t ? 'white' : '#9a8a7a',
                            }}
                        >
                            {t === 'earnings' ? '💰 Zárobky' : '📈 Predplatitelia'}
                        </button>
                    ))}
                </div>
            </div>

            {tab === 'earnings' ? (
                /* Bar chart — gross vs net, last 6 months */
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={24} barGap={4} margin={{ top: 4, right: 4, left: -15, bottom: 0 }}>
                        <XAxis dataKey="month_short" tick={{ fontSize: 12, fill: '#9a8a7a' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9a8a7a' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                        <Tooltip
                            formatter={(v, name) => [`€${fmt(Number(v))}`, name === 'gross' ? 'Hrubý zárobok' : 'Čistý zárobok']}
                            contentStyle={{ borderRadius: 10, border: '1px solid #e8d9c4', fontSize: 13 }}
                        />
                        <Legend
                            formatter={v => v === 'gross' ? 'Hrubý zárobok' : 'Čistý zárobok'}
                            wrapperStyle={{ fontSize: 12, color: '#9a8a7a' }}
                        />
                        <Bar dataKey="gross" radius={[4, 4, 0, 0]} fill="#f0c4a8" />
                        <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.status === 'pending' ? '#c4714a' : '#5a3e2b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                /* Line chart — subscriber growth over 12 months */
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={growthData} margin={{ top: 4, right: 16, left: -15, bottom: 0 }}>
                        <CartesianGrid stroke="#f0e8df" strokeDasharray="4 2" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9a8a7a' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9a8a7a' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                            formatter={(v, name) => [v, name === 'predplatitelia' ? 'Noví predplatitelia' : name]}
                            contentStyle={{ borderRadius: 10, border: '1px solid #e8d9c4', fontSize: 13 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="predplatitelia"
                            stroke="#c4714a"
                            strokeWidth={2.5}
                            dot={{ fill: '#c4714a', r: 4, strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#c4714a' }}
                            name="Noví predplatitelia"
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}

            {/* Legend for earnings tab */}
            {tab === 'earnings' && (
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a8a7a' }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#c4714a' }} /> Tento mesiac (čistý)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a8a7a' }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#5a3e2b' }} /> Vyplatené (čistý)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9a8a7a' }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f0c4a8' }} /> Hrubý zárobok
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Earnings({ coach, summary, monthly_table, transactions }: Props) {
    const [txPage, setTxPage] = useState(0);
    const PER_PAGE = 10;
    const txSlice = transactions.slice(txPage * PER_PAGE, (txPage + 1) * PER_PAGE);

    // Last 6 months for bar chart (earnings)
    const chartData = monthly_table.slice(-6);
    // Full 12 months for subscriber growth line chart
    const growthData = monthly_table.map(r => ({
        month: r.month_short,
        predplatitelia: r.subscribers,
        hrube: r.gross,
        ciste: r.net,
    }));

    return (
        <PulseLayout>
            <Head title="Výplaty — Dashboard" />
            <div style={{ background: '#faf6f0', minHeight: '100vh', paddingBottom: 80 }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

                    {/* Back + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Link href="/dashboard" style={{ color: '#c4714a', fontSize: 20, textDecoration: 'none' }}>←</Link>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                            💳 Výplaty a zárobky
                        </h1>
                    </div>

                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '18px 16px' }}>
                            <div style={{ fontSize: 12, color: '#9a8a7a', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Celkový zárobok</div>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#c4714a' }}>€{fmt(summary.total_earned)}</div>
                            <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 4 }}>za posledných 11 mesiacov</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '18px 16px' }}>
                            <div style={{ fontSize: 12, color: '#9a8a7a', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Čaká na výplatu</div>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#2d2118' }}>€{fmt(summary.pending_payout)}</div>
                            <div style={{ fontSize: 12, color: '#4a7c59', marginTop: 4 }}>📅 Výplata: {summary.next_payout_date}</div>
                        </div>
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '18px 16px' }}>
                            <div style={{ fontSize: 12, color: '#9a8a7a', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tento mesiac</div>
                            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#4a7c59' }}>€{fmt(summary.monthly_revenue)}</div>
                            <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 4 }}>po odpočítaní 15% poplatku</div>
                        </div>
                    </div>

                    {/* Charts — two tabs */}
                    <EarningsCharts chartData={chartData} growthData={growthData} fmt={fmt} />

                    {/* Monthly table */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', marginBottom: 24, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0e8df' }}>
                            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                Mesačný prehľad
                            </h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: '#faf6f0' }}>
                                        {['Mesiac', 'Predplatitelia', 'Hrubý zárobok', 'Poplatok (15%)', 'Čistý zárobok', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthly_table.map((row, i) => (
                                        <tr key={i} style={{ borderTop: '1px solid #f0e8df' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2d2118', whiteSpace: 'nowrap' }}>{row.month}</td>
                                            <td style={{ padding: '12px 16px', color: '#9a8a7a' }}>{row.subscribers}</td>
                                            <td style={{ padding: '12px 16px', color: '#2d2118' }}>€{fmt(row.gross)}</td>
                                            <td style={{ padding: '12px 16px', color: '#c4714a' }}>−€{fmt(row.fee)}</td>
                                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4a7c59' }}>€{fmt(row.net)}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 600, borderRadius: 999, padding: '3px 10px',
                                                    background: row.status === 'paid' ? '#e8f5ee' : '#fce8de',
                                                    color: row.status === 'paid' ? '#4a7c59' : '#c4714a',
                                                }}>
                                                    {row.status === 'paid' ? '✓ Vyplatené' : '⏳ Čaká'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Transaction history */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0e8df' }}>
                            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                Transakcie
                            </h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: '#faf6f0' }}>
                                        {['Dátum', 'Typ', 'Od', 'Hrubá suma', 'Poplatok', 'Čistá suma'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {txSlice.map((tx, i) => (
                                        <tr key={i} style={{ borderTop: '1px solid #f0e8df' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '11px 16px', color: '#9a8a7a', whiteSpace: 'nowrap' }}>{tx.date}</td>
                                            <td style={{ padding: '11px 16px' }}>
                                                <span style={{
                                                    fontSize: 12, fontWeight: 600, borderRadius: 999, padding: '3px 10px',
                                                    background: tx.type === 'subscription' ? '#fce8de' : '#e8f5ee',
                                                    color: tx.type === 'subscription' ? '#c4714a' : '#4a7c59',
                                                }}>
                                                    {tx.type === 'subscription' ? '🔄 Predplatné' : '💝 Tip'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 16px', color: '#2d2118', fontFamily: 'monospace' }}>{tx.fan}</td>
                                            <td style={{ padding: '11px 16px', color: '#2d2118' }}>€{fmt(tx.gross)}</td>
                                            <td style={{ padding: '11px 16px', color: '#c4714a' }}>−€{fmt(tx.fee)}</td>
                                            <td style={{ padding: '11px 16px', fontWeight: 700, color: '#4a7c59' }}>€{fmt(tx.net)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {transactions.length > PER_PAGE && (
                            <div style={{ padding: '12px 20px', borderTop: '1px solid #f0e8df', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => setTxPage(p => Math.max(0, p - 1))} disabled={txPage === 0}
                                    style={{ padding: '6px 16px', borderRadius: 999, border: '1px solid #e8d9c4', background: 'white', cursor: txPage === 0 ? 'default' : 'pointer', opacity: txPage === 0 ? 0.4 : 1, fontSize: 13 }}>
                                    ← Predošlé
                                </button>
                                <button onClick={() => setTxPage(p => p + 1)} disabled={(txPage + 1) * PER_PAGE >= transactions.length}
                                    style={{ padding: '6px 16px', borderRadius: 999, border: '1px solid #e8d9c4', background: 'white', cursor: (txPage + 1) * PER_PAGE >= transactions.length ? 'default' : 'pointer', opacity: (txPage + 1) * PER_PAGE >= transactions.length ? 0.4 : 1, fontSize: 13 }}>
                                    Ďalšie →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}
