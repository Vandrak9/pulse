import React, { useRef, useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Home, Rss, Compass, MessageCircle, Bell, User, LayoutDashboard, LogOut, PlusSquare, Megaphone, Radio, Dumbbell, Flame, Leaf, Activity, Heart, Zap } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface SuggestedCoach {
    id: number;
    name: string;
    specialization: string | null;
    rating_avg: number;
    rating_count: number;
    avatar_url: string | null;
}

interface DashboardSidebar {
    total_likes: number;
    total_posts: number;
    unread_messages: number;
    completeness: number;
    missing_items: string[];
    recent_subscribers: Array<{
        id: number;
        name: string;
        avatar: string | null;
        subscribed_at: string;
    }>;
}

const TRENDING_CATS: { icon: React.ReactNode; label: string; k: string }[] = [
    { icon: <Dumbbell size={14} />, label: 'Silové',   k: 'silov' },
    { icon: <Flame size={14} />,    label: 'Joga',     k: 'joga' },
    { icon: <Leaf size={14} />,     label: 'Výživa',   k: 'výživ' },
    { icon: <Activity size={14} />, label: 'Beh',      k: 'beh' },
    { icon: <Heart size={14} />,    label: 'Wellness', k: 'wellness' },
    { icon: <Zap size={14} />,      label: 'Box',      k: 'box' },
];


