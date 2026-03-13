import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_banned: boolean;
    joined_at: string;
    last_seen_at: string | null;
}

interface Summary {
    total: number;
    fans: number;
    coaches: number;
    admins: number;
    banned: number;
}

interface Props {
    users: User[];
    summary: Summary;
    filter: string;
    search: string;
    flash?: { success?: string; error?: string };
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    fan:   { bg: '#faf6f0', text: '#9a8a7a' },
    coach: { bg: '#fff8e6', text: '#b45309' },
    admin: { bg: '#edf7f0', text: '#4a7c59' },
};

function action(url: string) {
    router.post(url, {}, { preserveScroll: true });
}

export default function Users({ users, summary, filter, search, flash }: Props) {
    const filters = [
        { key: 'all',    label: `Všetci (${summary.total})` },
        { key: 'fan',    label: `Fanúšikovia (${summary.fans})` },
        { key: 'coach',  label: `Koučovia (${summary.coaches})` },
        { key: 'admin',  label: `Admini (${summary.admins})` },
        { key: 'banned', label: `Zabanovaní (${summary.banned})` },
    ];

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value;
        router.get('/admin/users', { filter, search: q }, { preserveState: true });
    }

    return (
        <AdminLayout>
            <Head title="Admin — Používatelia" />
            <div style={{ padding: '32px 40px' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', marginBottom: 24 }}>
                    Správa používateľov
                </h1>

                {flash?.success && (
                    <div style={{ marginBottom: 16, padding: '10px 16px', backgroundColor: '#4a7c59', color: 'white', borderRadius: 10, fontSize: 14 }}>
                        {flash.success}
                    </div>
                )}

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Celkom', value: summary.total, color: '#c4714a' },
                        { label: 'Fanúšikovia', value: summary.fans, color: '#9a8a7a' },
                        { label: 'Koučovia', value: summary.coaches, color: '#b45309' },
                        { label: 'Admini', value: summary.admins, color: '#4a7c59' },
                        { label: 'Zabanovaní', value: summary.banned, color: '#b91c1c' },
                    ].map(s => (
                        <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filters + search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {filters.map(f => (
                            <button
                                key={f.key}
                                onClick={() => router.get('/admin/users', { filter: f.key, search }, { preserveState: true })}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    fontSize: 12,
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

                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                        <input
                            name="q"
                            defaultValue={search}
                            placeholder="Hľadať meno alebo email…"
                            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #e8d9c4', fontSize: 13, outline: 'none', width: 220 }}
                        />
                        <button
                            type="submit"
                            style={{ padding: '6px 14px', backgroundColor: '#c4714a', color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        >
                            Hľadať
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div style={{ backgroundColor: 'white', border: '1px solid #e8d9c4', borderRadius: 16, overflow: 'hidden' }}>
                    {users.length === 0 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: '#9a8a7a', fontSize: 14 }}>
                            Žiadni používatelia.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ backgroundColor: '#faf6f0', borderBottom: '1px solid #e8d9c4' }}>
                                    {['Používateľ', 'Rola', 'Registrovaný', 'Naposledy aktívny', 'Stav', 'Akcie'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#2d2118', fontSize: 12 }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, i) => {
                                    const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.fan;
                                    return (
                                        <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f5ede4' : 'none', opacity: user.is_banned ? 0.6 : 1 }}>
                                            <td style={{ padding: '10px 14px' }}>
                                                <div style={{ fontWeight: 600, color: '#2d2118' }}>{user.name}</div>
                                                <div style={{ color: '#9a8a7a', fontSize: 11 }}>{user.email}</div>
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <span style={{ backgroundColor: rc.bg, color: rc.text, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 14px', color: '#9a8a7a' }}>{user.joined_at}</td>
                                            <td style={{ padding: '10px 14px', color: '#9a8a7a' }}>{user.last_seen_at ?? '—'}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                {user.is_banned ? (
                                                    <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                                                        Zabanovaný
                                                    </span>
                                                ) : (
                                                    <span style={{ backgroundColor: '#edf7f0', color: '#4a7c59', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                                                        Aktívny
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                                {user.is_banned ? (
                                                    <button
                                                        onClick={() => action(`/admin/users/${user.id}/unban`)}
                                                        style={{ padding: '4px 10px', backgroundColor: '#4a7c59', color: 'white', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Odbanovať
                                                    </button>
                                                ) : (
                                                    user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Zabanovať používateľa ${user.name}?`)) {
                                                                    action(`/admin/users/${user.id}/ban`);
                                                                }
                                                            }}
                                                            style={{ padding: '4px 10px', backgroundColor: '#b91c1c', color: 'white', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                                                        >
                                                            Zabanovať
                                                        </button>
                                                    )
                                                )}
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
