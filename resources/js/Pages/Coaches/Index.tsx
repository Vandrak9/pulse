import { Head, Link } from '@inertiajs/react';

interface Coach {
    id: number;
    name: string;
    specialization: string | null;
    monthly_price: string;
    avatar_url: string | null;
}

interface PaginatedCoaches {
    data: Coach[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    coaches: PaginatedCoaches;
}

export default function CoachesIndex({ coaches }: Props) {
    return (
        <>
            <Head title="Coaches" />

            <div className="min-h-screen" style={{ backgroundColor: '#faf6f0' }}>
                {/* Header */}
                <div className="py-12 text-center" style={{ backgroundColor: '#2d2118' }}>
                    <h1 className="text-4xl font-bold" style={{ color: '#faf6f0' }}>
                        Find Your Coach
                    </h1>
                    <p className="mt-2 text-lg" style={{ color: '#c4714a' }}>
                        Train with the best fitness professionals
                    </p>
                </div>

                {/* Grid */}
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    {coaches.data.length === 0 ? (
                        <p className="text-center" style={{ color: '#2d2118' }}>
                            No coaches available yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {coaches.data.map((coach) => (
                                <Link
                                    key={coach.id}
                                    href={`/coaches/${coach.id}`}
                                    className="group block rounded-2xl bg-white shadow-sm transition hover:shadow-md"
                                >
                                    {/* Avatar */}
                                    <div
                                        className="flex h-48 items-center justify-center rounded-t-2xl"
                                        style={{ backgroundColor: '#f0e8df' }}
                                    >
                                        {coach.avatar_url ? (
                                            <img
                                                src={coach.avatar_url}
                                                alt={coach.name}
                                                className="h-full w-full rounded-t-2xl object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
                                                style={{ backgroundColor: '#c4714a' }}
                                            >
                                                {coach.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3
                                            className="text-lg font-semibold group-hover:underline"
                                            style={{ color: '#2d2118' }}
                                        >
                                            {coach.name}
                                        </h3>
                                        {coach.specialization && (
                                            <p
                                                className="mt-1 text-sm"
                                                style={{ color: '#4a7c59' }}
                                            >
                                                {coach.specialization}
                                            </p>
                                        )}
                                        <div className="mt-3 flex items-center justify-between">
                                            <span
                                                className="text-sm font-medium"
                                                style={{ color: '#2d2118' }}
                                            >
                                                {parseFloat(coach.monthly_price) === 0
                                                    ? 'Free'
                                                    : `€${parseFloat(coach.monthly_price).toFixed(2)} / mo`}
                                            </span>
                                            <span
                                                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                                                style={{ backgroundColor: '#c4714a' }}
                                            >
                                                Subscribe
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {coaches.last_page > 1 && (
                        <div className="mt-10 flex justify-center gap-2">
                            {coaches.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                        link.active
                                            ? 'text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                    } ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                    style={link.active ? { backgroundColor: '#c4714a' } : {}}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
