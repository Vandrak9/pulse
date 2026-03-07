import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'fan' as 'fan' | 'coach',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const inputClass = 'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2';
    const inputStyle = { borderColor: '#e8d9c4', color: '#2d2118', '--tw-ring-color': '#c4714a' } as React.CSSProperties;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: '#faf6f0' }}>
            <Head title="Registrácia — PULSE" />

            <Link href="/" className="mb-8 font-serif text-3xl font-bold tracking-tight" style={{ color: '#c4714a' }}>
                PULSE
            </Link>

            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm" style={{ border: '1px solid #e8d9c4' }}>
                <h1 className="mb-6 font-serif text-2xl font-bold" style={{ color: '#2d2118' }}>
                    Pridaj sa k PULSE
                </h1>

                {/* Role selector */}
                <div className="mb-6 grid grid-cols-2 gap-2">
                    {([
                        { value: 'fan', label: 'Som fanúšik', icon: '👤' },
                        { value: 'coach', label: 'Som kouč', icon: '💪' },
                    ] as const).map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setData('role', opt.value)}
                            className="flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition-all"
                            style={
                                data.role === opt.value
                                    ? { backgroundColor: '#fce8de', borderColor: '#c4714a', color: '#c4714a' }
                                    : { backgroundColor: '#fff', borderColor: '#e8d9c4', color: '#9a8a7a' }
                            }
                        >
                            <span className="text-xl">{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#2d2118' }}>Meno</label>
                        <input
                            type="text"
                            value={data.name}
                            autoComplete="name"
                            autoFocus
                            onChange={(e) => setData('name', e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                            required
                        />
                        {errors.name && <p className="mt-1 text-xs" style={{ color: '#c4714a' }}>{errors.name}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#2d2118' }}>Email</label>
                        <input
                            type="email"
                            value={data.email}
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                            required
                        />
                        {errors.email && <p className="mt-1 text-xs" style={{ color: '#c4714a' }}>{errors.email}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#2d2118' }}>Heslo</label>
                        <input
                            type="password"
                            value={data.password}
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                            required
                        />
                        {errors.password && <p className="mt-1 text-xs" style={{ color: '#c4714a' }}>{errors.password}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#2d2118' }}>Potvrdiť heslo</label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                            required
                        />
                        {errors.password_confirmation && <p className="mt-1 text-xs" style={{ color: '#c4714a' }}>{errors.password_confirmation}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-full py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#c4714a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c4714a')}
                    >
                        Registrovať sa
                    </button>
                </form>
            </div>

            <p className="mt-6 text-sm" style={{ color: '#9a8a7a' }}>
                Už máš účet?{' '}
                <Link href={route('login')} className="font-medium hover:underline" style={{ color: '#c4714a' }}>
                    Prihlásiť sa
                </Link>
            </p>
        </div>
    );
}
