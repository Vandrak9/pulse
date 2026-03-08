import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';

interface BroadcastRecord {
    id: number;
    content: string;
    message_type: string;
    sent_at: string | null;
    created_at: string;
    total_recipients: number;
    read_count: number;
    open_rate: number;
}

interface Props {
    broadcasts: BroadcastRecord[];
    subscriber_count: number;
}

export default function BroadcastPage({ broadcasts, subscriber_count }: Props) {
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({ content: '' });

    const handleSend = () => {
        post('/dashboard/broadcast', {
            onSuccess: () => {
                reset('content');
                setShowConfirm(false);
            },
        });
    };

    const formatDate = (str: string) => new Intl.DateTimeFormat('sk-SK', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(str));

    return (
        <PulseLayout>
            <Head title="Broadcast" />
            <div style={{ background: '#faf6f0', minHeight: '100vh', paddingBottom: 80 }}>
                <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
                    {/* Header */}
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#2d2118', marginBottom: 6 }}>
                            📢 Broadcast
                        </h1>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#fce8de', borderRadius: 999,
                            padding: '4px 14px', fontSize: 14, color: '#c4714a', fontWeight: 600
                        }}>
                            <span>👥</span>
                            <span>Odošle sa {subscriber_count} predplatiteľom</span>
                        </div>
                    </div>

                    {/* Composer */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e8d9c4', padding: 20, marginBottom: 24 }}>
                        <textarea
                            value={data.content}
                            onChange={e => setData('content', e.target.value)}
                            placeholder="Napíš správu všetkým predplatiteľom..."
                            rows={4}
                            style={{
                                width: '100%', border: '1px solid #e8d9c4', borderRadius: 12,
                                padding: '12px 14px', fontSize: 15, outline: 'none',
                                resize: 'vertical', background: '#faf6f0', color: '#2d2118',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                            <span style={{ fontSize: 12, color: data.content.length > 900 ? '#c4714a' : '#9a8a7a' }}>
                                {data.content.length}/1000
                            </span>
                            <button
                                onClick={() => data.content.trim() && setShowConfirm(true)}
                                disabled={!data.content.trim() || processing}
                                style={{
                                    background: data.content.trim() ? '#c4714a' : '#e8d9c4',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 999,
                                    padding: '10px 24px',
                                    fontWeight: 700,
                                    fontSize: 15,
                                    cursor: data.content.trim() ? 'pointer' : 'default',
                                }}
                            >
                                📢 Odoslať všetkým
                            </button>
                        </div>
                        {errors.content && <div style={{ color: '#e53e3e', fontSize: 13, marginTop: 6 }}>{errors.content}</div>}
                    </div>

                    {/* Preview */}
                    {data.content && (
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 12, color: '#9a8a7a', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Náhľad správy
                            </div>
                            <div style={{ background: 'white', borderRadius: 16, border: '2px dashed #e8d9c4', padding: 16 }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: '#fce8de', color: '#c4714a',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                                    }}>
                                        📢
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#9a8a7a', marginBottom: 4 }}>
                                            Hromadná správa
                                        </div>
                                        <div style={{
                                            background: 'white', border: '1.5px solid #c4714a',
                                            borderRadius: '0 14px 14px 14px',
                                            padding: '10px 14px', fontSize: 14, color: '#2d2118',
                                        }}>
                                            {data.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Broadcast history */}
                    <div>
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#2d2118', marginBottom: 12 }}>
                            História broadcastov
                        </h2>
                        {broadcasts.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#9a8a7a', fontSize: 14, padding: '32px 0' }}>
                                Zatiaľ žiadne odoslané správy
                            </div>
                        ) : (
                            broadcasts.map(b => (
                                <div key={b.id} style={{
                                    background: 'white', borderRadius: 12, border: '1px solid #e8d9c4',
                                    padding: '14px 16px', marginBottom: 10,
                                }}>
                                    <div style={{ fontSize: 14, color: '#2d2118', marginBottom: 8, lineHeight: '1.4' }}>
                                        {b.content.length > 100 ? b.content.substring(0, 100) + '...' : b.content}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9a8a7a' }}>
                                            <span>📤 {b.total_recipients} odoslaných</span>
                                            <span>👁 {b.read_count} prečítaných ({b.open_rate}%)</span>
                                        </div>
                                        <span style={{ fontSize: 11, color: '#9a8a7a' }}>
                                            {b.sent_at ? formatDate(b.sent_at) : formatDate(b.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation modal */}
            {showConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, padding: 20,
                }}>
                    <div style={{
                        background: 'white', borderRadius: 20, padding: 28,
                        maxWidth: 360, width: '100%', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📢</div>
                        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#2d2118', marginBottom: 8 }}>
                            Naozaj odoslať?
                        </h3>
                        <p style={{ color: '#9a8a7a', fontSize: 14, marginBottom: 24 }}>
                            Správa sa odošle <strong style={{ color: '#2d2118' }}>{subscriber_count} predplatiteľom</strong>. Táto akcia sa nedá vrátiť.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 999,
                                    border: '1px solid #e8d9c4', background: 'white',
                                    color: '#2d2118', fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                Zrušiť
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={processing}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 999,
                                    border: 'none', background: '#c4714a',
                                    color: 'white', fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                {processing ? 'Odosielam...' : 'Áno, odoslať'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PulseLayout>
    );
}
