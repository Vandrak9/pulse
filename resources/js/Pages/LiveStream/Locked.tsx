import { Head, Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';

interface Props {
    coach: {
        id: number;
        name: string;
        specialization: string | null;
        monthly_price: number | null;
        avatar_url: string | null;
    };
    stream: {
        title: string;
        access: string;
    };
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Locked({ coach, stream }: Props) {
    return (
        <>
            <Head title="Stream — Len pre predplatiteľov" />

            <div className="min-h-screen flex items-center justify-center px-4"
                style={{ background: '#111' }}>
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: '#fce8de' }}>
                        <Lock size={26} style={{ color: '#c4714a' }} />
                    </div>

                    <h1 className="text-xl font-bold mb-2" style={{ color: '#2d2118' }}>
                        Len pre predplatiteľov
                    </h1>
                    <p className="text-sm mb-6" style={{ color: '#9a8a7a' }}>
                        Tento live stream je dostupný iba pre predplatiteľov.
                    </p>

                    {/* Coach card */}
                    <div className="flex items-center gap-3 p-3 rounded-xl mb-6"
                        style={{ background: '#faf6f0', border: '1px solid #e8d9c4' }}>
                        {coach.avatar_url ? (
                            <img src={coach.avatar_url} alt={coach.name}
                                className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ background: '#c4714a' }}>
                                {getInitials(coach.name)}
                            </div>
                        )}
                        <div className="text-left">
                            <div className="font-semibold text-sm" style={{ color: '#2d2118' }}>{coach.name}</div>
                            {coach.specialization && (
                                <div className="text-xs" style={{ color: '#9a8a7a' }}>{coach.specialization}</div>
                            )}
                        </div>
                        {coach.monthly_price && (
                            <div className="ml-auto font-bold text-sm" style={{ color: '#c4714a' }}>
                                €{coach.monthly_price}/mes
                            </div>
                        )}
                    </div>

                    <Link
                        href={`/subscribe/${coach.id}`}
                        className="block w-full text-white font-semibold py-3 rounded-xl mb-3 transition"
                        style={{ background: '#c4714a' }}
                    >
                        Predplatiť a sledovať
                    </Link>

                    <Link
                        href={`/coaches/${coach.id}`}
                        className="block text-sm"
                        style={{ color: '#9a8a7a' }}
                    >
                        Zobraziť profil kouča
                    </Link>
                </div>
            </div>
        </>
    );
}
