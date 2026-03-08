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

    const inputStyle = {
        width: '100%', padding: '11px 16px', borderRadius: 12,
        border: '1px solid #e8d9c4', fontSize: 14, color: '#2d2118',
        outline: 'none', boxSizing: 'border-box' as const,
        backgroundColor: 'white',
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Head title="Registrácia — PULSE" />

            {/* LEFT — form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px', backgroundColor: '#faf6f0', overflowY: 'auto' }}>
                <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#c4714a', textDecoration: 'none', marginBottom: 32, display: 'inline-block' }}>
                    PULSE
                </Link>

                <div style={{ maxWidth: 360, width: '100%' }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#2d2118', marginBottom: 6, fontFamily: 'Georgia, serif' }}>
                        Pridaj sa k PULSE
                    </h1>
                    <p style={{ fontSize: 14, color: '#9a8a7a', marginBottom: 24 }}>Vytvor si účet zadarmo</p>

                    {/* Role selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                        {([
                            { value: 'fan', label: 'Som fanúšik', icon: '👤' },
                            { value: 'coach', label: 'Som kouč', icon: '💪' },
                        ] as const).map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setData('role', opt.value)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    gap: 4, padding: '12px 8px', borderRadius: 12,
                                    border: `1px solid ${data.role === opt.value ? '#c4714a' : '#e8d9c4'}`,
                                    backgroundColor: data.role === opt.value ? '#fce8de' : 'white',
                                    color: data.role === opt.value ? '#c4714a' : '#9a8a7a',
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 6 }}>Meno</label>
                            <input
                                type="text"
                                value={data.name}
                                autoComplete="name"
                                autoFocus
                                onChange={(e) => setData('name', e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c4714a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#e8d9c4')}
                                required
                            />
                            {errors.name && <p style={{ marginTop: 4, fontSize: 12, color: '#c4714a' }}>{errors.name}</p>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 6 }}>Email</label>
                            <input
                                type="email"
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c4714a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#e8d9c4')}
                                required
                            />
                            {errors.email && <p style={{ marginTop: 4, fontSize: 12, color: '#c4714a' }}>{errors.email}</p>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 6 }}>Heslo</label>
                            <input
                                type="password"
                                value={data.password}
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c4714a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#e8d9c4')}
                                required
                            />
                            {errors.password && <p style={{ marginTop: 4, fontSize: 12, color: '#c4714a' }}>{errors.password}</p>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 6 }}>Potvrdiť heslo</label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                style={inputStyle}
                                onFocus={e => (e.currentTarget.style.borderColor = '#c4714a')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#e8d9c4')}
                                required
                            />
                            {errors.password_confirmation && <p style={{ marginTop: 4, fontSize: 12, color: '#c4714a' }}>{errors.password_confirmation}</p>}
                        </div>

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
                            Registrovať sa
                        </button>
                    </form>

                    <p style={{ marginTop: 20, fontSize: 14, color: '#9a8a7a', textAlign: 'center' }}>
                        Už máš účet?{' '}
                        <Link href={route('login')} style={{ color: '#c4714a', fontWeight: 600, textDecoration: 'none' }}>
                            Prihlásiť sa
                        </Link>
                    </p>
                </div>
            </div>

            {/* RIGHT — visual (hidden on mobile) */}
            <div
                className="hidden md:flex"
                style={{
                    width: '50%', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', padding: 48,
                    background: 'linear-gradient(135deg, #c4714a 0%, #2d2118 100%)',
                    position: 'relative', overflow: 'hidden',
                }}
            >
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
