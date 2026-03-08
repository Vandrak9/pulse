import PulseLayout from '@/Layouts/PulseLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';

interface CoachData {
    id: number;
    bio: string | null;
    specialization: string | null;
    monthly_price: string;
    messages_access: 'everyone' | 'followers' | 'subscribers' | 'nobody';
    avatar_url: string | null;
}

interface Props {
    coach: CoachData | null;
    flash?: { success?: string };
}

export default function CoachEdit({ coach, flash }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        bio: coach?.bio ?? '',
        specialization: coach?.specialization ?? '',
        monthly_price: coach?.monthly_price ?? '0',
        messages_access: (coach?.messages_access ?? 'everyone') as 'everyone' | 'followers' | 'subscribers' | 'nobody',
        avatar: null as File | null,
        _method: 'PUT',
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        coach?.avatar_url ?? null,
    );
    const fileRef = useRef<HTMLInputElement>(null);

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);
        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/dashboard/profile', {
            forceFormData: true,
        });
    }

    const inputClass =
        'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2';
    const inputStyle = { borderColor: '#e0d5ca', color: '#2d2118' };
    const focusStyle = { '--tw-ring-color': '#c4714a' } as React.CSSProperties;

    return (
        <PulseLayout>
            <Head title="Upraviť profil" />

            <div className="py-10" style={{ backgroundColor: '#faf6f0', minHeight: '80vh' }}>
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <h1
                        className="mb-6 text-2xl font-bold"
                        style={{ color: '#2d2118', fontFamily: 'Georgia, serif' }}
                    >
                        Upraviť profil kouča
                    </h1>

                    {flash?.success && (
                        <div
                            className="mb-6 rounded-xl px-4 py-3 text-sm font-medium text-white"
                            style={{ backgroundColor: '#4a7c59' }}
                        >
                            {flash.success}
                        </div>
                    )}

                    <form
                        onSubmit={submit}
                        encType="multipart/form-data"
                        className="rounded-2xl bg-white p-8 shadow-sm"
                        style={{ border: '1px solid #e8d9c4' }}
                    >
                        {/* Avatar upload */}
                        <div className="mb-6 flex flex-col items-center gap-4">
                            <div
                                className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full text-3xl font-bold text-white"
                                style={{ backgroundColor: '#c4714a' }}
                                onClick={() => fileRef.current?.click()}
                            >
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Náhľad fotky"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    '+'
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="text-sm font-medium hover:underline"
                                style={{ color: '#c4714a' }}
                            >
                                {avatarPreview ? 'Zmeniť fotku' : 'Nahrať fotku'}
                            </button>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            {errors.avatar && (
                                <p className="text-xs text-red-500">{errors.avatar}</p>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="mb-5">
                            <label
                                className="mb-1.5 block text-sm font-medium"
                                style={{ color: '#2d2118' }}
                            >
                                O mne
                            </label>
                            <textarea
                                rows={4}
                                value={data.bio}
                                onChange={(e) => setData('bio', e.target.value)}
                                placeholder="Povedz niečo o sebe svojmu publiku..."
                                className={inputClass + ' resize-none'}
                                style={{ ...inputStyle, ...focusStyle }}
                            />
                            {errors.bio && (
                                <p className="mt-1 text-xs text-red-500">{errors.bio}</p>
                            )}
                        </div>

                        {/* Specialization */}
                        <div className="mb-5">
                            <label
                                className="mb-1.5 block text-sm font-medium"
                                style={{ color: '#2d2118' }}
                            >
                                Špecializácia
                            </label>
                            <input
                                type="text"
                                value={data.specialization}
                                onChange={(e) => setData('specialization', e.target.value)}
                                placeholder="napr. Silový tréning, Joga, HIIT..."
                                className={inputClass}
                                style={{ ...inputStyle, ...focusStyle }}
                            />
                            {errors.specialization && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.specialization}
                                </p>
                            )}
                        </div>

                        {/* Monthly price */}
                        <div className="mb-8">
                            <label
                                className="mb-1.5 block text-sm font-medium"
                                style={{ color: '#2d2118' }}
                            >
                                Mesačná cena predplatného (€)
                            </label>
                            <div className="relative">
                                <span
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                                    style={{ color: '#c4714a' }}
                                >
                                    €
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.monthly_price}
                                    onChange={(e) =>
                                        setData('monthly_price', e.target.value)
                                    }
                                    className={inputClass + ' pl-7'}
                                    style={{ ...inputStyle, ...focusStyle }}
                                />
                            </div>
                            {errors.monthly_price && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.monthly_price}
                                </p>
                            )}
                        </div>

                        {/* Messages access */}
                        <div className="mt-6 border-t pt-6 mb-8" style={{ borderColor: '#e8d9c4' }}>
                            <h3 className="mb-1 text-lg font-bold" style={{ color: '#2d2118', fontFamily: 'Georgia, serif' }}>
                                Súkromie správ
                            </h3>
                            <p className="mb-4 text-sm" style={{ color: '#9a8a7a' }}>
                                Kto ti môže posielať správy
                            </p>
                            <div className="space-y-3">
                                {([
                                    { value: 'everyone',    icon: '🌍', title: 'Všetci sledovatelia', desc: 'Ktokoľvek kto ťa sleduje' },
                                    { value: 'subscribers', icon: '💳', title: 'Len predplatitelia',   desc: 'Len platení predplatitelia' },
                                    { value: 'nobody',      icon: '🔒', title: 'Nikto',               desc: 'Správy sú vypnuté' },
                                ] as const).map(opt => (
                                    <label
                                        key={opt.value}
                                        onClick={() => setData('messages_access', opt.value)}
                                        className="flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all"
                                        style={{
                                            borderColor: data.messages_access === opt.value ? '#c4714a' : '#e8d9c4',
                                            background: data.messages_access === opt.value ? '#fce8de' : 'white',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="messages_access"
                                            value={opt.value}
                                            checked={data.messages_access === opt.value}
                                            onChange={() => setData('messages_access', opt.value)}
                                            className="hidden"
                                        />
                                        <span className="text-xl">{opt.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold" style={{ color: '#2d2118', margin: 0 }}>{opt.title}</p>
                                            <p className="text-xs" style={{ color: '#9a8a7a', margin: '2px 0 0' }}>{opt.desc}</p>
                                        </div>
                                        {data.messages_access === opt.value && (
                                            <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full" style={{ background: '#c4714a' }}>
                                                <span className="text-xs text-white">✓</span>
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#c4714a' }}
                        >
                            {processing ? 'Ukladám...' : 'Uložiť profil'}
                        </button>
                    </form>
                </div>
            </div>
        </PulseLayout>
    );
}
