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

    const inputStyle = {
        width: '100%', padding: '11px 16px', borderRadius: 12,
        border: '1px solid #e8d9c4', fontSize: 14, color: '#2d2118',
        outline: 'none', boxSizing: 'border-box' as const,
        backgroundColor: 'white',
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Head title="Vitaj späť — PULSE" />

            {/* LEFT — form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', backgroundColor: '#faf6f0' }}>
                <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#c4714a', textDecoration: 'none', marginBottom: 40, display: 'inline-block' }}>
                    PULSE
                </Link>

                <div style={{ maxWidth: 360, width: '100%' }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2d2118', marginBottom: 6, fontFamily: 'Georgia, serif' }}>
                        Vitaj späť 👋
                    </h1>
                    <p style={{ fontSize: 14, color: '#9a8a7a', marginBottom: 28 }}>Prihlás sa do svojho účtu</p>

                    {status && (
                        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, backgroundColor: '#f0fdf4', color: '#166534', fontSize: 13 }}>
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 6 }}>Email</label>
                            <input
                                type="email"
                                value={data.email}
                                autoComplete="username"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c4714a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#e8d9c4')}
                            />
                            {errors.email && <p style={{ marginTop: 4, fontSize: 12, color: '#c4714a' }}>{errors.email}</p>}
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#2d2118' }}>Heslo</label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} style={{ fontSize: 12, color: '#c4714a', textDecoration: 'none' }}>
                                        Zabudol si heslo?
                                    </Link>
                                )}
                            </div>
                            <input
                                type="password"
                                value={data.password}
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c4714a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#e8d9c4')}
                            />
                            {errors.password && <p style={{ marginTop: 4, fontSize: 12, color: '#c4714a' }}>{errors.password}</p>}
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9a8a7a', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', (e.target.checked || false) as false)}
                                style={{ accentColor: '#c4714a' }}
                            />
                            Zapamätať si ma
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                width: '100%', padding: '13px', borderRadius: 999,
                                backgroundColor: '#c4714a', color: 'white',
                                fontSize: 15, fontWeight: 700, border: 'none',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.6 : 1, marginTop: 4,
                                transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={e => !processing && (e.currentTarget.style.backgroundColor = '#5a3e2b')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#c4714a')}
                        >
                            Prihlásiť sa
                        </button>
                    </form>

                    <p style={{ marginTop: 24, fontSize: 14, color: '#9a8a7a', textAlign: 'center' }}>
                        Nemáš účet?{' '}
                        <Link href={route('register')} style={{ color: '#c4714a', fontWeight: 600, textDecoration: 'none' }}>
                            Registruj sa
                        </Link>
                    </p>
                </div>
            </div>

            {/* RIGHT — visual motivation (hidden on mobile) */}
            <div
                className="hidden md:flex"
                style={{
                    width: '50%', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', padding: 48,
                    background: 'linear-gradient(135deg, #c4714a 0%, #2d2118 100%)',
                    position: 'relative', overflow: 'hidden',
                }}
            >
                {/* Decorative blob */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div style={{ position: 'relative', maxWidth: 340, textAlign: 'center' }}>
                    <blockquote style={{
                        fontSize: 26, fontFamily: 'Georgia, serif', color: 'white',
                        lineHeight: 1.45, marginBottom: 40, fontStyle: 'italic',
                    }}>
                        "Investícia do teba je najlepšia investícia."
                    </blockquote>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48, alignItems: 'flex-start', paddingLeft: 20 }}>
                        {['120+ fitness koučov', 'Exkluzívny obsah', 'Zruš kedykoľvek'].map(b => (
                            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white', fontSize: 15 }}>
                                <span style={{ fontSize: 18 }}>✅</span>
                                {b}
                            </div>
                        ))}
                    </div>

                    {/* Overlapping coach avatars */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                        {[
                            { initial: 'T', bg: 'rgba(255,255,255,0.25)' },
                            { initial: 'L', bg: 'rgba(255,255,255,0.20)' },
                            { initial: 'M', bg: 'rgba(255,255,255,0.15)' },
                        ].map((a, i) => (
                            <div key={i} style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: a.bg, border: '2px solid rgba(255,255,255,0.4)',
                                marginLeft: i > 0 ? -14 : 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: 16,
                                backdropFilter: 'blur(4px)',
                            }}>
                                {a.initial}
                            </div>
                        ))}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Pridaj sa k 2 864 fanúšikom</p>
                </div>
            </div>
        </div>
    );
}
