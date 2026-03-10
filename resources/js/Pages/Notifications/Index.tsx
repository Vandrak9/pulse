import PulseLayout from '@/Layouts/PulseLayout';
import { Head, Link, router } from '@inertiajs/react';

interface Notification {
    id: number;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    related_id: number | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

interface Props {
    notifications: Notification[];
    unread_count: number;
}

const TYPE_ICONS: Record<string, string> = {
    new_subscriber: '🎉',
    new_message:    '💬',
    new_like:       '❤️',
    new_post:       '📸',
    new_reel:       '⚡',
    new_review:     '⭐',
    new_follower:   '🔔',
    tip:            '💰',
};

function getNotificationLink(n: Notification): string {
    switch (n.type) {
        case 'new_message':
            return n.related_id ? `/messages/${n.related_id}` : '/messages';
        case 'new_subscriber':
            return '/profile/me';
        case 'new_follower':
            return n.related_id ? `/profile/${n.related_id}` : '/notifications';
        case 'new_like':
        case 'new_post':
        case 'new_reel':
            return '/feed';
        case 'new_review':
            return n.related_id ? `/coaches/${n.related_id}` : '/notifications';
        default:
            return '/notifications';
    }
}

function relativeTime(dateStr: string): string {
    const now = Date.now();
    const diff = Math.floor((now - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Práve teraz';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hod`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
    return new Date(dateStr).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short' });
}

export default function NotificationsIndex({ notifications, unread_count }: Props) {
    function markAllRead() {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    }

    function handleMarkRead(id: number, isRead: boolean) {
        if (!isRead) {
            router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
        }
    }

    return (
        <PulseLayout>
            <Head title="Notifikácie" />

            <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                            Notifikácie
                        </h1>
                        {unread_count > 0 && (
                            <p style={{ fontSize: 13, color: '#9a8a7a', margin: '4px 0 0' }}>
                                {unread_count} neprečítaných
                            </p>
                        )}
                    </div>
                    {unread_count > 0 && (
                        <button
                            onClick={markAllRead}
                            style={{
                                padding: '8px 16px', borderRadius: 999,
                                border: '1px solid #c4714a', color: '#c4714a',
                                fontSize: 13, fontWeight: 600, background: 'none',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#c4714a'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#c4714a'; }}
                        >
                            Označiť všetky ako prečítané
                        </button>
                    )}
                </div>

                {/* Notifications list */}
                {notifications.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '60px 24px',
                        borderRadius: 16, background: 'white',
                        border: '1px solid #e8d9c4',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2d2118', margin: '0 0 8px' }}>
                            Žiadne notifikácie
                        </h2>
                        <p style={{ fontSize: 14, color: '#9a8a7a', margin: 0 }}>
                            Tu sa zobrazia tvoje notifikácie keď prídu.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {notifications.map(n => (
                            <Link
                                key={n.id}
                                href={getNotificationLink(n)}
                                onClick={() => handleMarkRead(n.id, n.is_read)}
                                style={{
                                    display: 'flex', gap: 14, padding: '14px 16px',
                                    borderRadius: 12, cursor: 'pointer',
                                    background: n.is_read ? '#faf6f0' : 'white',
                                    border: `1px solid ${n.is_read ? 'transparent' : '#e8d9c4'}`,
                                    borderLeft: n.is_read ? '3px solid transparent' : '3px solid #c4714a',
                                    textDecoration: 'none',
                                    transition: 'background 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = n.is_read ? '#f0e8df' : '#fef8f5'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? '#faf6f0' : 'white'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Icon */}
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: n.is_read ? '#f0e8df' : '#fce8de',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, flexShrink: 0,
                                }}>
                                    {TYPE_ICONS[n.type] ?? '🔔'}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                        <p style={{
                                            fontSize: 14, fontWeight: n.is_read ? 400 : 600,
                                            color: '#2d2118', margin: 0, lineHeight: '1.4',
                                        }}>
                                            {n.title}
                                        </p>
                                        <span style={{ fontSize: 11, color: '#9a8a7a', flexShrink: 0, marginTop: 2 }}>
                                            {relativeTime(n.created_at)}
                                        </span>
                                    </div>
                                    {n.body && (
                                        <p style={{ fontSize: 13, color: '#6b5e52', margin: '4px 0 0', lineHeight: '1.45' }}>
                                            {n.body}
                                        </p>
                                    )}
                                </div>

                                {/* Unread dot */}
                                {!n.is_read && (
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: '#c4714a', flexShrink: 0,
                                        alignSelf: 'center',
                                    }} />
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </PulseLayout>
    );
}
