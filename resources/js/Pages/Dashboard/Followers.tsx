import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';

interface Follower {
    id: number;
    name: string;
    avatar: string | null;
    followed_at: string;
}

interface Props {
    coach: { name: string; avatar_url: string | null };
    followers: Follower[];
    total: number;
}

export default function Followers({ followers, total }: Props) {
    return (
        <PulseLayout>
            <Head title="Sledovatelia — Dashboard" />
            <div style={{ background: '#faf6f0', minHeight: '100vh', paddingBottom: 80 }}>
                <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <Link href="/dashboard" style={{ color: '#c4714a', fontSize: 20, textDecoration: 'none' }}>←</Link>
                        <div>
                            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                👥 Sledovatelia
                            </h1>
                            <p style={{ fontSize: 13, color: '#9a8a7a', margin: '2px 0 0' }}>
                                {total} {total === 1 ? 'sledovateľ' : total >= 2 && total <= 4 ? 'sledovatelia' : 'sledovateľov'} celkom
                            </p>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', overflow: 'hidden' }}>
                        {followers.length === 0 ? (
                            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                                <p style={{ fontSize: 15, color: '#9a8a7a', marginBottom: 8 }}>Zatiaľ žiadni sledovatelia</p>
                                <p style={{ fontSize: 13, color: '#b0a090' }}>Keď ťa niekto začne sledovať, objaví sa tu.</p>
                            </div>
                        ) : (
                            followers.map((f, i) => (
                                <div
                                    key={f.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '14px 20px',
                                        borderTop: i > 0 ? '1px solid #f0e8df' : 'none',
                                        transition: 'background 0.12s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                        overflow: 'hidden', border: '2px solid #e8d9c4',
                                        background: '#c4714a', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 16,
                                    }}>
                                        {f.avatar ? (
                                            <img src={f.avatar} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : f.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Name + time */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2118' }}>{f.name}</div>
                                        <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 2 }}>Sleduje od: {f.followed_at}</div>
                                    </div>

                                    {/* Profile link */}
                                    <Link
                                        href={`/profile/${f.id}`}
                                        style={{
                                            padding: '6px 14px', borderRadius: 999, flexShrink: 0,
                                            border: '1px solid #e8d9c4', color: '#2d2118',
                                            fontSize: 12, fontWeight: 600, textDecoration: 'none',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c4714a'; e.currentTarget.style.color = '#c4714a'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8d9c4'; e.currentTarget.style.color = '#2d2118'; }}
                                    >
                                        Profil →
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}
