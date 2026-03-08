import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
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

type VoiceState = 'idle' | 'recording' | 'uploading';

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
    const da = new Date(a); const db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
           da.getMonth() === db.getMonth() &&
           da.getDate() === db.getDate();
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatDuration(sec: number): string {
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function MessagesShow({ partner, messages: initialMessages }: Props) {
    const [messages, setMessages]       = useState<Message[]>(initialMessages);
    const [input, setInput]             = useState('');
    const [sending, setSending]         = useState(false);
    const [progress, setProgress]       = useState(0);
    const [toast, setToast]             = useState<{ text: string; type: 'error' | 'info' } | null>(null);
    const [voiceState, setVoiceState]   = useState<VoiceState>('idle');
    const [recordingSec, setRecordingSec] = useState(0);
    const [preview, setPreview]         = useState<{ url: string; type: string } | null>(null);

    const bottomRef       = useRef<HTMLDivElement>(null);
    const inputRef        = useRef<HTMLTextAreaElement>(null);
    const imageRef        = useRef<HTMLInputElement>(null);
    const videoRef        = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef        = useRef<Blob[]>([]);
    const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
    const streamRef        = useRef<MediaStream | null>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Poll for new messages every 5 seconds (skip while recording)
    useEffect(() => {
        const interval = setInterval(() => {
            if (voiceState === 'idle' && !sending) {
                router.reload({ only: ['messages'] });
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [voiceState, sending]);

    // Sync messages from Inertia reload
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    // Cleanup mic stream on unmount
    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const showToast = (text: string, type: 'error' | 'info' = 'error') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Text send ──────────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim() || sending) return;
        setSending(true);
        router.post(
            `/messages/${partner.id}`,
            { content: input.trim() },
            {
                preserveScroll: true,
                onSuccess: () => { setInput(''); setSending(false); },
                onError: () => setSending(false),
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Media upload via axios ─────────────────────────────────────────────────
    const sendMedia = useCallback(async (file: File, type: string, durationSec?: number) => {
        if (file.size > 52428800) { showToast('Súbor je príliš veľký (max 50MB)'); return; }

        const formData = new FormData();
        formData.append('media', file);
        formData.append('message_type', type);
        if (durationSec) formData.append('voice_duration', String(durationSec));

        setSending(true);
        setProgress(0);

        try {
            const res = await axios.post<{ ok: boolean; message: Message }>(
                `/messages/${partner.id}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (e) => {
                        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
                    },
                }
            );
            if (res.data?.ok && res.data.message) {
                setMessages(prev => [...prev, res.data.message]);
            } else {
                router.reload({ only: ['messages'] });
            }
        } catch {
            showToast('Nahrávanie zlyhalo, skús znova');
        } finally {
            setSending(false);
            setProgress(0);
            setPreview(null);
        }
    }, [partner.id]);

    // ── Image / Video file picker ──────────────────────────────────────────────
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = type === 'image'
            ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            : ['video/mp4', 'video/mov', 'video/webm', 'video/quicktime'];

        if (!allowed.includes(file.type)) {
            showToast('Nepodporovaný formát');
            e.target.value = '';
            return;
        }

        // Show preview
        const previewUrl = URL.createObjectURL(file);
        setPreview({ url: previewUrl, type });

        await sendMedia(file, type);
        URL.revokeObjectURL(previewUrl);
        e.target.value = '';
    };

    // ── Voice recording ────────────────────────────────────────────────────────
    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            showToast('Tvoj prehliadač nepodporuje nahrávanie');
            return;
        }

        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            showToast('Povoľ mikrofón v nastaveniach prehliadača');
            return;
        }

        streamRef.current = stream;
        chunksRef.current = [];

        // Pick best supported mimeType
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', '']
            .find(m => m === '' || MediaRecorder.isTypeSupported(m)) ?? '';

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type });
            setVoiceState('uploading');
            await sendMedia(file, 'voice', recordingSec);
            setVoiceState('idle');
            setRecordingSec(0);
        };

        recorder.start(200); // collect chunks every 200ms
        setVoiceState('recording');
        setRecordingSec(0);

        timerRef.current = setInterval(() => {
            setRecordingSec(s => {
                if (s >= 299) { stopRecording(); return s; } // max 5 min
                return s + 1;
            });
        }, 1000);
    };

    const stopRecording = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const cancelRecording = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        chunksRef.current = [];
        setVoiceState('idle');
        setRecordingSec(0);
    };

    const isUploading = voiceState === 'uploading' || (sending && progress > 0);

    return (
        <PulseLayout>
            <Head title={`Správy — ${partner.name}`} />
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#faf6f0' }}>

                {/* Top bar */}
                <div style={{
                    background: 'white', borderBottom: '1px solid #e8d9c4',
                    padding: '12px 16px', display: 'flex', alignItems: 'center',
                    gap: 12, flexShrink: 0, zIndex: 10,
                }}>
                    <a href="/messages" style={{ color: '#c4714a', fontSize: 22, textDecoration: 'none', lineHeight: 1 }}>←</a>
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
                                <div style={{ display: 'flex', justifyContent: msg.is_mine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                                    <div style={{ maxWidth: '72%' }}>
                                        <div style={{
                                            padding: msg.message_type === 'image' ? '4px' : '10px 14px',
                                            borderRadius: msg.is_mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: msg.is_mine ? '#c4714a' : 'white',
                                            color: msg.is_mine ? 'white' : '#2d2118',
                                            fontSize: 15, lineHeight: '1.45',
                                            boxShadow: msg.is_mine ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
                                            wordBreak: 'break-word',
                                        }}>
                                            {msg.message_type === 'image' && msg.media_path ? (
                                                <img
                                                    src={msg.media_path}
                                                    alt="Obrázok"
                                                    style={{ maxWidth: 240, maxHeight: 320, borderRadius: 14, display: 'block', objectFit: 'cover' }}
                                                />
                                            ) : msg.message_type === 'video' && msg.media_path ? (
                                                <video
                                                    src={msg.media_path}
                                                    controls
                                                    style={{ maxWidth: 240, borderRadius: 14, display: 'block' }}
                                                />
                                            ) : msg.message_type === 'voice' && msg.media_path ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
                                                    <span style={{ fontSize: 18 }}>🎤</span>
                                                    <audio src={msg.media_path} controls style={{ height: 32, flex: 1 }} />
                                                    {msg.media_duration != null && (
                                                        <span style={{ fontSize: 12, opacity: 0.75 }}>{formatDuration(msg.media_duration)}</span>
                                                    )}
                                                </div>
                                            ) : msg.message_type === 'voice' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
                                                    <span style={{ fontSize: 18 }}>🎤</span>
                                                    <span style={{ fontSize: 13 }}>Hlasová správa</span>
                                                    {msg.media_duration != null && (
                                                        <span style={{ fontSize: 12, opacity: 0.75 }}>{formatDuration(msg.media_duration)}</span>
                                                    )}
                                                </div>
                                            ) : msg.message_type === 'video' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: 18 }}>🎥</span>
                                                    <span style={{ fontSize: 13 }}>Video</span>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 11, color: '#9a8a7a', marginTop: 3,
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

                {/* Toast notification */}
                {toast && (
                    <div style={{
                        background: toast.type === 'error' ? '#fff3cd' : '#d1ecf1',
                        border: `1px solid ${toast.type === 'error' ? '#ffc107' : '#bee5eb'}`,
                        padding: '8px 16px', fontSize: 13,
                        color: toast.type === 'error' ? '#856404' : '#0c5460',
                        textAlign: 'center', flexShrink: 0,
                    }}>
                        {toast.text}
                    </div>
                )}

                {/* Upload progress bar */}
                {isUploading && progress > 0 && (
                    <div style={{ height: 3, background: '#e8d9c4', flexShrink: 0 }}>
                        <div style={{
                            height: '100%', background: '#c4714a',
                            width: `${progress}%`, transition: 'width 0.2s',
                        }} />
                    </div>
                )}

                {/* Image preview */}
                {preview && (
                    <div style={{
                        background: 'white', borderTop: '1px solid #e8d9c4',
                        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                    }}>
                        {preview.type === 'image' ? (
                            <img src={preview.url} style={{ height: 60, borderRadius: 8, objectFit: 'cover' }} alt="preview" />
                        ) : (
                            <div style={{ fontSize: 13, color: '#9a8a7a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>🎥</span> Nahrávanie videa…
                            </div>
                        )}
                        {sending && <span style={{ fontSize: 12, color: '#9a8a7a' }}>{progress}%</span>}
                    </div>
                )}

                {/* Hidden file inputs */}
                <input ref={imageRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                    onChange={e => handleFileChange(e, 'image')} />
                <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }}
                    onChange={e => handleFileChange(e, 'video')} />

                {/* Bottom input bar */}
                <div style={{
                    background: 'white', borderTop: '1px solid #e8d9c4',
                    padding: '10px 16px', display: 'flex', alignItems: 'flex-end',
                    gap: 8, flexShrink: 0,
                }}>
                    {voiceState === 'recording' ? (
                        /* ── Recording UI ── */
                        <>
                            <button
                                onClick={cancelRecording}
                                style={{
                                    padding: '0 12px', height: 36, borderRadius: 18,
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    fontSize: 13, color: '#9a8a7a', cursor: 'pointer', flexShrink: 0,
                                }}
                            >
                                Zruš
                            </button>
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                                border: '1px solid #e8d9c4', borderRadius: 20, padding: '0 14px', height: 36,
                                background: '#faf6f0',
                            }}>
                                {/* Pulsing red dot */}
                                <span style={{
                                    width: 10, height: 10, borderRadius: '50%', background: '#e53e3e',
                                    display: 'inline-block', flexShrink: 0,
                                    animation: 'pulse-red 1s ease-in-out infinite',
                                }} />
                                <span style={{ fontSize: 13, color: '#2d2118', fontVariantNumeric: 'tabular-nums' }}>
                                    {formatDuration(recordingSec)}
                                </span>
                                <span style={{ fontSize: 12, color: '#9a8a7a', flex: 1 }}>Nahrávam…</span>
                            </div>
                            <button
                                onClick={stopRecording}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#c4714a', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', flexShrink: 0, fontSize: 18, color: 'white',
                                }}
                                title="Odoslať hlasovú správu"
                            >
                                ■
                            </button>
                        </>
                    ) : voiceState === 'uploading' ? (
                        /* ── Uploading voice UI ── */
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, color: '#9a8a7a', fontSize: 13 }}>
                            <span>🎤</span> Nahrávam hlasovú správu…
                        </div>
                    ) : (
                        /* ── Normal input UI ── */
                        <>
                            <button
                                onClick={() => imageRef.current?.click()}
                                disabled={sending}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: sending ? 'default' : 'pointer', flexShrink: 0, fontSize: 16,
                                    opacity: sending ? 0.4 : 1,
                                }}
                                title="Poslať obrázok"
                            >📷</button>

                            <button
                                onClick={() => videoRef.current?.click()}
                                disabled={sending}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: sending ? 'default' : 'pointer', flexShrink: 0, fontSize: 16,
                                    opacity: sending ? 0.4 : 1,
                                }}
                                title="Poslať video"
                            >🎥</button>

                            <button
                                onClick={startRecording}
                                disabled={sending}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: sending ? 'default' : 'pointer', flexShrink: 0, fontSize: 16,
                                    opacity: sending ? 0.4 : 1,
                                }}
                                title="Nahrať hlasovú správu"
                            >🎤</button>

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
                                    flex: 1, border: '1px solid #e8d9c4', borderRadius: 20,
                                    padding: '8px 14px', fontSize: 15, outline: 'none', resize: 'none',
                                    background: '#faf6f0', color: '#2d2118',
                                    maxHeight: 120, overflowY: 'auto', lineHeight: '1.45',
                                }}
                            />

                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: input.trim() && !sending ? '#c4714a' : '#e8d9c4',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: input.trim() && !sending ? 'pointer' : 'default',
                                    flexShrink: 0, transition: 'background 0.2s',
                                    color: 'white', fontSize: 16,
                                }}
                            >↑</button>
                        </>
                    )}
                </div>
            </div>

            {/* Keyframe for pulsing red dot */}
            <style>{`
                @keyframes pulse-red {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
            `}</style>
        </PulseLayout>
    );
}
