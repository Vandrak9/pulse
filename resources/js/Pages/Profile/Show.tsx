import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface ProfileUser {
    id: number;
    name: string;
    role: string;
    bio: string | null;
    avatar_url: string | null;
    is_public: boolean;
    created_at: string;
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
}

interface Props {
    profileUser: ProfileUser;
    isOwn: boolean;
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
    followingList: FollowingUser[];
    flash?: { success?: string };
}

type Tab = 'sleduje' | 'aktivita' | 'predplatne';

function Avatar({ url, name, size }: { url: string | null; name: string; size: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', overflow: 'hidden',
            background: '#c4714a', flexShrink: 0,
        }}>
            {url ? (
                <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: size * 0.35,
                }}>
                    {name.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    );
}

export default function ProfileShow({
    profileUser, isOwn, isFollowing: initFollowing,
    followersCount: initFollowersCount, followingCount, followingList, flash,
}: Props) {
    const page = usePage();
    const { auth } = page.props as { auth: { user: { id: number; name: string } | null } };

    const [tab, setTab] = useState<Tab>('sleduje');
    const [following, setFollowing] = useState(initFollowing);
    const [followersCount, setFollowersCount] = useState(initFollowersCount);
    const [followLoading, setFollowLoading] = useState(false);

    // Edit mode state
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState(profileUser.bio ?? '');
    const [isPublic, setIsPublic] = useState(profileUser.is_public);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profileUser.avatar_url);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    function handleFollow() {
        if (!auth?.user || followLoading) return;
        setFollowLoading(true);
        fetch(`/follow/${profileUser.id}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        })
            .then(r => r.json())
            .then(d => {
                setFollowing(d.following);
                setFollowersCount(d.count);
            })
            .finally(() => setFollowLoading(false));
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

    const memberYear = new Date(profileUser.created_at).getFullYear();

    return (
        <PulseLayout>
            <Head title={profileUser.name} />

            {flash?.success && (
                <div style={{
                    position: 'fixed', top: 16, right: 16, zIndex: 100,
                    background: '#4a7c59', color: 'white', borderRadius: 12,
                    padding: '12px 20px', fontSize: 14, fontWeight: 600,
                }}>
                    {flash.success}
                </div>
            )}

            <div className="min-h-screen pb-20" style={{ backgroundColor: '#faf6f0' }}>

                {/* Cover gradient */}
                <div style={{
                    height: 160,
                    background: 'linear-gradient(135deg, #faf6f0 0%, #eedfd0 50%, #c4714a 100%)',
                    position: 'relative',
                }}>
                    {/* Back button */}
                    <Link
                        href="/coaches"
                        style={{
                            position: 'absolute', top: 14, left: 16,
                            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)',
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
                            onClick={() => isOwn && editing && fileRef.current?.click()}
                            style={{
                                width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                                border: '4px solid white', background: '#c4714a',
                                cursor: isOwn && editing ? 'pointer' : 'default',
                                position: 'relative',
                            }}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt={profileUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 36,
                                }}>
                                    {profileUser.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {isOwn && editing && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: 22,
                                }}>
                                    📷
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                </div>

                <div className="mx-auto max-w-xl px-4" style={{ paddingTop: 64 }}>

                    {/* Name + role + verified */}
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                            {profileUser.name}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                            <span style={{
                                padding: '3px 12px', borderRadius: 999,
                                background: '#fce8de', color: '#c4714a', fontSize: 12, fontWeight: 600,
                            }}>
                                {profileUser.role === 'coach' ? '💪 Kouč' : '👤 Člen'}
                            </span>
                            {profileUser.specialization && (
                                <span style={{ fontSize: 12, color: '#9a8a7a' }}>{profileUser.specialization}</span>
                            )}
                            {profileUser.is_verified && (
                                <span style={{ color: '#4a7c59', fontSize: 13, fontWeight: 600 }}>✓ Overený</span>
                            )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 32,
                        marginTop: 16, paddingBottom: 16,
                        borderBottom: '1px solid #e8d9c4',
                    }}>
                        {[
                            { value: followingCount, label: 'Sleduje' },
                            { value: followersCount, label: 'Sledovatelia' },
                            { value: memberYear, label: 'Člen od' },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#2d2118' }}>
                                    {s.value}
                                </div>
                                <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Bio */}
                    {!editing && profileUser.bio && (
                        <p style={{ textAlign: 'center', fontSize: 14, color: '#6b5e52', margin: '14px 0', lineHeight: '1.6' }}>
                            {profileUser.bio}
                        </p>
                    )}

                    {/* Action buttons */}
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
                                        onClick={() => { setEditing(false); setBio(profileUser.bio ?? ''); setIsPublic(profileUser.is_public); setAvatarPreview(profileUser.avatar_url); setAvatarFile(null); }}
                                        style={{
                                            padding: '9px 24px', borderRadius: 999,
                                            border: '1px solid #e8d9c4', color: '#2d2118',
                                            fontSize: 14, fontWeight: 600, background: 'none',
                                            cursor: 'pointer',
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
                                        fontSize: 14, fontWeight: 600, background: 'none',
                                        cursor: 'pointer',
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
                            </>
                        ) : null}
                    </div>

                    {/* Inline edit form */}
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
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#2d2118' }}>
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
                                    Profil je verejný
                                </label>
                            </div>
                            <p style={{ fontSize: 11, color: '#9a8a7a', marginTop: 4 }}>
                                Klikni na fotku vyššie pre zmenu avatara
                            </p>
                        </div>
                    )}

                    {/* Tabs */}
                    <div style={{
                        display: 'flex', marginTop: 24,
                        borderBottom: '1px solid #e8d9c4',
                    }}>
                        {([
                            ['sleduje', 'Sleduje'],
                            ['aktivita', 'Aktivita'],
                            ...(isOwn ? [['predplatne', 'Predplatné']] as const : []),
                        ] as [Tab, string][]).map(([t, label]) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                style={{
                                    flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: tab === t ? '#c4714a' : '#9a8a7a',
                                    borderBottom: tab === t ? '2px solid #c4714a' : '2px solid transparent',
                                    transition: 'color 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ marginTop: 20, paddingBottom: 40 }}>

                        {/* Sleduje — coaches this user follows */}
                        {tab === 'sleduje' && (
                            followingList.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a8a7a', fontSize: 14 }}>
                                    {isOwn ? 'Zatiaľ neslduješ žiadnych koučov.' : `${profileUser.name} ešte nikoho nenasleduje.`}
                                    {isOwn && (
                                        <div style={{ marginTop: 12 }}>
                                            <Link href="/coaches" style={{ color: '#c4714a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                                                Nájdi koučov →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {followingList.map(u => (
                                        <Link
                                            key={u.id}
                                            href={u.coach_id ? `/coaches/${u.coach_id}` : `/profile/${u.id}`}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                background: 'white', borderRadius: 14, padding: '12px 16px',
                                                border: '1px solid #e8d9c4', textDecoration: 'none',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                                        >
                                            <Avatar url={u.avatar_url} name={u.name} size={44} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2118' }}>{u.name}</div>
                                                {u.specialization && (
                                                    <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 2 }}>{u.specialization}</div>
                                                )}
                                            </div>
                                            <span style={{ fontSize: 12, color: '#c4714a', fontWeight: 600 }}>
                                                {u.role === 'coach' ? '💪 Kouč' : '👤'}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )
                        )}

                        {/* Aktivita */}
                        {tab === 'aktivita' && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a8a7a', fontSize: 14 }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                                <p>Aktivita sa tu čoskoro zobrazí.</p>
                            </div>
                        )}

                        {/* Predplatné — own profile only */}
                        {tab === 'predplatne' && isOwn && (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9a8a7a', fontSize: 14 }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                                <p>Tvoje predplatné sa tu čoskoro zobrazí.</p>
                                <Link href="/coaches" style={{ display: 'inline-block', marginTop: 12, color: '#c4714a', fontWeight: 600, textDecoration: 'none' }}>
                                    Preskúmaj koučov →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}
