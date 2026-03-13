import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

const NAV = [
    { href: '/admin',             label: 'Dashboard',      icon: '▦' },
    { href: '/admin/coaches',     label: 'Koučovia',       icon: '🏋' },
    { href: '/admin/users',       label: 'Používatelia',   icon: '👥' },
    { href: '/admin/transactions',label: 'Transakcie',     icon: '💳' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { url } = usePage();

    const active = (href: string) =>
        href === '/admin' ? url === '/admin' : url.startsWith(href);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#faf6f0' }}>
            {/* Sidebar */}
            <aside style={{
                width: 220,
                backgroundColor: '#2d2118',
                color: '#e8d9c4',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}>
                <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #3d3028' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Georgia, serif', color: '#c4714a' }}>
                        PULSE
                    </div>
                    <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>Admin Panel</div>
                </div>

                <nav style={{ flex: 1, padding: '12px 0' }}>
                    {NAV.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 20px',
                                fontSize: 14,
                                fontWeight: active(item.href) ? 600 : 400,
                                color: active(item.href) ? '#c4714a' : '#e8d9c4',
                                backgroundColor: active(item.href) ? '#3d3028' : 'transparent',
                                textDecoration: 'none',
                                borderLeft: active(item.href) ? '3px solid #c4714a' : '3px solid transparent',
                                transition: 'all 0.15s',
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: '16px 20px', borderTop: '1px solid #3d3028' }}>
                    <Link
                        href="/dashboard"
                        style={{ fontSize: 12, color: '#9a8a7a', textDecoration: 'none' }}
                    >
                        ← Späť na platformu
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, overflowX: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
