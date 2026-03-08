import React, { useState, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';

interface Message {
    id: number;
    content: string;
    is_mine: boolean;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    message_type: string;
    media_path: string | null;
    media_thumbnail: string | null;
    media_duration: number | null;
}

interface Partner {
    id: number;
    name: string;
    role: string;
    avatar: string | null;
    is_verified: boolean;
}

interface Props {
    partner: Partner;
    messages: Message[];
}

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('sk-SK', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDate.getTime() === today.getTime()) return 'Dnes';
    if (msgDate.getTime() === yesterday.getTime()) return 'Včera';
    return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long' }).format(date);
}

function isSameDay(a: string, b: string): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
           da.getMonth() === db.getMonth() &&
           da.getDate() === db.getDate();
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function MessagesShow({ partner, messages: initialMessages }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Poll for new messages every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['messages'] });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Update messages when Inertia reloads
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    const handleSend = () => {
        if (!input.trim() || sending) return;
        setSending(true);
        router.post(
            `/messages/${partner.id}`,
            { content: input.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setInput('');
                    setSending(false);
                },
                onError: () => setSending(false),
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <PulseLayout>
            <Head title={`Správy — ${partner.name}`} />
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#faf6f0' }}>

                {/* Top bar */}
                <div style={{
                    background: 'white',
                    borderBottom: '1px solid #e8d9c4',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexShrink: 0,
                    zIndex: 10,
                }}>
                    <a
                        href="/messages"
                        style={{ color: '#c4714a', fontSize: 22, textDecoration: 'none', lineHeight: 1 }}
                    >
                        ←
                    </a>
                    {partner.avatar ? (
                        <img src={partner.avatar} alt={partner.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: '#fce8de', color: '#c4714a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14,
                        }}>
                            {getInitials(partner.name)}
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#2d2118' }}>{partner.name}</div>
                        {partner.is_verified && (
                            <div style={{ fontSize: 11, color: '#4a7c59', fontWeight: 600 }}>Predplatené ✓</div>
                        )}
                    </div>
                </div>

                {/* Messages area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#9a8a7a', fontSize: 14, marginTop: 40 }}>
                            Začni konverzáciu s {partner.name} 👋
                        </div>
                    )}
                    {messages.map((msg, idx) => {
                        const showDateSep = idx === 0 || !isSameDay(messages[idx - 1].created_at, msg.created_at);
                        return (
                            <React.Fragment key={msg.id}>
                                {showDateSep && (
                                    <div style={{ textAlign: 'center', margin: '16px 0 8px', color: '#9a8a7a', fontSize: 12 }}>
                                        {formatDate(msg.created_at)}
                                    </div>
                                )}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: msg.is_mine ? 'flex-end' : 'flex-start',
                                    marginBottom: 6,
                                }}>
                                    <div style={{ maxWidth: '72%' }}>
                                        <div style={{
                                            padding: '10px 14px',
                                            borderRadius: msg.is_mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: msg.is_mine ? '#c4714a' : 'white',
                                            color: msg.is_mine ? 'white' : '#2d2118',
                                            fontSize: 15,
                                            lineHeight: '1.45',
                                            boxShadow: msg.is_mine ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
                                            wordBreak: 'break-word',
                                        }}>
                                            {msg.message_type === 'voice' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
                                                    <span style={{ fontSize: 20 }}>🎤</span>
                                                    <span style={{ fontSize: 13 }}>Hlasová správa</span>
                                                    {msg.media_duration && (
                                                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                                                            {Math.floor(msg.media_duration / 60)}:{String(msg.media_duration % 60).padStart(2, '0')}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : msg.message_type === 'image' && msg.media_path ? (
                                                <img
                                                    src={msg.media_path}
                                                    alt="Obrázok"
                                                    style={{ maxWidth: 240, borderRadius: 12, display: 'block' }}
                                                />
                                            ) : msg.message_type === 'video' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 20 }}>🎥</span>
                                                    <span style={{ fontSize: 13 }}>Video</span>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 11,
                                            color: '#9a8a7a',
                                            marginTop: 3,
                                            textAlign: msg.is_mine ? 'right' : 'left',
                                            paddingLeft: msg.is_mine ? 0 : 4,
                                            paddingRight: msg.is_mine ? 4 : 0,
                                        }}>
                                            {formatTime(msg.created_at)}
                                            {msg.is_mine && msg.is_read && ' ✓✓'}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Bottom input bar */}
                <div style={{
                    background: 'white',
                    borderTop: '1px solid #e8d9c4',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 10,
                    flexShrink: 0,
                }}>
                    {/* Attach media button placeholder */}
                    <button
                        style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#faf6f0', border: '1px solid #e8d9c4',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0, fontSize: 16,
                        }}
                        title="Priložiť médium (čoskoro)"
                    >
                        📎
                    </button>

                    {/* Text input */}
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Napíš správu..."
                        rows={1}
                        style={{
                            flex: 1,
                            border: '1px solid #e8d9c4',
                            borderRadius: 20,
                            padding: '8px 14px',
                            fontSize: 15,
                            outline: 'none',
                            resize: 'none',
                            background: '#faf6f0',
                            color: '#2d2118',
                            maxHeight: 120,
                            overflowY: 'auto',
                            lineHeight: '1.45',
                        }}
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: input.trim() ? '#c4714a' : '#e8d9c4',
                            border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: input.trim() ? 'pointer' : 'default',
                            flexShrink: 0,
                            transition: 'background 0.2s',
                            color: 'white',
                            fontSize: 16,
                        }}
                    >
                        ↑
                    </button>
                </div>
            </div>
        </PulseLayout>
    );
}
