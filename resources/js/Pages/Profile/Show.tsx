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
    subscriber_count: number;
    rating_avg: number;
    rating_count: number;
    monthly_price: number | null;
    notif_new_subscriber: boolean | null;
    notif_new_message: boolean | null;
    notif_new_review: boolean | null;
    notif_new_like: boolean | null;
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

interface OwnPost {
    id: number;
    title: string;
    body: string;
    is_exclusive: boolean;
    media_type: string;
    media_path: string | null;
    views: number;
    likes_count: number;
    created_at: string;
}

interface CoachReview {
    id: number;
    rating: number;
    content: string | null;
    created_at: string;
    user: { id: number; name: string; avatar_url: string | null };
}

interface Follower {
    id: number;
    name: string;
    profile_avatar: string | null;
    role: string;
    followed_at: string;
}

interface CoachSubscriber {
    id: number;
    name: string;
    profile_avatar: string | null;
    subscribed_at: string;
    monthly_price: number;
}

interface ActivityItem {
    id: number;
    type: string;
    title: string;
    body: string | null;
    related_id: number | null;
    is_read: boolean;
    created_at: string;
    time: string;
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
    ownPosts: OwnPost[];
    coachReviews: CoachReview[];
    postsCount: number;
    followers: Follower[];
    subscribers: CoachSubscriber[];
    recentActivity: ActivityItem[];
    flash?: { success?: string };
}

type FanTab   = 'predplatne' | 'sleduje' | 'lajky' | 'nastavenia';
type CoachTab = 'prehlad' | 'obsah' | 'recenzie' | 'sledovatelia' | 'predplatitelia' | 'nastavenia';

// ── Stars helper ───────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
    return (
        <span style={{ color: '#f59e0b', fontSize: 13 }}>
            {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
        </span>
    );
}

// ── Delete account modal ───────────────────────────────────────────────────────

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
                    <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 999, border: '1px solid #e8d9c4', background: 'none', fontSize: 14, fontWeight: 600, color: '#2d2118', cursor: 'pointer' }}>
                        Zrušiť
                    </button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '11px 0', borderRadius: 999, border: 'none', background: '#d32f2f', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer' }}>
                        Zmazať účet
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Delete post modal ──────────────────────────────────────────────────────────

function DeletePostModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
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
            <div style={{ background: 'white', borderRadius: 18, padding: 28, maxWidth: 360, width: '100%', border: '1px solid #e8d9c4', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 10 }}>🗑️</div>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#2d2118', textAlign: 'center', margin: '0 0 10px' }}>
                    Zmazať príspevok?
                </h3>
                <p style={{ fontSize: 13, color: '#9a8a7a', textAlign: 'center', lineHeight: 1.6, margin: '0 0 22px' }}>
                    Naozaj chceš zmazať tento príspevok? Akcia je nevratná.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: '1px solid #e8d9c4', background: 'none', fontSize: 14, fontWeight: 600, color: '#2d2118', cursor: 'pointer' }}>
                        Zrušiť
                    </button>
                    <button onClick={onConfirm} style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: 'none', background: '#d32f2f', fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer' }}>
                        Zmazať
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Notification toggle ────────────────────────────────────────────────────────

function NotifToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0e8df' }}>
            <span style={{ fontSize: 14, color: '#2d2118' }}>{label}</span>
            <button
                onClick={() => onChange(!checked)}
                style={{
                    width: 44, height: 24, borderRadius: 999, border: 'none',
                    background: checked ? '#c4714a' : '#e8d9c4',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
            >
                <div style={{
                    position: 'absolute', top: 3, left: checked ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
            </button>
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
    ownPosts: initOwnPosts,
    coachReviews,
    postsCount,
    followers = [],
    subscribers = [],
    recentActivity = [],
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

    const isCoachOwnProfile = isOwn && profileUser.role === 'coach';

    // Tabs
    const [coachTab, setCoachTab] = useState<CoachTab>('prehlad');
    const [fanTab, setFanTab]     = useState<FanTab>(isOwn ? 'predplatne' : 'sleduje');

    // Follow state
    const [following, setFollowing]         = useState(initFollowing);
    const [followersCount, setFollowersCount] = useState(initFollowersCount);
    const [followLoading, setFollowLoading] = useState(false);
    const [followingState, setFollowingState] = useState<Record<number, boolean>>({});

    // Edit mode (fan social profile)
    const [editing, setEditing]         = useState(false);
    const [bio, setBio]                 = useState(profileUser.bio ?? '');
    const [isPublic, setIsPublic]       = useState(profileUser.is_public);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profileUser.avatar_url);
    const [avatarFile, setAvatarFile]   = useState<File | null>(null);
    const [saving, setSaving]           = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Delete account modal
    const [showDelete, setShowDelete]   = useState(false);

    // Delete post modal
    const [deletePostId, setDeletePostId] = useState<number | null>(null);
    const [ownPosts, setOwnPosts]         = useState<OwnPost[]>(initOwnPosts);
    const [deletingPost, setDeletingPost] = useState(false);

    // Notification preferences (local state for toggles)
    const [notifSubscriber, setNotifSubscriber] = useState(profileUser.notif_new_subscriber ?? true);
    const [notifMessage, setNotifMessage]       = useState(profileUser.notif_new_message ?? true);
    const [notifReview, setNotifReview]         = useState(profileUser.notif_new_review ?? true);
    const [notifLike, setNotifLike]             = useState(profileUser.notif_new_like ?? false);
    const [notifSaving, setNotifSaving]         = useState(false);

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

    async function saveNotifPrefs() {
        setNotifSaving(true);
        try {
            await axios.post('/profile/update', {
                notif_new_subscriber: notifSubscriber ? 1 : 0,
                notif_new_message:    notifMessage    ? 1 : 0,
                notif_new_review:     notifReview     ? 1 : 0,
                notif_new_like:       notifLike       ? 1 : 0,
            });
        } finally {
            setNotifSaving(false);
        }
    }

    function handleDeleteAccount() {
        router.delete('/profile');
    }

    async function handleDeletePost(postId: number) {
        setDeletingPost(true);
        try {
            await axios.delete(`/dashboard/posts/${postId}`);
            setOwnPosts(prev => prev.filter(p => p.id !== postId));
        } finally {
            setDeletingPost(false);
            setDeletePostId(null);
        }
    }

    const isCoachFollowed = (userId: number) => followingState[userId] !== false;

    // ── Notification link helper ────────────────────────────────────────────────
    function getNotificationLink(item: ActivityItem): string {
        switch (item.type) {
            case 'new_message':   return item.related_id ? `/messages/${item.related_id}` : '/messages';
            case 'new_subscriber': return '/profile/me';
            case 'new_follower':  return item.related_id ? `/profile/${item.related_id}` : '/notifications';
            case 'new_like':
            case 'new_post':
            case 'new_reel':      return '/feed';
            case 'new_review':    return item.related_id ? `/coaches/${item.related_id}` : '/notifications';
            default:              return '/notifications';
        }
    }

    const ACTIVITY_ICONS: Record<string, string> = {
        new_subscriber: '🎉', new_message: '💬', new_like: '❤️',
        new_post: '📸', new_reel: '⚡', new_review: '⭐', new_follower: '🔔',
    };

    // ── Profile completeness (coach only) ─────────────────────────────────────

    const completeness = isCoachOwnProfile ? [
        { done: !!profileUser.avatar_url,                    label: 'Profilová fotka' },
        { done: !!profileUser.bio,                           label: 'Bio' },
        { done: !!profileUser.specialization,                label: 'Špecializácia' },
        { done: (profileUser.monthly_price ?? 0) > 0,       label: 'Cena predplatného' },
        { done: postsCount > 0,                              label: 'Aspoň 1 príspevok' },
    ] : [];
    const completePct = completeness.length
        ? Math.round((completeness.filter(c => c.done).length / completeness.length) * 100)
        : 100;

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <PulseLayout>
            <Head title={profileUser.name} />

            {showDelete && (
                <DeleteModal onClose={() => setShowDelete(false)} onConfirm={handleDeleteAccount} />
            )}

            {deletePostId !== null && (
                <DeletePostModal
                    onClose={() => setDeletePostId(null)}
                    onConfirm={() => handleDeletePost(deletePostId)}
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
                    <div style={{ position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)' }}>
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
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 36 }}>
                                    {profileUser.name?.charAt(0).toUpperCase() ?? '?'}
                                </div>
                            )}
                            {isOwn && (
                                <div
                                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'transparent', fontSize: 22, transition: 'all 0.2s' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.35)'; (e.currentTarget as HTMLDivElement).style.color = 'white'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)'; (e.currentTarget as HTMLDivElement).style.color = 'transparent'; }}
                                >
                                    📷
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                </div>

                <div className="mx-auto max-w-xl px-4" style={{ paddingTop: 64 }}>

                    {/* ── Name + role ── */}
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                            {profileUser.name}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            <span style={{ padding: '3px 12px', borderRadius: 999, background: profileUser.role === 'coach' ? '#fce8de' : '#e8f4ec', color: profileUser.role === 'coach' ? '#c4714a' : '#4a7c59', fontSize: 12, fontWeight: 600 }}>
                                {profileUser.role === 'coach' ? '💪 Kouč' : '👤 Člen'}
                            </span>
                            {profileUser.specialization && (
                                <span style={{ fontSize: 12, color: '#9a8a7a' }}>{profileUser.specialization}</span>
                            )}
                            {profileUser.is_verified && (
                                <span style={{ color: '#4a7c59', fontSize: 12, fontWeight: 600 }}>✓ Overený</span>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 6 }}>{profileUser.member_since}</div>
                    </div>

                    {/* ── Stats row ── */}
                    {isCoachOwnProfile ? (
                        /* Coach stats */
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 20, flexWrap: 'wrap' }}>
                            {[
                                { icon: '👥', value: profileUser.subscriber_count, label: 'predplatitelia' },
                                { icon: '❤️', value: followersCount, label: 'sledovatelia' },
                                { icon: '⭐', value: profileUser.rating_avg > 0 ? profileUser.rating_avg.toFixed(1) : '—', label: 'hodnotenie' },
                                { icon: '📝', value: postsCount, label: 'príspevky' },
                            ].map(stat => (
                                <div key={stat.label} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#2d2118' }}>
                                        {stat.icon} {stat.value}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Fan / other user stats */
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 20 }}>
                            {[
                                { value: followingCount, label: 'Sleduje' },
                                { value: profileUser.role !== 'coach' ? subscriptionsCount : 0, label: 'Predplatné' },
                                { value: likedPostsCount, label: 'Lajky' },
                            ].map(stat => (
                                <div key={stat.label} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2d2118' }}>{stat.value}</div>
                                    <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Action buttons ── */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                        {isCoachOwnProfile ? (
                            /* Coach action buttons */
                            <>
                                {profileUser.coach_id && (
                                    <Link
                                        href={`/coaches/${profileUser.coach_id}`}
                                        style={{ padding: '9px 18px', borderRadius: 999, border: '1.5px solid #e8d9c4', background: 'white', fontSize: 13, fontWeight: 600, color: '#2d2118', textDecoration: 'none' }}
                                    >
                                        👁️ Verejný profil
                                    </Link>
                                )}
                                <Link
                                    href="/dashboard/profile"
                                    style={{ padding: '9px 18px', borderRadius: 999, border: 'none', background: '#c4714a', fontSize: 13, fontWeight: 600, color: 'white', textDecoration: 'none' }}
                                >
                                    ✏️ Upraviť profil
                                </Link>
                            </>
                        ) : isOwn ? (
                            /* Fan own profile: edit toggle */
                            <button
                                onClick={() => setEditing(!editing)}
                                style={{ padding: '9px 20px', borderRadius: 999, border: '1.5px solid #c4714a', background: editing ? '#c4714a' : 'white', fontSize: 13, fontWeight: 600, color: editing ? 'white' : '#c4714a', cursor: 'pointer' }}
                            >
                                {editing ? '✕ Zrušiť' : '✏️ Upraviť profil'}
                            </button>
                        ) : (
                            /* Other user: follow + message */
                            <>
                                {auth?.user && (
                                    <button
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        style={{ padding: '9px 20px', borderRadius: 999, border: 'none', background: following ? '#e8f4ec' : '#c4714a', fontSize: 13, fontWeight: 600, color: following ? '#4a7c59' : 'white', cursor: 'pointer' }}
                                    >
                                        {following ? '✓ Sledujem' : '+ Sledovať'}
                                    </button>
                                )}
                                {auth?.user && (
                                    <Link href={`/messages/${profileUser.id}`} style={{ padding: '9px 20px', borderRadius: 999, border: '1.5px solid #e8d9c4', background: 'white', fontSize: 13, fontWeight: 600, color: '#2d2118', textDecoration: 'none' }}>
                                        💬 Správa
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Fan inline edit ── */}
                    {isOwn && !isCoachOwnProfile && editing && (
                        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e8d9c4', marginTop: 16 }}>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Napíš niečo o sebe..."
                                maxLength={300}
                                style={{ width: '100%', border: '1px solid #e8d9c4', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2d2118', background: '#faf6f0', resize: 'none', minHeight: 80, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2d2118', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ accentColor: '#c4714a' }} />
                                    Verejný profil
                                </label>
                                <button
                                    onClick={saveProfile}
                                    disabled={saving}
                                    style={{ padding: '9px 22px', borderRadius: 999, border: 'none', background: '#c4714a', fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer' }}
                                >
                                    {saving ? 'Ukladám...' : 'Uložiť'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Bio display ── */}
                    {profileUser.bio && !editing && (
                        <p style={{ textAlign: 'center', fontSize: 14, color: '#2d2118', lineHeight: 1.6, margin: '14px 0 0', padding: '0 8px' }}>
                            {profileUser.bio}
                        </p>
                    )}

                    {/* ── Profile completeness (coach only) ── */}
                    {isCoachOwnProfile && completePct < 100 && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: 16, marginTop: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, color: '#92400e', fontSize: 14 }}>Profil {completePct}% kompletný</span>
                                <span style={{ fontSize: 12, color: '#b45309' }}>{completePct}/100%</span>
                            </div>
                            <div style={{ width: '100%', background: '#fde68a', borderRadius: 999, height: 6, marginBottom: 10 }}>
                                <div style={{ width: `${completePct}%`, background: '#f59e0b', height: 6, borderRadius: 999, transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {completeness.filter(c => !c.done).map(c => (
                                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#92400e' }}>
                                        <span>○</span> {c.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        COACH OWN PROFILE TABS
                    ═══════════════════════════════════════════════════════════ */}
                    {isCoachOwnProfile && (
                        <div style={{ marginTop: 24 }}>
                            {/* Tab bar */}
                            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e8d9c4', marginBottom: 20, overflowX: 'auto' }}>
                                {([
                                    { key: 'prehlad',        label: '📊 Prehľad' },
                                    { key: 'obsah',          label: '📝 Môj obsah' },
                                    { key: 'sledovatelia',   label: `👥 Sledovatelia (${followers.length})` },
                                    { key: 'predplatitelia', label: `💳 Predplatitelia (${subscribers.length})` },
                                    { key: 'recenzie',       label: `⭐ Recenzie (${coachReviews.length})` },
                                    { key: 'nastavenia',     label: '⚙️ Nastavenia' },
                                ] as { key: CoachTab; label: string }[]).map(t => (
                                    <button
                                        key={t.key}
                                        onClick={() => setCoachTab(t.key)}
                                        style={{
                                            padding: '10px 16px', border: 'none', background: 'none',
                                            fontSize: 13, fontWeight: coachTab === t.key ? 700 : 500,
                                            color: coachTab === t.key ? '#c4714a' : '#9a8a7a',
                                            borderBottom: coachTab === t.key ? '2px solid #c4714a' : '2px solid transparent',
                                            marginBottom: -2, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* ── PREHĽAD tab ── */}
                            {coachTab === 'prehlad' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Quick stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { icon: '👥', value: profileUser.subscriber_count, label: 'Predplatitelia' },
                                            { icon: '❤️', value: followersCount, label: 'Sledovatelia' },
                                            { icon: '📝', value: postsCount, label: 'Príspevky' },
                                            { icon: '⭐', value: profileUser.rating_avg > 0 ? profileUser.rating_avg.toFixed(1) : '—', label: 'Hodnotenie' },
                                        ].map(s => (
                                            <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #e8d9c4' }}>
                                                <div style={{ fontSize: 22, fontWeight: 700, color: '#c4714a' }}>{s.icon} {s.value}</div>
                                                <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 4 }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Last 3 posts */}
                                    {ownPosts.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', margin: '0 0 10px' }}>Posledné príspevky</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {ownPosts.slice(0, 3).map(p => (
                                                    <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #e8d9c4', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f0e8df', overflow: 'hidden', flexShrink: 0 }}>
                                                            {p.media_path ? (
                                                                <img src={p.media_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                                                    {p.media_type === 'video' ? '🎬' : p.media_type === 'image' ? '📸' : '📝'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118' }} className="truncate">{p.title}</div>
                                                            <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 2 }}>
                                                                👁️ {p.views} · ❤️ {p.likes_count} · {p.created_at}
                                                                {p.is_exclusive && <span style={{ marginLeft: 6, color: '#c4714a' }}>🔒</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Last 3 reviews */}
                                    {coachReviews.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', margin: '0 0 10px' }}>Posledné recenzie</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {coachReviews.slice(0, 3).map(r => (
                                                    <div key={r.id} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', border: '1px solid #e8d9c4' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            <Avatar src={r.user.avatar_url} name={r.user.name} size={28} />
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#2d2118' }}>{r.user.name}</span>
                                                            <Stars rating={r.rating} />
                                                            <span style={{ fontSize: 11, color: '#9a8a7a', marginLeft: 'auto' }}>{r.created_at}</span>
                                                        </div>
                                                        {r.content && <p style={{ fontSize: 13, color: '#2d2118', margin: 0, lineHeight: 1.5 }}>{r.content}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent activity (clickable) */}
                                    {recentActivity.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', margin: '0 0 10px' }}>Posledná aktivita</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {recentActivity.map(activity => (
                                                    <Link
                                                        key={activity.id}
                                                        href={getNotificationLink(activity)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                            padding: '10px 12px', borderRadius: 10,
                                                            background: activity.is_read ? 'white' : '#fef8f5',
                                                            border: `1px solid ${activity.is_read ? '#e8d9c4' : '#fce8de'}`,
                                                            textDecoration: 'none', transition: 'background 0.15s',
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = activity.is_read ? 'white' : '#fef8f5')}
                                                    >
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: '50%',
                                                            background: '#fce8de', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 14, flexShrink: 0,
                                                        }}>
                                                            {ACTIVITY_ICONS[activity.type] ?? '🔔'}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: 13, color: '#2d2118', margin: 0, fontWeight: activity.is_read ? 400 : 600 }} className="truncate">
                                                                {activity.body ?? activity.title}
                                                            </p>
                                                            <p style={{ fontSize: 11, color: '#9a8a7a', margin: '2px 0 0' }}>{activity.time}</p>
                                                        </div>
                                                        {!activity.is_read && (
                                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c4714a', flexShrink: 0 }} />
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Link
                                        href="/dashboard"
                                        style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, border: '1.5px solid #c4714a', color: '#c4714a', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                                    >
                                        📈 Zobraziť celý dashboard →
                                    </Link>
                                </div>
                            )}

                            {/* ── MÔJ OBSAH tab ── */}
                            {coachTab === 'obsah' && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                            Príspevky ({ownPosts.length})
                                        </h3>
                                        <Link
                                            href="/dashboard/posts/create"
                                            style={{ padding: '8px 16px', borderRadius: 999, border: 'none', background: '#c4714a', color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                                        >
                                            + Pridať obsah
                                        </Link>
                                    </div>

                                    {ownPosts.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9a8a7a' }}>
                                            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                                            <p style={{ fontSize: 14, margin: '0 0 16px' }}>Zatiaľ žiadny obsah. Pridaj prvý príspevok!</p>
                                            <Link href="/dashboard/posts/create" style={{ color: '#c4714a', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                                                Vytvoriť príspevok →
                                            </Link>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {ownPosts.map(p => (
                                                <div
                                                    key={p.id}
                                                    style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #e8d9c4', display: 'flex', gap: 12, alignItems: 'flex-start' }}
                                                >
                                                    {/* Thumbnail */}
                                                    <div style={{ width: 64, height: 64, borderRadius: 10, background: '#f0e8df', overflow: 'hidden', flexShrink: 0 }}>
                                                        {p.media_path ? (
                                                            <img src={p.media_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                                                {p.media_type === 'video' ? '🎬' : p.media_type === 'image' ? '📸' : '📝'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Content */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#2d2118', flex: 1, minWidth: 0 }} className="truncate">
                                                                {p.title}
                                                            </span>
                                                            <span style={{
                                                                padding: '2px 8px', borderRadius: 999,
                                                                background: p.is_exclusive ? '#fce8de' : '#e8f4ec',
                                                                color: p.is_exclusive ? '#c4714a' : '#4a7c59',
                                                                fontSize: 10, fontWeight: 700, flexShrink: 0,
                                                            }}>
                                                                {p.is_exclusive ? '🔒 Exkluzívne' : '🌍 Verejné'}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 4 }}>
                                                            👁️ {p.views} · ❤️ {p.likes_count} · {p.created_at}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                            <Link
                                                                href="/dashboard/posts/create"
                                                                style={{ fontSize: 12, fontWeight: 600, color: '#c4714a', textDecoration: 'none', padding: '4px 12px', borderRadius: 999, border: '1px solid #c4714a' }}
                                                            >
                                                                Upraviť
                                                            </Link>
                                                            <button
                                                                onClick={() => setDeletePostId(p.id)}
                                                                style={{ fontSize: 12, fontWeight: 600, color: '#9a8a7a', background: 'none', border: '1px solid #e8d9c4', borderRadius: 999, padding: '4px 12px', cursor: 'pointer' }}
                                                                onMouseEnter={e => { (e.currentTarget.style.color = '#d32f2f'); (e.currentTarget.style.borderColor = '#d32f2f'); }}
                                                                onMouseLeave={e => { (e.currentTarget.style.color = '#9a8a7a'); (e.currentTarget.style.borderColor = '#e8d9c4'); }}
                                                            >
                                                                Zmazať
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── SLEDOVATELIA tab ── */}
                            {coachTab === 'sledovatelia' && (
                                <div>
                                    {followers.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a8a7a' }}>
                                            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                                            <p style={{ fontSize: 14 }}>Zatiaľ žiadni sledovatelia</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {followers.map(follower => (
                                                <Link
                                                    key={follower.id}
                                                    href={`/profile/${follower.id}`}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        padding: '12px 14px', borderRadius: 14,
                                                        background: 'white', border: '1px solid #e8d9c4',
                                                        textDecoration: 'none', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                                                >
                                                    <Avatar src={follower.profile_avatar} name={follower.name} size={44} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2118', margin: 0 }}>
                                                            {follower.name}
                                                        </p>
                                                        <p style={{ fontSize: 12, color: '#9a8a7a', margin: '2px 0 0' }}>
                                                            Sleduje od {new Date(follower.followed_at).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <span style={{
                                                        fontSize: 11, padding: '3px 10px', borderRadius: 999,
                                                        background: follower.role === 'coach' ? '#fce8de' : '#e8f4ec',
                                                        color: follower.role === 'coach' ? '#c4714a' : '#4a7c59',
                                                        fontWeight: 600, flexShrink: 0,
                                                    }}>
                                                        {follower.role === 'coach' ? '💪 Kouč' : '👤 Člen'}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PREDPLATITELIA tab ── */}
                            {coachTab === 'predplatitelia' && (
                                <div>
                                    {subscribers.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a8a7a' }}>
                                            <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                                            <p style={{ fontSize: 14, margin: '0 0 8px' }}>Zatiaľ žiadni predplatitelia</p>
                                            <p style={{ fontSize: 13, color: '#b0a090', margin: 0 }}>
                                                Zdieľaj svoj profil aby si získal prvých predplatiteľov
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {subscribers.map(sub => (
                                                <Link
                                                    key={sub.id}
                                                    href={`/profile/${sub.id}`}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        padding: '12px 14px', borderRadius: 14,
                                                        background: 'white', border: '1px solid #e8d9c4',
                                                        textDecoration: 'none', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                                                >
                                                    <Avatar src={sub.profile_avatar} name={sub.name} size={44} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2118', margin: 0 }}>
                                                            {sub.name}
                                                        </p>
                                                        <p style={{ fontSize: 12, color: '#9a8a7a', margin: '2px 0 0' }}>
                                                            Predplatiteľ od {new Date(sub.subscribed_at).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <span style={{
                                                        fontSize: 12, fontWeight: 700, padding: '3px 10px',
                                                        borderRadius: 999, background: '#e8f4ec', color: '#4a7c59',
                                                        flexShrink: 0,
                                                    }}>
                                                        €{sub.monthly_price.toFixed(2)}/mes
                                                    </span>
                                                </Link>
                                            ))}
                                            {/* Revenue summary */}
                                            <div style={{ marginTop: 8, padding: '12px 16px', background: '#faf6f0', borderRadius: 14, textAlign: 'center' }}>
                                                <p style={{ fontSize: 14, color: '#5a4a3a', margin: 0 }}>
                                                    Celkový mesačný príjem:{' '}
                                                    <span style={{ fontWeight: 700, color: '#c4714a' }}>
                                                        €{subscribers.reduce((sum, s) => sum + s.monthly_price * 0.85, 0).toFixed(2)}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: '#9a8a7a', marginLeft: 4 }}>(po 15% provízii)</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── RECENZIE tab ── */}
                            {coachTab === 'recenzie' && (
                                <div>
                                    {/* Rating summary */}
                                    {profileUser.rating_count > 0 && (
                                        <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #e8d9c4', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 36, fontWeight: 700, color: '#2d2118' }}>{profileUser.rating_avg.toFixed(1)}</div>
                                                <Stars rating={profileUser.rating_avg} />
                                                <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 4 }}>{profileUser.rating_count} recenzií</div>
                                            </div>
                                        </div>
                                    )}

                                    {coachReviews.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9a8a7a' }}>
                                            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
                                            <p style={{ fontSize: 14 }}>Zatiaľ žiadne recenzie.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {coachReviews.map(r => (
                                                <div key={r.id} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px solid #e8d9c4' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                                        <Avatar src={r.user.avatar_url} name={r.user.name} size={36} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118' }}>{r.user.name}</div>
                                                            <Stars rating={r.rating} />
                                                        </div>
                                                        <span style={{ fontSize: 11, color: '#9a8a7a' }}>{r.created_at}</span>
                                                    </div>
                                                    {r.content && (
                                                        <p style={{ fontSize: 13, color: '#2d2118', margin: 0, lineHeight: 1.6 }}>{r.content}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── NASTAVENIA tab (coach) ── */}
                            {coachTab === 'nastavenia' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Account */}
                                    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e8d9c4' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', margin: '0 0 14px' }}>Účet</h3>
                                        <div style={{ fontSize: 13, color: '#9a8a7a', marginBottom: 4 }}>Email</div>
                                        <div style={{ fontSize: 14, color: '#2d2118', fontWeight: 500, marginBottom: 16 }}>{profileUser.email}</div>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <Link href="/password/change" style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#c4714a', textDecoration: 'none', padding: '8px 18px', borderRadius: 999, border: '1px solid #c4714a' }}>
                                                🔑 Zmeniť heslo
                                            </Link>
                                            <Link href="/dashboard/profile" style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: 'white', textDecoration: 'none', padding: '8px 18px', borderRadius: 999, background: '#c4714a', border: '1px solid #c4714a' }}>
                                                ⚙️ Upraviť coach profil
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Notification preferences */}
                                    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e8d9c4' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', margin: '0 0 4px' }}>Notifikácie</h3>
                                        <p style={{ fontSize: 12, color: '#9a8a7a', margin: '0 0 14px' }}>Vyber, o čom chceš dostávať upozornenia</p>
                                        <NotifToggle label="🔔 Nový predplatiteľ" checked={notifSubscriber} onChange={setNotifSubscriber} />
                                        <NotifToggle label="🔔 Nová správa"       checked={notifMessage}    onChange={setNotifMessage} />
                                        <NotifToggle label="🔔 Nové hodnotenie"   checked={notifReview}     onChange={setNotifReview} />
                                        <NotifToggle label="🔔 Nový lajk"        checked={notifLike}       onChange={setNotifLike} />
                                        <button
                                            onClick={saveNotifPrefs}
                                            disabled={notifSaving}
                                            style={{ marginTop: 14, padding: '9px 22px', borderRadius: 999, border: 'none', background: '#c4714a', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            {notifSaving ? 'Ukladám...' : 'Uložiť'}
                                        </button>
                                    </div>

                                    {/* Danger zone */}
                                    <div style={{ background: '#fff5f5', borderRadius: 16, padding: 20, border: '1px solid #fecaca' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d32f2f', margin: '0 0 8px' }}>Nebezpečná zóna</h3>
                                        <p style={{ fontSize: 13, color: '#9a8a7a', margin: '0 0 16px' }}>Zmazanie účtu je nenávratné.</p>
                                        <button
                                            onClick={() => setShowDelete(true)}
                                            style={{ padding: '9px 20px', borderRadius: 999, background: 'none', border: '1.5px solid #d32f2f', color: '#d32f2f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                            onMouseEnter={e => { (e.currentTarget.style.background = '#d32f2f'); (e.currentTarget.style.color = 'white'); }}
                                            onMouseLeave={e => { (e.currentTarget.style.background = 'none'); (e.currentTarget.style.color = '#d32f2f'); }}
                                        >
                                            🗑️ Zmazať účet
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════════════════
                        FAN / OTHER USER TABS
                    ═══════════════════════════════════════════════════════════ */}
                    {!isCoachOwnProfile && (
                        <div style={{ marginTop: 24 }}>
                            {/* Tab bar */}
                            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e8d9c4', marginBottom: 20, overflowX: 'auto' }}>
                                {(isOwn
                                    ? [
                                        { key: 'predplatne', label: '📋 Predplatné' },
                                        { key: 'sleduje',    label: '👥 Sleduje' },
                                        { key: 'lajky',      label: '❤️ Páčilo sa mi' },
                                        { key: 'nastavenia', label: '⚙️ Nastavenia' },
                                      ]
                                    : [{ key: 'sleduje', label: '👥 Sleduje' }]
                                ).map((t: { key: string; label: string }) => (
                                    <button
                                        key={t.key}
                                        onClick={() => setFanTab(t.key as FanTab)}
                                        style={{
                                            padding: '10px 16px', border: 'none', background: 'none',
                                            fontSize: 13, fontWeight: fanTab === t.key ? 700 : 500,
                                            color: fanTab === t.key ? '#c4714a' : '#9a8a7a',
                                            borderBottom: fanTab === t.key ? '2px solid #c4714a' : '2px solid transparent',
                                            marginBottom: -2, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                        }}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* ── PREDPLATNÉ tab ── */}
                            {fanTab === 'predplatne' && isOwn && (
                                subscriptions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a8a7a' }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                                        <p style={{ fontSize: 14, margin: '0 0 16px' }}>Zatiaľ žiadne predplatné.</p>
                                        <Link href="/coaches" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 999, background: '#c4714a', color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                                            Objaviť koučov →
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {subscriptions.map((sub, i) => (
                                            <div key={sub.coach_id ?? i} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', border: '1px solid #e8d9c4', display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <Avatar src={sub.avatar_url} name={sub.name} size={48} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2118' }}>{sub.name}</div>
                                                    {sub.specialization && <div style={{ fontSize: 12, color: '#9a8a7a', marginTop: 2 }}>{sub.specialization}</div>}
                                                    {sub.subscribed_since && (
                                                        <div style={{ fontSize: 11, color: '#9a8a7a', marginTop: 3 }}>
                                                            Predplatiteľ od {new Date(sub.subscribed_since).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                                    {sub.monthly_price && (
                                                        <span style={{ padding: '3px 10px', borderRadius: 999, background: '#fce8de', color: '#c4714a', fontSize: 12, fontWeight: 700 }}>
                                                            €{Number(sub.monthly_price).toFixed(2)}/mes
                                                        </span>
                                                    )}
                                                    <span style={{ padding: '2px 8px', borderRadius: 999, background: sub.status === 'active' ? '#e8f4ec' : '#fdecea', color: sub.status === 'active' ? '#4a7c59' : '#d32f2f', fontSize: 11, fontWeight: 600 }}>
                                                        {sub.status === 'active' ? '● Aktívne' : '● Zrušené'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                                    {sub.coach_id && (
                                                        <Link href={`/coaches/${sub.coach_id}`} style={{ fontSize: 12, color: '#c4714a', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                                            Profil →
                                                        </Link>
                                                    )}
                                                    <button
                                                        style={{ fontSize: 11, color: '#9a8a7a', background: 'none', border: '1px solid #e8d9c4', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
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
                            {fanTab === 'sleduje' && (
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
                                                style={{ background: 'white', borderRadius: 16, padding: '16px 12px', border: '1px solid #e8d9c4', textAlign: 'center', opacity: isCoachFollowed(u.id) ? 1 : 0.5, transition: 'opacity 0.2s' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                                                    <Avatar src={u.avatar_url} name={u.name} size={56} />
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', marginBottom: 3 }}>{u.name}</div>
                                                {u.specialization && <div style={{ fontSize: 11, color: '#9a8a7a', marginBottom: 10 }}>{u.specialization}</div>}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {u.coach_id && (
                                                        <Link href={`/coaches/${u.coach_id}`} style={{ fontSize: 12, color: '#c4714a', fontWeight: 600, textDecoration: 'none' }}>
                                                            Zobraziť →
                                                        </Link>
                                                    )}
                                                    {isOwn && (
                                                        <button
                                                            onClick={() => handleUnfollowCoach(u.id)}
                                                            disabled={!isCoachFollowed(u.id)}
                                                            style={{ fontSize: 11, borderRadius: 999, padding: '4px 10px', cursor: 'pointer', background: isCoachFollowed(u.id) ? '#4a7c59' : '#e8d9c4', color: 'white', border: 'none', fontWeight: 600 }}
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

                            {/* ── LAJKY tab ── */}
                            {fanTab === 'lajky' && isOwn && (
                                likedPosts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9a8a7a' }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
                                        <p style={{ fontSize: 14 }}>Zatiaľ žiadne lajknuté príspevky.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {likedPosts.map(post => (
                                            <Link key={post.id} href={post.coach_id ? `/coaches/${post.coach_id}` : '#'} style={{ textDecoration: 'none', display: 'block' }}>
                                                <div
                                                    style={{ background: 'white', borderRadius: 14, border: '1px solid #e8d9c4', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                                >
                                                    <div style={{ aspectRatio: '4/3', background: '#f0e8df', position: 'relative', overflow: 'hidden' }}>
                                                        {post.thumbnail_url ? (
                                                            <img src={post.thumbnail_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#c4714a' }}>
                                                                {post.media_type === 'video' ? '🎬' : post.media_type === 'image' ? '📸' : '📝'}
                                                            </div>
                                                        )}
                                                        {post.is_exclusive && (
                                                            <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>🔒</div>
                                                        )}
                                                    </div>
                                                    <div style={{ padding: '8px 10px' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#2d2118', marginBottom: 2 }} className="line-clamp-1">
                                                            {post.title || '—'}
                                                        </div>
                                                        {post.coach_name && <div style={{ fontSize: 11, color: '#9a8a7a' }}>{post.coach_name}</div>}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* ── NASTAVENIA tab (fan) ── */}
                            {fanTab === 'nastavenia' && isOwn && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e8d9c4' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', margin: '0 0 14px' }}>Účet</h3>
                                        <div style={{ fontSize: 13, color: '#9a8a7a', marginBottom: 4 }}>Email</div>
                                        <div style={{ fontSize: 14, color: '#2d2118', fontWeight: 500, marginBottom: 16 }}>{profileUser.email}</div>
                                        <Link href="/password/change" style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#c4714a', textDecoration: 'none', padding: '8px 18px', borderRadius: 999, border: '1px solid #c4714a' }}>
                                            🔑 Zmeniť heslo
                                        </Link>
                                    </div>

                                    {/* Notification prefs for fans */}
                                    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e8d9c4' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', margin: '0 0 4px' }}>Notifikácie</h3>
                                        <p style={{ fontSize: 12, color: '#9a8a7a', margin: '0 0 14px' }}>Upozornenia</p>
                                        <NotifToggle label="🔔 Nová správa" checked={notifMessage} onChange={setNotifMessage} />
                                        <NotifToggle label="🔔 Nový lajk"   checked={notifLike}    onChange={setNotifLike} />
                                        <button onClick={saveNotifPrefs} disabled={notifSaving} style={{ marginTop: 14, padding: '9px 22px', borderRadius: 999, border: 'none', background: '#c4714a', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                            {notifSaving ? 'Ukladám...' : 'Uložiť'}
                                        </button>
                                    </div>

                                    <div style={{ background: '#fff5f5', borderRadius: 16, padding: 20, border: '1px solid #fecaca' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d32f2f', margin: '0 0 8px' }}>Nebezpečná zóna</h3>
                                        <p style={{ fontSize: 13, color: '#9a8a7a', margin: '0 0 16px' }}>Zmazanie účtu je nenávratné. Všetky dáta budú trvalo odstránené.</p>
                                        <button
                                            onClick={() => setShowDelete(true)}
                                            style={{ padding: '9px 20px', borderRadius: 999, background: 'none', border: '1.5px solid #d32f2f', color: '#d32f2f', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                            onMouseEnter={e => { (e.currentTarget.style.background = '#d32f2f'); (e.currentTarget.style.color = 'white'); }}
                                            onMouseLeave={e => { (e.currentTarget.style.background = 'none'); (e.currentTarget.style.color = '#d32f2f'); }}
                                        >
                                            🗑️ Zmazať účet
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </PulseLayout>
    );
}
