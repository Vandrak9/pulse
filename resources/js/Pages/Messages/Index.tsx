import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import PulseLayout from '@/Layouts/PulseLayout';
import Avatar from '@/Components/Avatar';
import { relativeTime } from '@/lib/utils';

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

function ConversationRow({ conv, compact = false }: { conv: Conversation; compact?: boolean }) {
    return (
        <Link key={conv.partner_id} href={`/messages/${conv.partner_id}`} style={{ textDecoration: 'none' }}>
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: compact ? '12px 16px' : '14px 20px',
                    background: 'white',
                    borderBottom: '1px solid #f0e8df',
                    cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
            >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar src={conv.partner_avatar} name={conv.partner_name} size={compact ? 42 : 48} />
                    {conv.unread_count > 0 && (
                        <div style={{
                            position: 'absolute', bottom: 0, right: -2,
                            width: 10, height: 10, borderRadius: '50%',
                            background: '#c4714a', border: '2px solid white',
                        }} />
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontWeight: conv.unread_count > 0 ? 700 : 500, fontSize: compact ? 14 : 15, color: '#2d2118' }}>
                            {conv.partner_name}
                        </span>
                        {conv.last_message && (
                            <span style={{ fontSize: 11, color: '#9a8a7a', flexShrink: 0 }}>
                                {relativeTime(conv.last_message.created_at)}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                            fontSize: 13, color: conv.unread_count > 0 ? '#2d2118' : '#9a8a7a',
                            fontWeight: conv.unread_count > 0 ? 500 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
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
                                background: '#c4714a', color: 'white', borderRadius: 999,
                                minWidth: 20, height: 20, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 11, fontWeight: 700,
                                padding: '0 6px', marginLeft: 8, flexShrink: 0,
                            }}>
                                {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

interface CoachResult {
    id: number;
    user_id: number;
    name: string;
    specialization: string | null;
    avatar_url: string | null;
}

function NewMessageModal({ onClose }: { onClose: () => void }) {
    const [query, setQuery]     = useState('');
    const [results, setResults] = useState<CoachResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef              = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const timer = setTimeout(() => {
            setLoading(true);
            axios.get<CoachResult[]>(`/coaches/search?q=${encodeURIComponent(query)}`)
                .then(r => setResults(r.data))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
            }}
        >
            <div style={{
                background: 'white', borderRadius: 18, width: '100%', maxWidth: 440,
                border: '1px solid #e8d9c4', overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            }}>
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0e8df', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                        Nová správa
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9a8a7a', lineHeight: 1 }}>×</button>
                </div>

                {/* Search input */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0e8df' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9a8a7a' }}>🔍</span>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Hľadaj kouča..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px 10px 34px',
                                borderRadius: 10, border: '1px solid #e8d9c4',
                                fontSize: 14, color: '#2d2118', background: '#faf6f0',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                {/* Results */}
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {loading && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9a8a7a', fontSize: 13 }}>Hľadám…</div>
                    )}
                    {!loading && query.trim() && results.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#9a8a7a', fontSize: 13 }}>Žiadni kouči nenájdení</div>
                    )}
                    {!loading && results.map(coach => (
                        <button
                            key={coach.id}
                            onClick={() => { onClose(); router.visit(`/messages/${coach.user_id}`); }}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 20px', background: 'none', border: 'none',
                                cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
                                borderBottom: '1px solid #f0e8df',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#faf6f0')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Avatar src={coach.avatar_url} name={coach.name} size={40} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2118', margin: 0 }}>{coach.name}</p>
                                {coach.specialization && (
                                    <p style={{ fontSize: 12, color: '#9a8a7a', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {coach.specialization}
                                    </p>
                                )}
                            </div>
                            <span style={{ fontSize: 12, color: '#c4714a', fontWeight: 600, flexShrink: 0 }}>Napísať →</span>
                        </button>
                    ))}
                    {!query.trim() && (
                        <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                            <p style={{ fontSize: 13, color: '#9a8a7a', margin: 0 }}>Zadaj meno kouča, ktorému chceš napísať</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MessagesIndex({ conversations }: Props) {
    const [showNewMessage, setShowNewMessage] = useState(false);

    return (
        <PulseLayout>
            <Head title="Správy" />

            {showNewMessage && <NewMessageModal onClose={() => setShowNewMessage(false)} />}

            {/* ── MOBILE layout ── */}
            <div className="md:hidden" style={{ background: '#faf6f0', minHeight: '100vh' }}>
                <div style={{
                    background: 'white', borderBottom: '1px solid #e8d9c4',
                    padding: '16px 20px', position: 'sticky', top: 57, zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                        Správy
                    </h1>
                    <button
                        onClick={() => setShowNewMessage(true)}
                        style={{
                            background: '#c4714a', color: 'white', border: 'none',
                            borderRadius: 999, padding: '8px 16px', fontSize: 13,
                            fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        + Nová správa
                    </button>
                </div>

                {conversations.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', marginBottom: 8 }}>Žiadne správy</h2>
                        <p style={{ color: '#9a8a7a', fontSize: 15, marginBottom: 24, maxWidth: 280 }}>
                            Napíš koučovi! Priamy kontakt je len jedno kliknutie ďalej.
                        </p>
                        <Link href="/coaches" style={{ background: '#c4714a', color: 'white', padding: '12px 28px', borderRadius: 999, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
                            Nájsť kouča
                        </Link>
                    </div>
                ) : (
                    <div>
                        {conversations.map(conv => <ConversationRow key={conv.partner_id} conv={conv} />)}
                    </div>
                )}
            </div>

            {/* ── DESKTOP two-panel layout ── */}
            <div
                className="hidden md:flex"
                style={{ height: '100vh', background: '#faf6f0' }}
            >
                {/* Left panel — conversation list */}
                <div style={{
                    width: 360, flexShrink: 0,
                    borderRight: '1px solid #e8d9c4',
                    background: 'white',
                    display: 'flex', flexDirection: 'column',
                    height: '100vh', overflowY: 'auto',
                }}>
                    {/* Panel header */}
                    <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e8d9c4', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                                Správy
                            </h1>
                            <button
                                onClick={() => setShowNewMessage(true)}
                                style={{
                                    background: '#c4714a', color: 'white', border: 'none',
                                    borderRadius: 999, padding: '7px 14px', fontSize: 12,
                                    fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                + Nová správa
                            </button>
                        </div>
                        {/* Search within conversations */}
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9a8a7a', fontSize: 13 }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Hľadaj v správach..."
                                style={{
                                    width: '100%', padding: '8px 12px 8px 30px',
                                    borderRadius: 999, border: '1px solid #e8d9c4',
                                    fontSize: 13, color: '#2d2118', background: '#faf6f0',
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    </div>

                    {/* Conversation list */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                                <p style={{ color: '#9a8a7a', fontSize: 14, marginBottom: 16 }}>Žiadne konverzácie</p>
                                <Link href="/coaches" style={{ color: '#c4714a', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                                    Nájsť kouča →
                                </Link>
                            </div>
                        ) : (
                            conversations.map(conv => <ConversationRow key={conv.partner_id} conv={conv} compact />)
                        )}
                    </div>
                </div>

                {/* Right panel — empty state (select a conversation) */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    background: '#faf6f0',
                }}>
                    <div style={{ textAlign: 'center', maxWidth: 320 }}>
                        <div style={{ fontSize: 72, marginBottom: 16 }}>💬</div>
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2d2118', marginBottom: 8 }}>
                            Vyber konverzáciu
                        </h2>
                        <p style={{ color: '#9a8a7a', fontSize: 15, lineHeight: 1.5 }}>
                            Vyber konverzáciu zo zoznamu vľavo a začni chatovať.
                        </p>
                        <Link
                            href="/coaches"
                            style={{
                                display: 'inline-block', marginTop: 24,
                                background: '#c4714a', color: 'white',
                                padding: '12px 28px', borderRadius: 999,
                                fontWeight: 600, fontSize: 14, textDecoration: 'none',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#5a3e2b')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#c4714a')}
                        >
                            Nájsť kouča
                        </Link>
                    </div>
                </div>
            </div>
        </PulseLayout>
    );
}
