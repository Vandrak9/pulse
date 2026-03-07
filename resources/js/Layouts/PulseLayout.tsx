import { Link, usePage } from '@inertiajs/react';

interface Props {
    children: React.ReactNode;
}

export default function PulseLayout({ children }: Props) {
    const { auth } = usePage().props as { auth: { user: { name: string } | null } };
    const user = auth?.user ?? null;

    return (
        <div>
            {/* ── Nav ── */}
            <nav
                className="sticky top-0 z-30 border-b bg-white"
                style={{ borderColor: '#e8d9c4' }}
            >
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="font-serif text-xl font-bold tracking-tight"
                        style={{ color: '#c4714a' }}
                    >
                        PULSE
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/coaches"
                            className="hidden text-sm font-medium sm:block"
                            style={{ color: '#2d2118' }}
                        >
                            Koučovia
                        </Link>

                        {user ? (
                            <Link
                                href="/dashboard"
                                className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
                                style={{ backgroundColor: '#c4714a' }}
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-medium"
                                    style={{ color: '#2d2118' }}
                                >
                                    Prihlásiť sa
                                </Link>
                                <Link
                                    href="/register"
                                    className="rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-colors"
                                    style={{ backgroundColor: '#c4714a' }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.backgroundColor = '#5a3e2b')
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.backgroundColor = '#c4714a')
                                    }
                                >
                                    Registrovať
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {children}
        </div>
    );
}
