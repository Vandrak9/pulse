import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    const inputClass = 'w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition focus:ring-2';
    const inputStyle = { borderColor: '#e8d9c4', color: '#2d2118', '--tw-ring-color': '#c4714a' } as React.CSSProperties;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ backgroundColor: '#faf6f0' }}>
            <Head title="Vitaj späť — PULSE" />

            <Link href="/" className="mb-8 font-serif text-3xl font-bold tracking-tight" style={{ color: '#c4714a' }}>
                PULSE
            </Link>

            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm" style={{ border: '1px solid #e8d9c4' }}>
                <h1 className="mb-6 font-serif text-2xl font-bold" style={{ color: '#2d2118' }}>
                    Vitaj späť
                </h1>

                {status && (
                    <div className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#2d2118' }}>Email</label>
                        <input
                            type="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                        />
                        {errors.email && <p className="mt-1 text-xs" style={{ color: '#c4714a' }}>{errors.email}</p>}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: '#2d2118' }}>Heslo</label>
                        <input
                            type="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            className={inputClass}
                            style={inputStyle}
                        />
                        {errors.password && <p className="mt-1 text-xs" style={{ color: '#c4714a' }}>{errors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: '#9a8a7a' }}>
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', (e.target.checked || false) as false)}
                                className="rounded"
                            />
                            Zapamätať si ma
                        </label>
                        {canResetPassword && (
                            <Link href={route('password.request')} className="text-xs hover:underline" style={{ color: '#c4714a' }}>
                                Zabudol si heslo?
                            </Link>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-full py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#c4714a' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#c4714a')}
                    >
                        Prihlásiť sa
                    </button>
                </form>
            </div>

            <p className="mt-6 text-sm" style={{ color: '#9a8a7a' }}>
                Nemáš účet?{' '}
                <Link href={route('register')} className="font-medium hover:underline" style={{ color: '#c4714a' }}>
                    Registrovať sa
                </Link>
            </p>
        </div>
    );
}
