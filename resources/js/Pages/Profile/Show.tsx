import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useRef, useState } from 'react';
import Avatar from '@/Components/Avatar';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProfileUser {
    id: number;
    name: string;
    email: string | null;
    role: string;
    bio: string | null;
    avatar_url: string | null;
    is_public: boolean;
    created_at: string;
    member_since: string;
    coach_id: number | null;
    specialization: string | null;
    is_verified: boolean;
}

interface FollowingUser {
    id: number;
    name: string;
    role: string;
    specialization: string | null;
    avatar_url: string | null;
    coach_id: number | null;
    monthly_price: string | null;
}

interface Subscription extends FollowingUser {
    subscribed_since: string | null;
    status: 'active' | 'cancelled';
}

interface LikedPost {
    id: number;
    title: string;
    media_type: string;
    thumbnail_url: string | null;
    is_exclusive: boolean;
    coach_name: string | null;
    coach_id: number;
    created_at: string | null;
}

interface Props {
    profileUser: ProfileUser;
    isOwn: boolean;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
    followingList: FollowingUser[];
    likedPostsCount: number;
    likedPosts: LikedPost[];
    subscriptions: Subscription[];
    subscriptionsCount: number;
    flash?: { success?: string };
}

type Tab = 'predplatne' | 'sleduje' | 'lajky' | 'nastavenia';

// ── Delete confirmation modal ──────────────────────────────────────────────────

