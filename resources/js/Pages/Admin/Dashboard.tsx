import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Stats {
    total_users: number;
    new_users_month: number;
    fans: number;
    coaches_total: number;
    coaches_pending: number;
    coaches_verified: number;
    coaches_suspended: number;
    active_subscriptions: number;
    tips_count: number;
    tips_total: number;
    messages_count: number;
    messages_total: number;
    platform_revenue: number;
}

interface Props {
    stats: Stats;
}

function StatCard({ label, value, sub, color = '#c4714a' }: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
}) {
    return (
        <div style={{
            backgroundColor: 'white',
            border: '1px solid #e8d9c4',
            borderRadius: 16,
            padding: '20px 24px',
        }}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', marginTop: 4 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

import { ReactNode } from 'react';

export default function Dashboard({ stats }: Props) {
    const fmt = (n: number) =>
        new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(n);

    return (
        <AdminLayout>
            <Head title="Admin — Dashboard" />
            <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', marginBottom: 32 }}>
                    Dashboard
                </h1>

                {/* Users */}
                <Section title="Používatelia">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <StatCard label="Celkom používateľov" value={stats.total_users} />
                        <StatCard label="Fanúšikovia" value={stats.fans} color="#9a8a7a" />
                        <StatCard label="Noví tento mesiac" value={`+${stats.new_users_month}`} color="#4a7c59" />
                        <StatCard label="Aktívne predplatné" value={stats.active_subscriptions} color="#2d6a9f" />
                    </div>
                </Section>

                {/* Coaches */}
                <Section title="Koučovia">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <StatCard label="Celkom koučov" value={stats.coaches_total} />
                        <StatCard label="Čakajú na schválenie" value={stats.coaches_pending} color="#b45309" />
                        <StatCard label="Schválení" value={stats.coaches_verified} color="#4a7c59" />
                        <StatCard label="Pozastavení" value={stats.coaches_suspended} color="#b91c1c" />
                    </div>
                </Section>

                {/* Revenue */}
                <Section title="Príjmy platformy">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <StatCard
                            label="Príjem platformy (15%)"
                            value={fmt(stats.platform_revenue)}
                            sub="celkový"
                            color="#c4714a"
                        />
                        <StatCard
                            label="Tipy"
                            value={fmt(stats.tips_total)}
                            sub={`${stats.tips_count} transakcií`}
                        />
                        <StatCard
                            label="Platené správy"
                            value={fmt(stats.messages_total)}
                            sub={`${stats.messages_count} správ`}
                        />
                        <StatCard
                            label="Predplatné (celkem)"
                            value={stats.active_subscriptions}
                            sub="aktívnych"
                            color="#2d6a9f"
                        />
                    </div>
                </Section>
            </div>
        </AdminLayout>
    );
}
