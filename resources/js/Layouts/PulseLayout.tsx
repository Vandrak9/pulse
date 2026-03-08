import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Home, Rss, Search, MessageCircle, Bell, User, BarChart2, LogOut, PlusSquare } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface SuggestedCoach {
    id: number;
    name: string;
    specialization: string | null;
    avatar_url: string | null;
}

const TRENDING_CATS = [
    { emoji: '💪', label: 'Silové',  k: 'silov' },
    { emoji: '🧘', label: 'Joga',    k: 'joga' },
    { emoji: '🥗', label: 'Výživa',  k: 'výživ' },
    { emoji: '🏃', label: 'Beh',     k: 'beh' },
    { emoji: '🌿', label: 'Wellness',k: 'wellness' },
    { emoji: '🥊', label: 'Box',     k: 'box' },
];

const HOW_IT_WORKS = [
    { icon: '🔍', text: 'Nájdi kouča, ktorý ti vyhovuje' },
    { icon: '💳', text: 'Predplaťte sa — zruš kedykoľvek' },
    { icon: '💪', text: 'Trénuj s exkluzívnym obsahom' },
];

export default function PulseLayout({ children }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number; name: string; role?: string } | null } };
    const user = auth?.user ?? null;
    const isCoach = user?.role === 'coach';
    const url = page.url;
    const [unreadCount, setUnreadCount] = useState(0);
    const [suggestedCoaches, setSuggestedCoaches] = useState<SuggestedCoach[]>([]);

    function isActive(href: string) {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    }

    // Fetch unread message count (auth only)
    useEffect(() => {
        if (!user) return;
        const fetchUnread = () => {
            fetch('/api/messages/unread-count', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            })
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d && typeof d.count === 'number') setUnreadCount(d.count); })
                .catch(() => {});
        };
        fetchUnread();
        const iv = setInterval(fetchUnread, 30000);
        return () => clearInterval(iv);
    }, [user]);

    // Fetch suggested coaches for right sidebar
    useEffect(() => {
        fetch('/api/coaches/suggested', {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then(r => r.ok ? r.json() : [])
            .then(d => Array.isArray(d) && setSuggestedCoaches(d))
            .catch(() => {});
    }, []);

    // Desktop sidebar nav links (Lucide icons)
    const desktopNavLinks: { label: string; icon: React.ReactNode; href: string; badge: number }[] = [
        { label: 'Domov',       icon: <Home size={18} />,          href: '/',                 badge: 0 },
        { label: 'Feed',        icon: <Rss size={18} />,           href: '/feed',              badge: 0 },
        { label: 'Objaviť',    icon: <Search size={18} />,        href: '/coaches',           badge: 0 },
        { label: 'Správy',     icon: <MessageCircle size={18} />, href: '/messages',          badge: unreadCount },
        { label: 'Notifikácie',icon: <Bell size={18} />,          href: '/notifications',     badge: 0 },
        { label: 'Profil',     icon: <User size={18} />,          href: user ? `/profile/${user.id}` : '/login', badge: 0 },
        ...(isCoach ? [
            { label: 'Dashboard',    icon: <BarChart2 size={18} />,   href: '/dashboard',          badge: 0 },
            { label: 'Pridať obsah', icon: <PlusSquare size={18} />,  href: '/dashboard/broadcast', badge: 0 },
        ] : []),
    ];

    // Mobile bottom tab links (keep emoji for mobile — clear at small size)
    const mobileLinks = [
        { label: 'Domov',   icon: '🏠', href: '/' },
        { label: 'Feed',    icon: '📱', href: '/feed' },
        { label: 'Objaviť',icon: '🔍', href: '/coaches' },
        { label: 'Správy', icon: '💬', href: '/messages' },
        { label: 'Profil', icon: '👤', href: '/dashboard/profile' },
    ];

    return (
        <div style={{ background: '#faf6f0', minHeight: '100vh' }}>

            {/* ── LEFT SIDEBAR — desktop only (md+) ── */}
            <aside
                className="hidden md:flex"
                style={{
                    position: 'fixed', top: 0, left: 0, bottom: 0,
                    width: 256, height: '100vh',
                    borderRight: '1px solid #e8d9c4',
                    background: 'white',
                    flexDirection: 'column',
                    padding: '24px 12px',
                    zIndex: 40,
                    overflowY: 'auto',
                }}
            >
                {/* Logo */}
                <Link
                    href="/"
                    style={{
                        fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700,
                        color: '#c4714a', textDecoration: 'none', letterSpacing: '-0.5px',
                        display: 'block', marginBottom: 28, paddingLeft: 12,
                    }}
                >
                    PULSE
                </Link>

                {/* Nav links */}
                <nav style={{ flex: 1 }}>
                    {desktopNavLinks.map((link) => {
                        const active = isActive(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '11px 14px', borderRadius: 12, marginBottom: 2,
                                    textDecoration: 'none',
                                    fontWeight: active ? 600 : 400, fontSize: 14,
                                    color: active ? '#c4714a' : '#2d2118',
                                    background: active ? '#fce8de' : 'transparent',
                                    transition: 'background 0.15s, color 0.15s',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#faf6f0'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{link.icon}</span>
                                <span style={{ flex: 1 }}>{link.label}</span>
                                {link.badge > 0 && (
                                    <span style={{
                                        background: '#c4714a', color: 'white',
                                        borderRadius: 999, fontSize: 10, fontWeight: 700,
                                        minWidth: 18, height: 18, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        padding: '0 5px',
                                    }}>
                                        {link.badge > 99 ? '99+' : link.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: user info + logout */}
                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f0e8df' }}>
                    {user ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginBottom: 4 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', background: '#c4714a',
                                    color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: isCoach ? '#4a7c59' : '#9a8a7a' }}>
                                        {isCoach ? '🎯 Kouč' : '👤 Fanúšik'}
                                    </div>
                                </div>
                            </div>
                            <Link
                                href="/logout" method="post" as="button"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 14px', width: '100%', textDecoration: 'none',
                                    color: '#9a8a7a', fontSize: 13, background: 'none',
                                    border: 'none', cursor: 'pointer', borderRadius: 10,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <LogOut size={15} style={{ flexShrink: 0 }} /> Odhlásiť sa
                            </Link>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
                            <Link
                                href="/login"
                                style={{
                                    display: 'block', textAlign: 'center', padding: '10px 16px',
                                    borderRadius: 999, border: '1px solid #e8d9c4', color: '#2d2118',
                                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                Prihlásiť sa
                            </Link>
                            <Link
                                href="/register"
                                style={{
                                    display: 'block', textAlign: 'center', padding: '10px 16px',
                                    borderRadius: 999, background: '#c4714a', color: 'white',
                                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#5a3e2b')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#c4714a')}
                            >
                                Registrovať sa
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* ── RIGHT SIDEBAR — lg+ only ── */}
            <aside
                className="hidden lg:flex"
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: 288, height: '100vh',
                    borderLeft: '1px solid #e8d9c4',
                    background: 'white',
                    flexDirection: 'column',
                    padding: '24px 16px',
                    zIndex: 40,
                    overflowY: 'auto',
                }}
            >
                {/* Search */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a8a7a', fontSize: 13 }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Hľadaj koučov..."
                            style={{
                                width: '100%', padding: '10px 14px 10px 34px',
                                borderRadius: 999, border: '1px solid #e8d9c4',
                                fontSize: 13, color: '#2d2118', background: '#faf6f0',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                {/* Suggested coaches */}
                {suggestedCoaches.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', marginBottom: 12, fontFamily: 'Georgia, serif', margin: '0 0 12px 0' }}>
                            Odporúčaní kouči
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {suggestedCoaches.map(coach => (
                                <div key={coach.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Link href={`/coaches/${coach.id}`} style={{ flexShrink: 0 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e8d9c4' }}>
                                            {coach.avatar_url ? (
                                                <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#c4714a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                                    {coach.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <Link href={`/coaches/${coach.id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {coach.name}
                                            </div>
                                        </Link>
                                        {coach.specialization && (
                                            <div style={{ fontSize: 11, color: '#9a8a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {coach.specialization}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        href={`/coaches/${coach.id}`}
                                        style={{
                                            flexShrink: 0, padding: '5px 10px', borderRadius: 999,
                                            border: '1px solid #c4714a', color: '#c4714a',
                                            fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#c4714a'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c4714a'; }}
                                    >
                                        Zobraziť
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <Link href="/coaches" style={{ display: 'block', marginTop: 12, fontSize: 13, color: '#c4714a', textDecoration: 'none', fontWeight: 600 }}>
                            Zobraziť všetkých →
                        </Link>
                    </div>
                )}

                {/* Trending categories */}
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', marginBottom: 10, fontFamily: 'Georgia, serif', margin: '0 0 10px 0' }}>
                        Trending kategórie
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {TRENDING_CATS.map(cat => (
                            <Link
                                key={cat.k}
                                href={`/coaches?category=${cat.k}`}
                                style={{
                                    padding: '5px 12px', borderRadius: 999,
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    fontSize: 12, color: '#2d2118', textDecoration: 'none',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fce8de'; e.currentTarget.style.borderColor = '#c4714a'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#faf6f0'; e.currentTarget.style.borderColor = '#e8d9c4'; }}
                            >
                                {cat.emoji} {cat.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* How it works */}
                <div style={{ borderTop: '1px solid #f0e8df', paddingTop: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', marginBottom: 10, fontFamily: 'Georgia, serif', margin: '0 0 10px 0' }}>
                        Ako to funguje
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {HOW_IT_WORKS.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                                <span style={{ fontSize: 12, color: '#6b5e52', lineHeight: '1.45' }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ── MOBILE TOP NAV — hidden on desktop ── */}
            <nav
                className="sticky top-0 z-50 border-b bg-white md:hidden"
                style={{ borderColor: '#e8d9c4' }}
            >
                <div className="flex items-center gap-3 px-4 py-3">
                    <Link
                        href="/"
                        className="flex-shrink-0 font-serif text-2xl font-bold tracking-tight"
                        style={{ color: '#c4714a' }}
                    >
                        PULSE
                    </Link>

                    <div className="flex-1" />

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
                                className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
                                style={{ backgroundColor: '#c4714a' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c4714a')}
                            >
                                Registrovať
                            </Link>
                        </div>
                    )}

                    {user && (
                        <div className="flex items-center gap-3">
                            <a href="/messages" className="relative rounded-full p-1.5 transition hover:bg-gray-100" style={{ display: 'inline-flex' }}>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#2d2118' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
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
                            <div
                                style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: '#c4714a', color: 'white',
                                    fontWeight: 700, fontSize: 14, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── MAIN CONTENT — offset by sidebars on desktop ── */}
            <div className="md:ml-64 lg:mr-72" style={{ minHeight: '100vh', background: '#faf6f0' }}>
                <main className="animate-fade-in">
                    {children}
                </main>
            </div>

            {/* ── MOBILE BOTTOM TAB BAR — hidden on desktop ── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden"
                style={{ borderColor: '#e8d9c4' }}
            >
                <div className="flex">
                    {mobileLinks.map((tab) => {
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
                                            position: 'absolute', top: -4, right: -8,
                                            background: '#c4714a', color: 'white',
                                            borderRadius: 999, fontSize: 9, fontWeight: 700,
                                            minWidth: 16, height: 16,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '0 4px', lineHeight: 1,
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

            {/* Mobile bottom padding */}
            <div className="h-16 md:hidden" />
        </div>
    );
}
