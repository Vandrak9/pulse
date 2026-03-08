import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

export default function Earnings({ coach, summary, monthly_table, transactions }: Props) {
    const [txPage, setTxPage] = useState(0);
    const PER_PAGE = 10;
    const txSlice = transactions.slice(txPage * PER_PAGE, (txPage + 1) * PER_PAGE);

    const chartData = monthly_table.slice(-6);

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

                    {/* Chart */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: '20px 16px', marginBottom: 24 }}>
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#2d2118', marginBottom: 16 }}>
                            Mesačné zárobky (posledných 6 mesiacov)
                        </h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chartData} barSize={36} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="month_short" tick={{ fontSize: 12, fill: '#9a8a7a' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9a8a7a' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                                <Tooltip
                                    formatter={(v) => [`€${fmt(Number(v))}`, 'Čistý zárobok']}
                                    contentStyle={{ borderRadius: 10, border: '1px solid #e8d9c4', fontSize: 13 }}
                                />
                                <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={entry.status === 'pending' ? '#c4714a' : '#f0c4a8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

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
