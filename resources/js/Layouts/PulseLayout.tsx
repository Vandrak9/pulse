import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';

interface Props {
    children: React.ReactNode;
}

const NAV_LINKS = [
    { label: 'Domov',   icon: '🏠', href: '/' },
    { label: 'Feed',    icon: '📱', href: '/feed' },
    { label: 'Správy', icon: '💬', href: '/messages' },
    { label: 'Profil',  icon: '👤', href: '/dashboard/profile' },
];

export default function PulseLayout({ children }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { name: string; role?: string } | null } };
    const user = auth?.user ?? null;
    const isCoach = user?.role === 'coach';
    const url = page.url;
    const [unreadCount, setUnreadCount] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function isActive(href: string) {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    }

    // Fetch unread message count every 30 seconds (only when authenticated)
    useEffect(() => {
        if (!user) return;

        const fetchUnread = () => {
            fetch('/api/messages/unread-count', {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data && typeof data.count === 'number') {
                        setUnreadCount(data.count);
                    }
                })
                .catch(() => {});
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#faf6f0' }}>

            {/* ── Top nav ── */}
            <nav
                className="sticky top-0 z-50 border-b bg-white"
                style={{ borderColor: '#e8d9c4' }}
            >
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">

                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex-shrink-0 font-serif text-2xl font-bold tracking-tight"
                        style={{ color: '#c4714a' }}
                    >
                        PULSE
                    </Link>

                    {/* Search bar — desktop only */}
                    <div className="hidden flex-1 max-w-sm md:block">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Hľadaj koučov..."
                                className="w-full rounded-full border py-2 pl-9 pr-4 text-sm outline-none transition focus:ring-2"
                                style={{ borderColor: '#e8d9c4', color: '#2d2118', '--tw-ring-color': '#c4714a' } as React.CSSProperties}
                            />
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1 md:hidden" />

                    {/* Right — guest */}
                    {!user && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="hidden rounded-full border px-4 py-1.5 text-sm font-medium transition hover:bg-gray-50 sm:block"
                                style={{ borderColor: '#e8d9c4', color: '#2d2118' }}
                            >
                                Prihlásiť
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-colors"
                                style={{ backgroundColor: '#c4714a' }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c4714a')}
                            >
                                Registrovať
                            </Link>
                        </div>
                    )}

                    {/* Right — logged in */}
                    {user && (
                        <div className="flex items-center gap-3">
                            {/* Notification bell */}
                            <a href="/messages" className="relative rounded-full p-1.5 transition hover:bg-gray-100" style={{ display: 'inline-flex' }}>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#2d2118' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {/* Unread badge — only shown when there are unread messages */}
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: 2, right: 2,
                                        background: '#e53e3e', color: 'white',
                                        borderRadius: 999, fontSize: 9, fontWeight: 700,
                                        minWidth: 16, height: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 3px', lineHeight: 1,
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </a>

                            {/* Avatar with dropdown */}
                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setDropdownOpen(o => !o)}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: '#c4714a', color: 'white',
                                        fontWeight: 700, fontSize: 14, border: 'none',
                                        cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </button>
                                {dropdownOpen && (
                                    <div style={{
                                        position: 'absolute', top: 40, right: 0,
                                        background: 'white', border: '1px solid #e8d9c4',
                                        borderRadius: 12, minWidth: 180,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        zIndex: 100, overflow: 'hidden',
                                    }}>
                                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0e8df' }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#2d2118' }}>{user.name}</div>
                                            <div style={{ fontSize: 12, color: '#9a8a7a' }}>{isCoach ? 'Kouč' : 'Fanúšik'}</div>
                                        </div>
                                        {isCoach && (
                                            <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', textDecoration: 'none', color: '#2d2118', fontSize: 14 }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <span>📊</span> Dashboard
                                            </Link>
                                        )}
                                        <Link href="/dashboard/profile" onClick={() => setDropdownOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', textDecoration: 'none', color: '#2d2118', fontSize: 14 }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span>👤</span> Profil
                                        </Link>
                                        <Link href="/logout" method="post" as="button"
                                            onClick={() => setDropdownOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', width: '100%', textDecoration: 'none', color: '#9a8a7a', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #f0e8df' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <span>🚪</span> Odhlásiť sa
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── Page content ── */}
            <main className="flex-1 animate-fade-in">
                {children}
            </main>

            {/* ── Bottom tab bar — mobile only ── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden"
                style={{ borderColor: '#e8d9c4' }}
            >
                <div className="flex">
                    {NAV_LINKS.map((tab) => {
                        const active = isActive(tab.href);
                        const isMessages = tab.href === '/messages';
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors"
                                style={{ color: active ? '#c4714a' : '#9a8a7a' }}
                            >
                                <span className="relative text-lg leading-none">
                                    {tab.icon}
                                    {isMessages && unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -8,
                                            background: '#c4714a',
                                            color: 'white',
                                            borderRadius: 999,
                                            fontSize: 9,
                                            fontWeight: 700,
                                            minWidth: 16,
                                            height: 16,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0 4px',
                                            lineHeight: 1,
                                        }}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </span>
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom padding so content isn't hidden behind tab bar on mobile */}
            <div className="h-16 md:hidden" />
        </div>
    );
}
