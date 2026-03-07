import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useRef, useState } from 'react';

interface CoachData {
    id: number;
    bio: string | null;
    specialization: string | null;
    monthly_price: string;
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
        <AuthenticatedLayout
            header={
                <h2
                    className="text-xl font-semibold leading-tight"
                    style={{ color: '#2d2118' }}
                >
                    Edit Coach Profile
                </h2>
            }
        >
            <Head title="Edit Profile" />

            <div className="py-10" style={{ backgroundColor: '#faf6f0', minHeight: '80vh' }}>
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
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
                                        alt="Avatar preview"
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
                                {avatarPreview ? 'Change photo' : 'Upload photo'}
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
                                Bio
                            </label>
                            <textarea
                                rows={4}
                                value={data.bio}
                                onChange={(e) => setData('bio', e.target.value)}
                                placeholder="Tell your audience about yourself..."
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
                                Specialization
                            </label>
                            <input
                                type="text"
                                value={data.specialization}
                                onChange={(e) => setData('specialization', e.target.value)}
                                placeholder="e.g. Strength & Conditioning, Yoga, HIIT..."
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
                                Monthly subscription price (€)
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

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#c4714a' }}
                        >
                            {processing ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
