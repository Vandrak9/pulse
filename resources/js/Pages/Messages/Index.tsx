import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';

interface LastMessage {
    content: string;
    created_at: string;
    is_mine: boolean;
    message_type: string;
}

interface Conversation {
    partner_id: number;
    partner_name: string;
    partner_role: string;
    partner_avatar: string | null;
    last_message: LastMessage | null;
    unread_count: number;
}

interface Props {
    conversations: Conversation[];
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Práve teraz';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} hod`;
    if (diffDays === 1) return 'Včera';
    if (diffDays < 7) return `${diffDays} dní`;
    return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'short' }).format(date);
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function MessagesIndex({ conversations }: Props) {
    return (
        <PulseLayout>
            <Head title="Správy" />
            <div style={{ background: '#faf6f0', minHeight: '100vh' }}>
                {/* Header */}
                <div style={{
                    background: 'white',
                    borderBottom: '1px solid #e8d9c4',
                    padding: '16px 20px',
                    position: 'sticky',
                    top: 64,
                    zIndex: 10,
                }}>
                    <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                        Správy
                    </h1>
                </div>

                {conversations.length === 0 ? (
                    /* Empty state */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', marginBottom: 8 }}>
                            Žiadne správy
                        </h2>
                        <p style={{ color: '#9a8a7a', fontSize: 15, marginBottom: 24, maxWidth: 280 }}>
                            Napíš koučovi! Priamy kontakt je len jedno kliknutie ďalej.
                        </p>
                        <Link
                            href="/coaches"
                            style={{
                                background: '#c4714a',
                                color: 'white',
                                padding: '12px 28px',
                                borderRadius: 999,
                                fontWeight: 600,
                                fontSize: 15,
                                textDecoration: 'none',
                            }}
                        >
                            Nájsť kouča
                        </Link>
                    </div>
                ) : (
                    <div style={{ maxWidth: 640, margin: '0 auto' }}>
                        {conversations.map((conv) => (
                            <Link
                                key={conv.partner_id}
                                href={`/messages/${conv.partner_id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                        padding: '14px 20px',
                                        background: 'white',
                                        borderBottom: '1px solid #f0e8df',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                                >
                                    {/* Avatar */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        {conv.partner_avatar ? (
                                            <img
                                                src={conv.partner_avatar}
                                                alt={conv.partner_name}
                                                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '50%',
                                                background: '#fce8de', color: '#c4714a',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 16,
                                            }}>
                                                {getInitials(conv.partner_name)}
                                            </div>
                                        )}
                                        {conv.unread_count > 0 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, right: -2,
                                                width: 10, height: 10, borderRadius: '50%',
                                                background: '#c4714a', border: '2px solid white',
                                            }} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                            <span style={{
                                                fontWeight: conv.unread_count > 0 ? 700 : 500,
                                                fontSize: 15,
                                                color: '#2d2118',
                                            }}>
                                                {conv.partner_name}
                                            </span>
                                            {conv.last_message && (
                                                <span style={{ fontSize: 12, color: '#9a8a7a', flexShrink: 0 }}>
                                                    {timeAgo(conv.last_message.created_at)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: 14,
                                                color: conv.unread_count > 0 ? '#2d2118' : '#9a8a7a',
                                                fontWeight: conv.unread_count > 0 ? 500 : 400,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                flex: 1,
                                            }}>
                                                {conv.last_message ? (
                                                    <>
                                                        {conv.last_message.is_mine ? 'Ty: ' : ''}
                                                        {conv.last_message.message_type === 'voice' ? '🎤 Hlasová správa' :
                                                         conv.last_message.message_type === 'image' ? '📷 Fotka' :
                                                         conv.last_message.message_type === 'video' ? '🎥 Video' :
                                                         conv.last_message.content}
                                                    </>
                                                ) : 'Začni konverzáciu'}
                                            </span>
                                            {conv.unread_count > 0 && (
                                                <div style={{
                                                    background: '#c4714a',
                                                    color: 'white',
                                                    borderRadius: 999,
                                                    minWidth: 20,
                                                    height: 20,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    padding: '0 6px',
                                                    marginLeft: 8,
                                                    flexShrink: 0,
                                                }}>
                                                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </PulseLayout>
    );
}