export default function PulseLayout({ children }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number; name: string; role?: string; coach_id?: number | null } | null } };
    const dashboardSidebar = (page.props as any).dashboard_sidebar as DashboardSidebar | undefined;
    const user = auth?.user ?? null;
    const isCoach = user?.role === 'coach';
    const url = page.url;
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [suggestedCoaches, setSuggestedCoaches] = useState<SuggestedCoach[]>([]);
    const [addMenuOpen, setAddMenuOpen] = useState(false);
    const addMenuRef = useRef<HTMLDivElement>(null);

    // Close "Pridať obsah" menu when clicking outside
    useEffect(() => {
        if (!addMenuOpen) return;
        function handleClick(e: MouseEvent) {
            if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
                setAddMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [addMenuOpen]);

    function isActive(href: string) {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    }

    // Fetch unread counts (auth only)
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
            fetch('/api/notifications/unread-count', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            })
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d && typeof d.count === 'number') setUnreadNotifications(d.count); })
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

    // Desktop sidebar nav links — different order for coaches vs fans
    const sharedLinks: { label: string; icon: React.ReactNode; href: string; badge: number }[] = [
        { label: 'Feed',        icon: <Rss size={18} />,           href: '/feed',          badge: 0 },
        { label: 'Objaviť',    icon: <Compass size={18} />,       href: '/coaches',       badge: 0 },
        { label: 'Správy',     icon: <MessageCircle size={18} />, href: '/messages',      badge: unreadCount },
        { label: 'Notifikácie',icon: <Bell size={18} />,          href: '/notifications', badge: unreadNotifications },
        { label: 'Profil',     icon: <User size={18} />,          href: user ? `/profile/${user.id}` : '/login', badge: 0 },
    ];

    const desktopNavLinks: { label: string; icon: React.ReactNode; href: string; badge: number; isAddMenu?: boolean }[] = isCoach
        ? [
            { label: 'Dashboard',    icon: <LayoutDashboard size={18} />, href: '/dashboard',           badge: 0 },
            { label: 'Live Stream',  icon: <Radio size={18} />,           href: '/dashboard/live',      badge: 0 },
            { label: 'Broadcast',    icon: <Megaphone size={18} />,       href: '/dashboard/broadcast', badge: 0 },
            ...sharedLinks,
            { label: 'Pridať obsah', icon: <PlusSquare size={18} />,      href: '#',                    badge: 0, isAddMenu: true },
          ]
        : [
            { label: 'Domov', icon: <Home size={18} />, href: '/', badge: 0 },
            ...sharedLinks,
          ];

    // Mobile bottom tab links — Lucide icons, role-aware
    const coachMobileNav = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard',                               badge: 0 },
        { label: 'Feed',      icon: Rss,             href: '/feed',                                    badge: 0 },
        { label: 'Správy',   icon: MessageCircle,   href: '/messages',                                badge: unreadCount },
        { label: 'Notif.',   icon: Bell,            href: '/notifications',                           badge: unreadNotifications },
        { label: 'Profil',   icon: User,            href: user ? `/profile/${user.id}` : '/login',   badge: 0 },
    ];
    const fanMobileNav = [
        { label: 'Domov',   icon: Home,          href: '/',                                          badge: 0 },
        { label: 'Feed',    icon: Rss,           href: '/feed',                                      badge: 0 },
        { label: 'Objaviť',icon: Compass,        href: '/coaches',                                   badge: 0 },
        { label: 'Správy', icon: MessageCircle, href: '/messages',                                   badge: unreadCount },
        { label: 'Profil', icon: User,          href: user ? `/profile/${user.id}` : '/login',      badge: 0 },
    ];
    const mobileNav = isCoach ? coachMobileNav : fanMobileNav;

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
                        if (link.isAddMenu) {
                            return (
                                <div key="add-menu" ref={addMenuRef} style={{ position: 'relative', marginBottom: 2 }}>
                                    <button
                                        onClick={() => setAddMenuOpen(v => !v)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '11px 14px', borderRadius: 12,
                                            background: addMenuOpen ? '#fce8de' : 'transparent',
                                            border: 'none', cursor: 'pointer',
                                            fontWeight: addMenuOpen ? 600 : 400, fontSize: 14,
                                            color: addMenuOpen ? '#c4714a' : '#2d2118',
                                            transition: 'background 0.15s, color 0.15s', textAlign: 'left',
                                        }}
                                        onMouseEnter={e => { if (!addMenuOpen) e.currentTarget.style.background = '#faf6f0'; }}
                                        onMouseLeave={e => { if (!addMenuOpen) e.currentTarget.style.background = addMenuOpen ? '#fce8de' : 'transparent'; }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{link.icon}</span>
                                        <span style={{ flex: 1 }}>{link.label}</span>
                                        <span style={{ fontSize: 10, color: '#9a8a7a' }}>{addMenuOpen ? '▲' : '▼'}</span>
                                    </button>
                                    {addMenuOpen && (
                                        <div style={{
                                            position: 'absolute', left: 0, right: 0, top: '100%',
                                            background: 'white', border: '1px solid #e8d9c4',
                                            borderRadius: 12, overflow: 'hidden', zIndex: 50,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                        }}>
                                            <Link
                                                href="/dashboard/posts/create"
                                                onClick={() => setAddMenuOpen(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '12px 16px', textDecoration: 'none',
                                                    fontSize: 14, color: '#2d2118',
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <span>📝</span> Príspevok
                                            </Link>
                                            <div style={{ height: 1, background: '#f0e8df', margin: '0 12px' }} />
                                            <Link
                                                href="/dashboard/reels/create"
                                                onClick={() => setAddMenuOpen(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '12px 16px', textDecoration: 'none',
                                                    fontSize: 14, color: '#2d2118',
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <span>⚡</span> Reel
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        }
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
                            {/* Profile links */}
                            <Link
                                href={`/profile/${user.id}`}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', textDecoration: 'none', color: '#2d2118', fontSize: 13, borderRadius: 10, transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <User size={15} style={{ flexShrink: 0, color: '#9a8a7a' }} /> 👤 Môj profil
                            </Link>
                            {isCoach && user.coach_id && (
                                <Link
                                    href={`/coaches/${user.coach_id}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', textDecoration: 'none', color: '#2d2118', fontSize: 13, borderRadius: 10, transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <span style={{ fontSize: 15, flexShrink: 0 }}>🏋️</span> Verejný profil
                                </Link>
                            )}
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
                {dashboardSidebar && isCoach ? (
                    /* ── Coach dashboard sidebar ── */
                    <>
                        {/* Quick stats */}
                        <div style={{ marginBottom: 20 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', margin: '0 0 12px 0' }}>
                                📊 Rýchly prehľad
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#faf6f0', borderRadius: 10 }}>
                                    <span style={{ fontSize: 13, color: '#5a4a3a' }}>❤️ Lajky celkom</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2d2118' }}>{dashboardSidebar.total_likes}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#faf6f0', borderRadius: 10 }}>
                                    <span style={{ fontSize: 13, color: '#5a4a3a' }}>📝 Príspevky</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2d2118' }}>{dashboardSidebar.total_posts}</span>
                                </div>
                                <Link href="/messages" style={{ textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: dashboardSidebar.unread_messages > 0 ? '#fce8de' : '#faf6f0', borderRadius: 10, cursor: 'pointer' }}>
                                        <span style={{ fontSize: 13, color: '#5a4a3a' }}>✉️ Neprečítané správy</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: dashboardSidebar.unread_messages > 0 ? '#c4714a' : '#2d2118' }}>
                                            {dashboardSidebar.unread_messages}
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Profile completeness */}
                        <div style={{ marginBottom: 20, padding: '14px', background: '#faf6f0', borderRadius: 12, border: '1px solid #e8d9c4' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#2d2118' }}>✅ Profil</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: dashboardSidebar.completeness === 100 ? '#4a7c59' : '#c4714a' }}>
                                    {dashboardSidebar.completeness}%
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 6, background: '#e8d9c4', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                                <div style={{
                                    height: '100%',
                                    width: `${dashboardSidebar.completeness}%`,
                                    background: dashboardSidebar.completeness === 100 ? '#4a7c59' : '#c4714a',
                                    borderRadius: 999,
                                    transition: 'width 0.3s',
                                }} />
                            </div>
                            {dashboardSidebar.missing_items.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {dashboardSidebar.missing_items.slice(0, 2).map((item, i) => (
                                        <Link key={i} href="/dashboard/profile" style={{ textDecoration: 'none' }}>
                                            <div style={{ fontSize: 11, color: '#c4714a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ flexShrink: 0 }}>·</span> {item}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent subscribers */}
                        <div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', margin: '0 0 12px 0' }}>
                                👥 Noví predplatitelia
                            </h3>
                            {dashboardSidebar.recent_subscribers.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#9a8a7a' }}>Zatiaľ žiadni predplatitelia</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {dashboardSidebar.recent_subscribers.map((sub, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                                                background: '#c4714a', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 13, overflow: 'hidden',
                                                border: '2px solid #e8d9c4',
                                            }}>
                                                {sub.avatar ? (
                                                    <img src={sub.avatar} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : sub.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {sub.name}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#9a8a7a' }}>{sub.subscribed_at}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link href="/dashboard/subscribers" style={{ display: 'block', marginTop: 12, fontSize: 13, color: '#c4714a', textDecoration: 'none', fontWeight: 600 }}>
                                → Zobraziť všetkých
                            </Link>
                        </div>
                    </>
                ) : (
                    /* ── Default sidebar (fans / non-dashboard pages) ── */
                    <>
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
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', margin: '0 0 12px 0' }}>
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                                    {coach.specialization && (
                                                        <span style={{ fontSize: 11, color: '#9a8a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {coach.specialization}
                                                        </span>
                                                    )}
                                                    {coach.rating_count > 0 && (
                                                        <span style={{ fontSize: 11, color: '#c4714a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                            ★ {coach.rating_avg.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
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
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif', margin: '0 0 10px 0' }}>
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
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fce8de'; e.currentTarget.style.borderColor = '#c4714a'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#faf6f0'; e.currentTarget.style.borderColor = '#e8d9c4'; }}
                                    >
                                        {cat.icon} {cat.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
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
            <div className="md:ml-64 lg:mr-72" style={{ minHeight: '100vh', background: '#faf6f0', display: 'flex', flexDirection: 'column' }}>
                <main className="animate-fade-in flex-1 pb-20 md:pb-0">
                    {children}
                </main>
                <footer style={{ borderTop: '1px solid #e8d9c4', padding: '32px 16px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
                        {[
                            { href: '/legal/terms', label: 'Podmienky použitia' },
                            { href: '/legal/privacy', label: 'Ochrana osobných údajov' },
                            { href: '/legal/gdpr', label: 'GDPR' },
                            { href: '/legal/cookies', label: 'Cookies' },
                        ].map(l => (
                            <Link key={l.href} href={l.href} style={{ fontSize: 12, color: '#9a8a7a', textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#c4714a')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#9a8a7a')}
                            >
                                {l.label}
                            </Link>
                        ))}
                        <a href="mailto:hello@pulsehub.fun" style={{ fontSize: 12, color: '#9a8a7a', textDecoration: 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#c4714a')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#9a8a7a')}
                        >
                            Kontakt
                        </a>
                    </div>
                    <p style={{ fontSize: 12, color: '#9a8a7a' }}>© 2026 PULSE Platform · Všetky práva vyhradené</p>
                    <p style={{ fontSize: 10, color: '#b0a090', marginTop: 4 }}>
                        Platby sú spracované bezpečne cez Stripe · PULSE neposkytuje medicínske poradenstvo
                    </p>
                </footer>
            </div>

            {/* ── MOBILE BOTTOM TAB BAR — hidden on desktop ── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
                style={{ background: 'white', borderTop: '1px solid #e8d9c4' }}
            >
                {mobileNav.map((tab) => {
                    const active = isActive(tab.href);
                    const IconComponent = tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-1 flex-col items-center justify-center py-2 transition-colors"
                            style={{ gap: 2 }}
                        >
                            <span style={{ position: 'relative', display: 'inline-flex' }}>
                                <IconComponent
                                    size={22}
                                    strokeWidth={active ? 2.5 : 1.8}
                                    style={{ color: active ? '#c4714a' : '#9a8a7a', transition: 'all 0.15s' }}
                                />
                                {tab.badge > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -4, right: -6,
                                        background: '#e53e3e', color: 'white',
                                        borderRadius: 999, fontSize: 9, fontWeight: 700,
                                        minWidth: 16, height: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 3px', lineHeight: 1,
                                    }}>
                                        {tab.badge > 9 ? '9+' : tab.badge}
                                    </span>
                                )}
                            </span>
                            <span style={{
                                fontSize: 10, fontWeight: 500,
                                color: active ? '#c4714a' : '#9a8a7a',
                                transition: 'color 0.15s',
                            }}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Mobile bottom padding */}
            <div className="h-16 md:hidden" />
        </div>
    );
}
