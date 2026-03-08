import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Coach {
    id: number;
    name: string;
    specialization: string | null;
    monthly_price: string;
    avatar_url: string | null;
}

interface Props {
    coach: Coach | null;
}

export default function SubscriptionSuccess({ coach }: Props) {
    const [confetti, setConfetti] = useState<{ x: number; y: number; color: string; delay: number }[]>([]);

    useEffect(() => {
        const colors = ['#c4714a', '#4a7c59', '#f5a623', '#5a3e2b', '#fce8de'];
        const items = Array.from({ length: 40 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 60 - 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 1.5,
        }));
        setConfetti(items);
    }, []);

    const price = coach ? parseFloat(coach.monthly_price) : 0;

    return (
        <PulseLayout>
            <Head title="Predplatné aktivované" />

            <div
                className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-16"
                style={{ backgroundColor: '#faf6f0' }}
            >
                {/* CSS confetti */}
                <style>{`
                    @keyframes confetti-fall {
                        0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                    }
                    .confetti-piece {
                        position: fixed;
                        top: 0;
                        width: 10px;
                        height: 10px;
                        border-radius: 2px;
                        animation: confetti-fall 2.5s ease-in forwards;
                        pointer-events: none;
                        z-index: 0;
                    }
                `}</style>
                {confetti.map((c, i) => (
                    <div
                        key={i}
                        className="confetti-piece"
                        style={{
                            left: `${c.x}%`,
                            top: `${c.y}%`,
                            backgroundColor: c.color,
                            animationDelay: `${c.delay}s`,
                        }}
                    />
                ))}

                <div className="relative z-10 mx-auto max-w-md w-full text-center">
                    {/* Success card */}
                    <div className="rounded-3xl bg-white p-10 shadow-xl" style={{ border: '2px solid #4a7c59' }}>
                        {/* Big checkmark */}
                        <div
                            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white"
                            style={{ backgroundColor: '#4a7c59' }}
                        >
                            ✓
                        </div>

                        <h1 className="font-serif text-3xl font-bold" style={{ color: '#2d2118' }}>
                            Vitaj v klube!
                        </h1>

                        {coach ? (
                            <>
                                <p className="mt-3 text-base" style={{ color: '#9a8a7a' }}>
                                    Tvoje predplatné u kouča
                                </p>

                                {/* Coach card */}
                                <div
                                    className="mt-6 flex items-center gap-4 rounded-2xl p-4"
                                    style={{ backgroundColor: '#faf6f0', border: '1px solid #e8d9c4' }}
                                >
                                    <div
                                        className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full"
                                        style={{ backgroundColor: '#c4714a' }}
                                    >
                                        {coach.avatar_url ? (
                                            <img src={coach.avatar_url} alt={coach.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                                                {coach.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold" style={{ color: '#2d2118' }}>{coach.name}</p>
                                        {coach.specialization && (
                                            <p className="text-sm" style={{ color: '#9a8a7a' }}>{coach.specialization}</p>
                                        )}
                                        <p className="mt-0.5 text-sm font-semibold" style={{ color: '#c4714a' }}>
                                            €{price.toFixed(2)} / mesiac
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-4 text-sm" style={{ color: '#9a8a7a' }}>
                                    je teraz <span className="font-semibold" style={{ color: '#4a7c59' }}>aktívne</span>. Máš prístup ku všetkému exkluzívnemu obsahu.
                                </p>
                            </>
                        ) : (
                            <p className="mt-3 text-base" style={{ color: '#9a8a7a' }}>
                                Tvoje predplatné je aktívne. Máš prístup ku všetkému exkluzívnemu obsahu.
                            </p>
                        )}

                        {/* Actions */}
                        <div className="mt-8 flex flex-col gap-3">
                            {coach && (
                                <Link
                                    href={`/coaches/${coach.id}`}
                                    className="w-full rounded-full py-3 text-sm font-semibold text-white transition"
                                    style={{ backgroundColor: '#c4714a', display: 'block' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c4714a')}
                                >
                                    Pozrieť obsah kouča →
                                </Link>
                            )}
                            <Link
                                href="/feed"
                                className="w-full rounded-full border py-3 text-sm font-semibold transition"
                                style={{ borderColor: '#c4714a', color: '#c4714a', display: 'block' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fce8de')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                Späť na feed
                            </Link>
                        </div>
                    </div>

                    <p className="mt-6 text-xs" style={{ color: '#9a8a7a' }}>
                        Predplatné môžeš zrušiť kedykoľvek na stránke kouča alebo vo svojom profile.
                    </p>
                </div>
            </div>
        </PulseLayout>
    );
}
