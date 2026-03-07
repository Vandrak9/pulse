import { Link, usePage } from '@inertiajs/react';

interface Props {
    children: React.ReactNode;
}

const TAB_ITEMS = [
    { label: 'Domov',    icon: '🏠', href: '/' },
    { label: 'Feed',     icon: '📱', href: '/feed' },
    { label: 'Správy',  icon: '💬', href: '/messages' },
    { label: 'Profil',  icon: '👤', href: '/dashboard/profile' },
];

export default function PulseLayout({ children }: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { name: string } | null } };
    const user = auth?.user ?? null;
    const url = page.url;

    function isActive(href: string) {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    }

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
                            <button className="relative rounded-full p-1.5 transition hover:bg-gray-100">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#2d2118' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {/* Unread dot */}
                                <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ backgroundColor: '#c4714a' }} />
                            </button>

                            {/* Avatar */}
                            <Link href="/dashboard/profile">
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                                    style={{ backgroundColor: '#c4714a' }}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </Link>
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
                    {TAB_ITEMS.map((tab) => {
                        const active = isActive(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors"
                                style={{ color: active ? '#c4714a' : '#9a8a7a' }}
                            >
                                <span className="text-lg leading-none">{tab.icon}</span>
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