function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
            }}
        >
            <div style={{
                background: 'white', borderRadius: 18, padding: 28, maxWidth: 380, width: '100%',
                border: '1px solid #e8d9c4', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}>
                <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#2d2118', textAlign: 'center', margin: '0 0 10px' }}>
                    Naozaj chceš zmazať účet?
                </h3>
                <p style={{ fontSize: 13, color: '#9a8a7a', textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
                    Táto akcia je nenávratná. Všetky tvoje dáta, správy a história budú trvalo vymazané.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: 999,
                            border: '1px solid #e8d9c4', background: 'none',
                            fontSize: 14, fontWeight: 600, color: '#2d2118', cursor: 'pointer',
                        }}
                    >
                        Zrušiť
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: 999,
                            border: 'none', background: '#d32f2f',
                            fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer',
                        }}
                    >
                        Zmazať účet
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfileShow({
    profileUser,
    isOwn,
    isFollowing: initFollowing,
    followersCount: initFollowersCount,
    followingCount,
    followingList,
    likedPostsCount,
    likedPosts,
    subscriptions,
    subscriptionsCount,
    flash,
}: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number; name: string } | null } };

    if (!profileUser) {
        return (
            <PulseLayout>
                <div style={{ textAlign: 'center', padding: 60, color: '#9a8a7a' }}>Načítavam...</div>
            </PulseLayout>
        );
    }

    // Default tab: own profile shows 'predplatne', others show 'sleduje'
    const [tab, setTab] = useState<Tab>(isOwn ? 'predplatne' : 'sleduje');
    const [following, setFollowing] = useState(initFollowing);
    const [followersCount, setFollowersCount] = useState(initFollowersCount);
    const [followLoading, setFollowLoading] = useState(false);
    const [followingState, setFollowingState] = useState<Record<number, boolean>>({});

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState(profileUser.bio ?? '');
    const [isPublic, setIsPublic] = useState(profileUser.is_public);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profileUser.avatar_url);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Delete modal
    const [showDelete, setShowDelete] = useState(false);

    // ── Handlers ────────────────────────────────────────────────────────────────

    async function handleFollow(e: React.MouseEvent) {
        e.preventDefault();
        if (!auth?.user || followLoading) return;
        const prev = following;
        setFollowing(!prev);
        setFollowLoading(true);
        try {
            const res = await axios.post(`/follow/${profileUser.id}`);
            setFollowing(res.data.following);
            setFollowersCount(res.data.count);
        } catch {
            setFollowing(prev);
        } finally {
            setFollowLoading(false);
        }
    }

    async function handleUnfollowCoach(userId: number) {
        if (followingState[userId] === false) return;
        setFollowingState(s => ({ ...s, [userId]: false }));
        try {
            await axios.post(`/follow/${userId}`);
        } catch {
            setFollowingState(s => ({ ...s, [userId]: true }));
        }
    }

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }

    function saveProfile() {
        setSaving(true);
        const fd = new FormData();
        fd.append('bio', bio);
        fd.append('is_public', isPublic ? '1' : '0');
        if (avatarFile) fd.append('avatar', avatarFile);
        router.post('/profile/update', fd as unknown as Parameters<typeof router.post>[1], {
            forceFormData: true,
            onFinish: () => { setSaving(false); setEditing(false); },
        });
    }

    function handleDeleteAccount() {
        router.delete('/profile');
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    const isCoachFollowed = (userId: number) =>
        followingState[userId] !== false; // default = followed

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <PulseLayout>
            <Head title={profileUser.name} />

            {showDelete && (
                <DeleteModal
                    onClose={() => setShowDelete(false)}
                    onConfirm={handleDeleteAccount}
                />
            )}

            {flash?.success && (
                <div style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 99,
                    background: '#4a7c59', color: 'white', borderRadius: 12,
                    padding: '12px 20px', fontSize: 14, fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }}>
                    ✓ {flash.success}
                </div>
            )}

            <div className="min-h-screen pb-20" style={{ background: '#faf6f0' }}>

                {/* ── Cover ── */}
                <div style={{
                    height: 160,
                    background: 'linear-gradient(135deg, #faf6f0 0%, #eedfd0 50%, #c4714a 100%)',
                    position: 'relative',
                }}>
                    <Link
                        href="/coaches"
                        style={{
                            position: 'absolute', top: 14, left: 16,
                            background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)',
                            borderRadius: 999, padding: '6px 14px', fontSize: 13,
                            color: '#2d2118', textDecoration: 'none', fontWeight: 500,
                        }}
                    >
                        ← Späť
                    </Link>

                    {/* Avatar overlapping cover */}
                    <div style={{
                        position: 'absolute', bottom: -50, left: '50%',
                        transform: 'translateX(-50%)',
                    }}>
                        <div
                            onClick={() => isOwn && fileRef.current?.click()}
                            style={{
                                width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                                border: '4px solid white', background: '#c4714a',
                                cursor: isOwn ? 'pointer' : 'default',
                                position: 'relative', flexShrink: 0,
                            }}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt={profileUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 36,
                                }}>
                                    {profileUser.name?.charAt(0).toUpperCase() ?? '?'}
                                </div>
                            )}
                            {isOwn && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'transparent', fontSize: 22, transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.35)';
                                        (e.currentTarget as HTMLDivElement).style.color = 'white';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)';
                                        (e.currentTarget as HTMLDivElement).style.color = 'transparent';
                                    }}
                                >
                                    📷
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                </div>

                <div className="mx-auto max-w-xl px-4" style={{ paddingTop: 64 }}>

                    {/* ── Name + role + badges ── */}
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                            {profileUser.name}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            <span style={{
                                padding: '3px 12px', borderRadius: 999,
                                background: profileUser.role === 'coach' ? '#fce8de' : '#e8f4ec',
                                color: profileUser.role === 'coach' ? '#c4714a' : '#4a7c59',
                                fontSize: 12, fontWeight: 600,
                            }}>
                                {profileUser.role === 'coach' ? '💪 Kouč' : '👤 Člen'}
                            </span>
                            {profileUser.specialization && (
                                <span style={{ fontSize: 12, color: '#9a8a7a' }}>{profileUser.specialization}</span>
                            )}
                            {profileUser.is_verified && (
                                <span style={{ color: '#4a7c59', fontSize: 12, fontWeight: 600 }}>✓ Overený</span>
                            )}
                        </div>
                        <p style={{ fontSize: 12, color: '#9a8a7a', marginTop: 4 }}>{profileUser.member_since}</p>
                    </div>

                    {/* ── Stats row ── */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 32,
                        marginTop: 14, paddingBottom: 16,
                        borderBottom: '1px solid #e8d9c4',
                    }}>
                        {[
                            { value: followingCount, label: 'Sleduje' },
                            { value: subscriptionsCount, label: 'Predplatné' },
                            { value: likedPostsCount, label: 'Lajky' },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#2d2118' }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Bio ── */}
                    {!editing && profileUser.bio && (
                        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b5e52', margin: '14px 0 0', lineHeight: 1.6 }}>
                            {profileUser.bio}
                        </p>
                    )}

                    {/* ── Action buttons ── */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                        {isOwn ? (
                            editing ? (
                                <>
                                    <button
                                        onClick={saveProfile}
                                        disabled={saving}
                                        style={{
                                            padding: '9px 24px', borderRadius: 999,
                                            background: '#c4714a', color: 'white',
                                            fontSize: 14, fontWeight: 600, border: 'none',
                                            cursor: 'pointer', opacity: saving ? 0.6 : 1,
                                        }}
                                    >
                                        {saving ? 'Ukladám...' : 'Uložiť'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setBio(profileUser.bio ?? '');
                                            setIsPublic(profileUser.is_public);
                                            setAvatarPreview(profileUser.avatar_url);
                                            setAvatarFile(null);
                                        }}
                                        style={{
                                            padding: '9px 24px', borderRadius: 999,
                                            border: '1px solid #e8d9c4', color: '#2d2118',
                                            fontSize: 14, fontWeight: 600, background: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        Zrušiť
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    style={{
                                        padding: '9px 24px', borderRadius: 999,
                                        border: '1px solid #c4714a', color: '#c4714a',
                                        fontSize: 14, fontWeight: 600, background: 'none', cursor: 'pointer',
                                    }}
                                >
                                    ✏️ Upraviť profil
                                </button>
                            )
                        ) : auth?.user ? (
                            <>
                                <button
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                    style={{
                                        padding: '9px 24px', borderRadius: 999,
                                        background: following ? '#4a7c59' : 'none',
                                        border: `1px solid ${following ? '#4a7c59' : '#c4714a'}`,
                                        color: following ? 'white' : '#c4714a',
                                        fontSize: 14, fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        opacity: followLoading ? 0.6 : 1,
                                    }}
                                >
                                    {following ? '✓ Sledujem' : '+ Sledovať'}
                                </button>
                                {profileUser.coach_id && (
                                    <Link
                                        href={`/coaches/${profileUser.coach_id}`}
                                        style={{
                                            padding: '9px 24px', borderRadius: 999,
                                            background: '#c4714a', color: 'white',
                                            fontSize: 14, fontWeight: 600, textDecoration: 'none',
                                        }}
                                    >
                                        Profil kouča
                                    </Link>
                                )}
                                <Link
                                    href={`/messages/${profileUser.id}`}
                                    style={{
                                        padding: '9px 20px', borderRadius: 999,
                                        border: '1px solid #e8d9c4', color: '#2d2118',
                                        fontSize: 14, fontWeight: 600, textDecoration: 'none',
                                    }}
                                >
                                    💬
                                </Link>
                            </>
                        ) : null}
                    </div>

                    {/* ── Inline edit form ── */}
                    {editing && (
                        <div style={{
                            marginTop: 20, background: 'white', borderRadius: 16,
                            padding: 20, border: '1px solid #e8d9c4',
                        }}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 6 }}>
                                    O mne
                                </label>
                                <textarea
                                    rows={3}
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    maxLength={300}
                                    placeholder="Povedz niečo o sebe..."
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: 12,
                                        border: '1px solid #e8d9c4', fontSize: 14, color: '#2d2118',
                                        resize: 'none', outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                                <div style={{ textAlign: 'right', fontSize: 11, color: '#9a8a7a', marginTop: 3 }}>
                                    {bio.length}/300
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                    onClick={() => setIsPublic(p => !p)}
                                    style={{
                                        width: 44, height: 24, borderRadius: 999,
                                        background: isPublic ? '#c4714a' : '#e8d9c4',
                                        position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                                        flexShrink: 0,
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: 3,
                                        left: isPublic ? 23 : 3,
                                        width: 18, height: 18, borderRadius: '50%',
                                        background: 'white', transition: 'left 0.2s',
                                    }} />
                                </div>
                                <span style={{ fontSize: 14, color: '#2d2118' }}>Profil je verejný</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#9a8a7a', marginTop: 8 }}>
                                Klikni na fotku vyššie pre zmenu avatara
                            </p>
                        </div>
                    )}

                    {/* ── Tabs ── */}
                    <div style={{ display: 'flex', marginTop: 24, borderBottom: '1px solid #e8d9c4', overflowX: 'auto' }}>
                        {(isOwn
                            ? [
                                ['predplatne', '📋 Predplatné'],
                                ['sleduje',    '👥 Sleduje'],
                                ['lajky',      '❤️ Páčilo sa mi'],
                                ['nastavenia', '⚙️ Nastavenia'],
                              ] as const
                            : [
                                ['sleduje', '👥 Sleduje'],
                              ] as const
                        ).map(([t, label]) => (
                            <button
                                key={t}
                                onClick={() => setTab(t as Tab)}
                                style={{
                                    flex: '0 0 auto', padding: '10px 18px', fontSize: 13, fontWeight: 600,
                                    background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                                    color: tab === t ? '#c4714a' : '#9a8a7a',
                                    borderBottom: tab === t ? '2px solid #c4714a' : '2px solid transparent',
                                    transition: 'color 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab content ── */}
                    <div style={{ marginTop: 20, paddingBottom: 40 }}>

                        {/* ── PREDPLATNÉ tab ── */}
                        {tab === 'predplatne' && isOwn && (
                            subscriptions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <div style={{ fontSize: 56, marginBottom: 14 }}>💳</div>
                                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#2d2118', margin: '0 0 8px' }}>
                                        Zatiaľ žiadne predplatné
                                    </h3>
                                    <p style={{ fontSize: 14, color: '#9a8a7a', margin: '0 0 20px', maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
                                        Objavte koučov a predplaťte si exkluzívny obsah
                                    </p>
                                    <Link
                                        href="/coaches"
                                        style={{
                                            display: 'inline-block', padding: '11px 28px', borderRadius: 999,
                                            background: '#c4714a', color: 'white',
                                            fontSize: 14, fontWeight: 600, textDecoration: 'none',
                                        }}
                                    >
                                        Objaviť koučov →
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {subscriptions.map((sub, i) => (
                                        <div
                                            key={sub.coach_id ?? i}
                                            style={{
                                                background: 'white', borderRadius: 16, padding: '14px 16px',
                                                border: '1px solid #e8d9c4',
                                                display: 'flex', alignItems: 'center', gap: 14,
                                            }}
                                        >
                                            <Avatar src={sub.avatar_url} name={sub.name} size={48} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2118' }}>{sub.name}</div>
                                                {sub.specialization && (
                                                    <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 2 }}>{sub.specialization}</div>
                                                )}
                                                {sub.subscribed_since && (
                                                    <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 3 }}>
                                                        Predplatiteľ od {new Date(sub.subscribed_since).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                                {sub.monthly_price && (
                                                    <span style={{
                                                        padding: '3px 10px', borderRadius: 999,
                                                        background: '#fce8de', color: '#c4714a',
                                                        fontSize: 12, fontWeight: 700,
                                                    }}>
                                                        €{Number(sub.monthly_price).toFixed(2)}/mes
                                                    </span>
                                                )}
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 999,
                                                    background: sub.status === 'active' ? '#e8f4ec' : '#fdecea',
                                                    color: sub.status === 'active' ? '#4a7c59' : '#d32f2f',
                                                    fontSize: 11, fontWeight: 600,
                                                }}>
                                                    {sub.status === 'active' ? '● Aktívne' : '● Zrušené'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                                {sub.coach_id && (
                                                    <Link
                                                        href={`/coaches/${sub.coach_id}`}
                                                        style={{
                                                            fontSize: 12, color: '#c4714a', fontWeight: 600,
                                                            textDecoration: 'none', whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        Profil →
                                                    </Link>
                                                )}
                                                <button
                                                    style={{
                                                        fontSize: 11, color: '#9a8a7a', background: 'none',
                                                        border: '1px solid #e8d9c4', borderRadius: 6,
                                                        padding: '3px 8px', cursor: 'pointer',
                                                    }}
                                                    onMouseEnter={e => { (e.currentTarget.style.color = '#d32f2f'); (e.currentTarget.style.borderColor = '#d32f2f'); }}
                                                    onMouseLeave={e => { (e.currentTarget.style.color = '#9a8a7a'); (e.currentTarget.style.borderColor = '#e8d9c4'); }}
                                                >
                                                    Zrušiť
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ── SLEDUJE tab ── */}
                        {tab === 'sleduje' && (
                            followingList.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a8a7a' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                                    <p style={{ fontSize: 14, margin: '0 0 16px' }}>
                                        {isOwn ? 'Zatiaľ nesleduješ žiadnych koučov.' : `${profileUser.name} ešte nikoho nenasleduje.`}
                                    </p>
                                    {isOwn && (
                                        <Link href="/coaches" style={{ color: '#c4714a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                                            Nájdi koučov →
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {followingList.map(u => (
                                        <div
                                            key={u.id}
                                            style={{
                                                background: 'white', borderRadius: 16, padding: '16px 12px',
                                                border: '1px solid #e8d9c4', textAlign: 'center',
                                                opacity: isCoachFollowed(u.id) ? 1 : 0.5,
                                                transition: 'opacity 0.2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                                                <Avatar src={u.avatar_url} name={u.name} size={56} />
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 3 }}>
                                                {u.name}
                                            </div>
                                            {u.specialization && (
                                                <div style={{ fontSize: 11, color: '#9a8a7a', marginBottom: 10 }}>{u.specialization}</div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {u.coach_id && (
                                                    <Link
                                                        href={`/coaches/${u.coach_id}`}
                                                        style={{
                                                            fontSize: 12, color: '#c4714a', fontWeight: 600,
                                                            textDecoration: 'none',
                                                        }}
                                                    >
                                                        Zobraziť →
                                                    </Link>
                                                )}
                                                {isOwn && (
                                                    <button
                                                        onClick={() => handleUnfollowCoach(u.id)}
                                                        disabled={!isCoachFollowed(u.id)}
                                                        style={{
                                                            fontSize: 11, borderRadius: 999,
                                                            padding: '4px 10px', cursor: 'pointer',
                                                            background: isCoachFollowed(u.id) ? '#4a7c59' : '#e8d9c4',
                                                            color: 'white', border: 'none',
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {isCoachFollowed(u.id) ? 'Sledujem ✓' : 'Odsledovaný'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ── LAJKY tab (own only) ── */}
                        {tab === 'lajky' && isOwn && (
                            likedPosts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a8a7a' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
                                    <p style={{ fontSize: 14 }}>Zatiaľ žiadne lajknuté príspevky.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {likedPosts.map(post => (
                                        <Link
                                            key={post.id}
                                            href={post.coach_id ? `/coaches/${post.coach_id}` : '#'}
                                            style={{ textDecoration: 'none', display: 'block' }}
                                        >
                                            <div style={{
                                                background: 'white', borderRadius: 14,
                                                border: '1px solid #e8d9c4', overflow: 'hidden',
                                                transition: 'box-shadow 0.15s',
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                            >
                                                {/* Thumbnail */}
                                                <div style={{
                                                    aspectRatio: '4/3', background: '#f0e8df',
                                                    position: 'relative', overflow: 'hidden',
                                                }}>
                                                    {post.thumbnail_url ? (
                                                        <img
                                                            src={post.thumbnail_url}
                                                            alt={post.title}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            width: '100%', height: '100%',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 28, color: '#c4714a',
                                                        }}>
                                                            {post.media_type === 'video' ? '🎬' : post.media_type === 'image' ? '📸' : '📝'}
                                                        </div>
                                                    )}
                                                    {post.is_exclusive && (
                                                        <div style={{
                                                            position: 'absolute', top: 6, right: 6,
                                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                                            borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 600,
                                                        }}>
                                                            🔒
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div style={{ padding: '8px 10px' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#2d2118', marginBottom: 2 }}
                                                        className="line-clamp-1"
                                                    >
                                                        {post.title || '—'}
                                                    </div>
                                                    {post.coach_name && (
                                                        <div style={{ fontSize: 11, color: '#9a8a7a' }}>{post.coach_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ── NASTAVENIA tab (own only) ── */}
                        {tab === 'nastavenia' && isOwn && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Account info */}
                                <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e8d9c4' }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', margin: '0 0 14px' }}>
                                        Účet
                                    </h3>
                                    <div style={{ fontSize: 13, color: '#9a8a7a', marginBottom: 4 }}>Email</div>
                                    <div style={{ fontSize: 14, color: '#2d2118', fontWeight: 500, marginBottom: 16 }}>
                                        {profileUser.email}
                                    </div>
                                    <Link
                                        href="/password/change"
                                        style={{
                                            display: 'inline-block', fontSize: 13, fontWeight: 600,
                                            color: '#c4714a', textDecoration: 'none',
                                            padding: '8px 18px', borderRadius: 999,
                                            border: '1px solid #c4714a',
                                        }}
                                    >
                                        🔑 Zmeniť heslo
                                    </Link>
                                </div>

                                {/* Coach settings (only for coaches) */}
                                {profileUser.role === 'coach' && (
                                    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e8d9c4' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', margin: '0 0 14px' }}>
                                            Nastavenia kouča
                                        </h3>
                                        <Link
                                            href="/dashboard/profile"
                                            style={{
                                                display: 'inline-block', fontSize: 13, fontWeight: 600,
                                                color: '#c4714a', textDecoration: 'none',
                                                padding: '8px 18px', borderRadius: 999,
                                                border: '1px solid #c4714a',
                                            }}
                                        >
                                            ⚙️ Upraviť profil kouča
                                        </Link>
                                    </div>
                                )}

                                {/* Danger zone */}
                                <div style={{
                                    background: '#fff5f5', borderRadius: 16, padding: 20,
                                    border: '1px solid #fecaca',
                                }}>
                                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d32f2f', margin: '0 0 8px' }}>
                                        Nebezpečná zóna
                                    </h3>
                                    <p style={{ fontSize: 13, color: '#9a8a7a', margin: '0 0 16px' }}>
                                        Zmazanie účtu je nenávratné. Všetky dáta budú trvalo odstránené.
                                    </p>
                                    <button
                                        onClick={() => setShowDelete(true)}
                                        style={{
                                            padding: '9px 20px', borderRadius: 999,
                                            background: 'none', border: '1.5px solid #d32f2f',
                                            color: '#d32f2f', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget.style.background = '#d32f2f'); (e.currentTarget.style.color = 'white'); }}
                                        onMouseLeave={e => { (e.currentTarget.style.background = 'none'); (e.currentTarget.style.color = '#d32f2f'); }}
                                    >
                                        🗑️ Zmazať účet
                                    </button>
                                </div>

                            </div>
                        )}

                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}
