import { Head, Link } from '@inertiajs/react';

interface CoachData {
    id: number;
    name: string;
    bio: string | null;
    specialization: string | null;
    monthly_price: string;
    is_verified: boolean;
    avatar_url: string | null;
}

interface Post {
    id: number;
    title: string;
    content: string;
    media_path: string | null;
    is_exclusive: boolean;
    created_at: string;
}

interface Props {
    coach: CoachData;
    posts: Post[];
    isSubscribed: boolean;
}

export default function CoachShow({ coach, posts, isSubscribed }: Props) {
    const price = parseFloat(coach.monthly_price);

    return (
        <>
            <Head title={coach.name} />

            <div className="min-h-screen" style={{ backgroundColor: '#faf6f0' }}>
                {/* Back link */}
                <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
                    <Link
                        href="/coaches"
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#c4714a' }}
                    >
                        ← All Coaches
                    </Link>
                </div>

                {/* Cover / Hero */}
                <div
                    className="h-40 w-full"
                    style={{ backgroundColor: '#2d2118' }}
                />

                {/* Profile card */}
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="-mt-16 flex items-end gap-5">
                        {/* Avatar */}
                        <div
                            className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full border-4 border-white text-4xl font-bold text-white shadow"
                            style={{
                                backgroundColor: '#c4714a',
                                overflow: 'hidden',
                            }}
                        >
                            {coach.avatar_url ? (
                                <img
                                    src={coach.avatar_url}
                                    alt={coach.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                coach.name.charAt(0).toUpperCase()
                            )}
                        </div>

                        {/* Name + badge */}
                        <div className="pb-2">
                            <div className="flex items-center gap-2">
                                <h1
                                    className="text-2xl font-bold"
                                    style={{ color: '#2d2118' }}
                                >
                                    {coach.name}
                                </h1>
                                {coach.is_verified && (
                                    <span
                                        className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                                        style={{ backgroundColor: '#4a7c59' }}
                                    >
                                        Verified
                                    </span>
                                )}
                            </div>
                            {coach.specialization && (
                                <p
                                    className="mt-0.5 text-sm font-medium"
                                    style={{ color: '#4a7c59' }}
                                >
                                    {coach.specialization}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bio + Subscribe */}
                    <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-xl">
                            {coach.bio ? (
                                <p className="leading-relaxed" style={{ color: '#2d2118' }}>
                                    {coach.bio}
                                </p>
                            ) : (
                                <p className="italic text-gray-400">No bio yet.</p>
                            )}
                        </div>

                        {/* Subscribe box */}
                        <div
                            className="flex-shrink-0 rounded-2xl p-5 shadow-sm"
                            style={{ backgroundColor: '#fff', minWidth: '200px' }}
                        >
                            <p className="text-sm font-medium" style={{ color: '#2d2118' }}>
                                Monthly subscription
                            </p>
                            <p
                                className="mt-1 text-3xl font-bold"
                                style={{ color: '#c4714a' }}
                            >
                                {price === 0 ? 'Free' : `€${price.toFixed(2)}`}
                            </p>
                            {!isSubscribed && (
                                <button
                                    className="mt-4 w-full rounded-xl py-2 font-semibold text-white transition hover:opacity-90"
                                    style={{ backgroundColor: '#c4714a' }}
                                >
                                    Subscribe
                                </button>
                            )}
                            {isSubscribed && (
                                <span
                                    className="mt-4 block w-full rounded-xl py-2 text-center font-semibold text-white"
                                    style={{ backgroundColor: '#4a7c59' }}
                                >
                                    Subscribed
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Posts feed */}
                    <div className="mt-10 pb-16">
                        <h2
                            className="mb-4 text-xl font-bold"
                            style={{ color: '#2d2118' }}
                        >
                            Posts
                        </h2>

                        {posts.length === 0 && (
                            <p className="text-gray-400 italic">No posts yet.</p>
                        )}

                        <div className="flex flex-col gap-4">
                            {posts.map((post) => {
                                const locked = post.is_exclusive && !isSubscribed;
                                return (
                                    <div
                                        key={post.id}
                                        className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm"
                                    >
                                        {locked && (
                                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm"
                                                style={{ backgroundColor: 'rgba(250,246,240,0.7)' }}
                                            >
                                                <span className="text-3xl">🔒</span>
                                                <p
                                                    className="mt-2 text-sm font-semibold"
                                                    style={{ color: '#2d2118' }}
                                                >
                                                    Subscribe to unlock
                                                </p>
                                            </div>
                                        )}
                                        <div className={locked ? 'select-none blur-sm' : ''}>
                                            <div className="flex items-center justify-between">
                                                <h3
                                                    className="font-semibold"
                                                    style={{ color: '#2d2118' }}
                                                >
                                                    {post.title}
                                                </h3>
                                                <span className="text-xs text-gray-400">
                                                    {post.created_at}
                                                </span>
                                            </div>
                                            <p
                                                className="mt-2 text-sm leading-relaxed"
                                                style={{ color: '#2d2118' }}
                                            >
                                                {post.content}
                                            </p>
                                            {post.is_exclusive && (
                                                <span
                                                    className="mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                                                    style={{ backgroundColor: '#c4714a' }}
                                                >
                                                    Exclusive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
