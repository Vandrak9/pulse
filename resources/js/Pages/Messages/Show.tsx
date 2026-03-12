import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import PulseLayout from '@/Layouts/PulseLayout';
import Avatar from '@/Components/Avatar';
import { getInitials, formatChatDate, formatTime, formatDuration, isSameDay, relativeTime } from '@/lib/utils';

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
    media_mime_type: string | null;
}

interface Partner {
    id: number;
    name: string;
    role: string;
    avatar: string | null;
    is_verified: boolean;
}

interface Conversation {
    partner_id: number;
    partner_name: string;
    partner_role: string;
    partner_avatar: string | null;
    last_message: { content: string; created_at: string; is_mine: boolean; message_type: string } | null;
    unread_count: number;
}

interface Props {
    partner: Partner;
    messages: Message[];
    conversations: Conversation[];
}

type VoiceState = 'idle' | 'recording' | 'uploading';

// ── Helpers ────────────────────────────────────────────────────────────────────
// formatTime, formatChatDate, isSameDay, getInitials, formatDuration → imported from @/lib/utils

function getSupportedMimeType(): string {
    const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
    return types.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
}

function mimeToExtension(mime: string): string {
    if (mime.includes('mp4')) return 'mp4';
    if (mime.includes('ogg')) return 'ogg';
    return 'webm';
}

// Deterministic pseudo-random heights for waveform bars (seeded by message id)
function waveformBars(seed: number, count = 24): number[] {
    return Array.from({ length: count }, (_, i) => {
        const n = Math.abs(Math.sin(seed * 9301 + i * 49297 + 233));
        return Math.round(n * 16 + 4); // 4–20 px
    });
}

// ── VoiceBubble component ─────────────────────────────────────────────────────

function VoiceBubble({ msg }: { msg: Message }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const bars = useMemo(() => waveformBars(msg.id), [msg.id]);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const btnBg  = msg.is_mine ? 'rgba(255,255,255,0.2)' : '#fce8de';
    const barCol = msg.is_mine ? 'rgba(255,255,255,0.75)' : '#c4714a';
    const metaCol = msg.is_mine ? 'rgba(255,255,255,0.65)' : '#9a8a7a';
    const iconCol = msg.is_mine ? 'white' : '#c4714a';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220 }}>
            {/* Play / Pause button */}
            <button
                onClick={toggle}
                style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: btnBg, border: 'none', cursor: 'pointer',
                    flexShrink: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, color: iconCol,
                }}
            >
                {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Waveform + duration */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 24 }}>
                    {bars.map((h, i) => (
                        <div key={i} style={{
                            width: 3, borderRadius: 2,
                            background: barCol,
                            height: h,
                            flexShrink: 0,
                        }} />
                    ))}
                </div>
                {msg.media_duration != null && (
                    <div style={{ fontSize: 11, color: metaCol, marginTop: 3 }}>
                        {formatDuration(msg.media_duration)}
                    </div>
                )}
            </div>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                preload="none"
                onEnded={() => setIsPlaying(false)}
            >
                {msg.media_mime_type && msg.media_path && (
                    <source src={msg.media_path} type={msg.media_mime_type} />
                )}
                {msg.media_path && <source src={msg.media_path} />}
            </audio>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MessagesShow({ partner, messages: initialMessages, conversations }: Props) {
    const [messages, setMessages]         = useState<Message[]>(initialMessages);
    const [input, setInput]               = useState('');
    const [sending, setSending]           = useState(false);
    const [progress, setProgress]         = useState(0);
    const [toast, setToast]               = useState<{ text: string; type: 'error' | 'info' } | null>(null);
    const [voiceState, setVoiceState]     = useState<VoiceState>('idle');
    const [recordingSec, setRecordingSec] = useState(0);
    const [preview, setPreview]           = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const [lightbox, setLightbox]         = useState<string | null>(null);

    const bottomRef        = useRef<HTMLDivElement>(null);
    const inputRef         = useRef<HTMLTextAreaElement>(null);
    const mediaFileRef     = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef        = useRef<Blob[]>([]);
    const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
    const streamRef        = useRef<MediaStream | null>(null);
    const recordingSecRef  = useRef(0);
    const lastMsgCountRef  = useRef(initialMessages.length);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // 5-second poll: reload messages + detect new ones for push notification
    useEffect(() => {
        const interval = setInterval(() => {
            if (voiceState === 'idle' && !sending) router.reload({ only: ['messages'] });
        }, 5000);
        return () => clearInterval(interval);
    }, [voiceState, sending]);

    useEffect(() => {
        const prev = lastMsgCountRef.current;
        const newMessages = messages.slice(prev);
        lastMsgCountRef.current = messages.length;

        // Push notification for new incoming messages when tab is hidden
        if (newMessages.length > 0 && document.hidden) {
            const incoming = newMessages.filter(m => !m.is_mine);
            if (incoming.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
                const last = incoming[incoming.length - 1];
                const body = last.message_type === 'voice' ? '🎤 Hlasová správa' :
                             last.message_type === 'image' ? '📷 Fotka' :
                             last.message_type === 'video' ? '🎥 Video' :
                             last.content.substring(0, 80);
                const n = new Notification(`Nová správa od ${partner.name}`, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                });
                n.onclick = () => { window.focus(); n.close(); };
            }
        }
    }, [messages]);

    useEffect(() => { setMessages(initialMessages); }, [initialMessages]);

    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Close lightbox on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Request push notification permission once (on mount if not yet decided)
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            // Don't ask immediately — request when user sends first message
        }
    }, []);

    const showToast = (text: string, type: 'error' | 'info' = 'error') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Request notification permission (called on first user action) ──────────
    const requestNotificationPermission = () => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    };

    // ── Text send ──────────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim() || sending) return;
        requestNotificationPermission();
        setSending(true);
        router.post(`/messages/${partner.id}`, { content: input.trim() }, {
            preserveScroll: true,
            onSuccess: () => { setInput(''); setSending(false); },
            onError: (errs) => {
                setSending(false);
                const msg = (errs as Record<string, string>).access ?? Object.values(errs)[0] as string;
                if (msg) showToast(msg, 'error');
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ── Media upload via axios ─────────────────────────────────────────────────
    const MAX_SIZE_GALLERY = 80 * 1024 * 1024;   // 80MB for gallery picks
    const MAX_SIZE_CAMERA  = 80 * 1024 * 1024;   // 80MB for camera/HEIC (compressed before upload, matches server max:81920)

    // Client-side image compression: resize to max 1920px, convert to JPEG 85%
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const MAX = 1920;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        const compressed = new File(
                            [blob],
                            file.name.replace(/\.[^.]+$/, '.jpg'),
                            { type: 'image/jpeg' }
                        );
                        resolve(compressed);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        });
    };

    const sendMedia = useCallback(async (file: File, type: 'image' | 'video' | 'voice', durationSec?: number) => {
        const limit = MAX_SIZE_CAMERA; // already validated before calling sendMedia
        if (file.size > limit) { showToast(`Súbor je príliš veľký (${Math.round(file.size/1024/1024)}MB, max 100MB)`); return; }

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
        const formData = new FormData();
        formData.append('media', file);
        formData.append('message_type', type);
        if (durationSec) formData.append('voice_duration', String(durationSec));

        requestNotificationPermission();
        setSending(true);
        setProgress(0);

        try {
            const res = await axios.post<{ ok: boolean; message: Message }>(
                `/messages/${partner.id}`,
                formData,
                {
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                        // Content-Type omitted — axios sets multipart/form-data with boundary
                    },
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
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 403) showToast(err.response?.data?.error ?? 'Nemáš povolenie písať tejto osobe');
            else if (status === 422) showToast('Nepodporovaný formát súboru');
            else if (status === 413) showToast('Súbor je príliš veľký (max 50MB)');
            else showToast('Nahrávanie zlyhalo, skús znova');
        } finally {
            setSending(false);
            setProgress(0);
            setPreview(null);
        }
    }, [partner.id]);

    // ── Image + video picker ───────────────────────────────────────────────────
    const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/') || file.type === 'image/heic' || file.type === 'image/heif';
        const isVideo = file.type.startsWith('video/');
        const isCamera = file.name.startsWith('IMG_') || file.type === 'image/heic' || file.type === 'image/heif';
        const sizeLimit = isCamera ? MAX_SIZE_CAMERA : MAX_SIZE_GALLERY;


        if (file.size > sizeLimit) {
            showToast(`Súbor je príliš veľký (${Math.round(file.size/1024/1024)}MB, max 80MB)`);
            e.target.value = '';
            return;
        }

        const type: 'image' | 'video' | null = isImage ? 'image' : isVideo ? 'video' : null;
        if (!type) { showToast('Nepodporovaný formát'); e.target.value = ''; return; }

        let fileToUpload = file;
        if (isImage) {
            showToast('Komprimujem obrázok…', 'info');
            fileToUpload = await compressImage(file);
        }

        const previewUrl = URL.createObjectURL(fileToUpload);
        setPreview({ url: previewUrl, type });
        await sendMedia(fileToUpload, type);
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
        recordingSecRef.current = 0;
        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const actualMime = mimeType || 'audio/webm';
            const blob = new Blob(chunksRef.current, { type: actualMime });
            const ext  = mimeToExtension(actualMime);
            const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: actualMime });
            setVoiceState('uploading');
            await sendMedia(file, 'voice', recordingSecRef.current);
            setVoiceState('idle');
            setRecordingSec(0);
            recordingSecRef.current = 0;
        };
        recorder.start(200);
        setVoiceState('recording');
        setRecordingSec(0);
        timerRef.current = setInterval(() => {
            recordingSecRef.current += 1;
            setRecordingSec(recordingSecRef.current);
            if (recordingSecRef.current >= 300) stopRecording();
        }, 1000);
    };

    const stopRecording = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    };

    const cancelRecording = () => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            if (mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        chunksRef.current = [];
        setVoiceState('idle');
        setRecordingSec(0);
        recordingSecRef.current = 0;
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <PulseLayout hideFooter>
            <Head title={`Správy — ${partner.name}`} />

            {/* Lightbox (fixed — works for both mobile + desktop) */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
                        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <img
                        src={lightbox}
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        alt="Náhľad"
                    />
                    {/* Close */}
                    <button
                        onClick={() => setLightbox(null)}
                        style={{
                            position: 'absolute', top: 16, right: 16,
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            color: 'white', fontSize: 26, width: 44, height: 44,
                            borderRadius: '50%', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>
                    {/* Download */}
                    <a
                        href={lightbox}
                        download
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute', bottom: 20, right: 20,
                            background: 'rgba(255,255,255,0.18)', color: 'white',
                            padding: '8px 18px', borderRadius: 24, fontSize: 13,
                            textDecoration: 'none',
                        }}
                    >
                        Stiahnuť
                    </a>
                </div>
            )}

            {/* Two-panel layout: flex row. Left = conversation list (desktop only). Right = chat. */}
            <div className="chat-panel" style={{ display: 'flex', height: '100dvh', background: '#faf6f0' }}>

                {/* Left panel — conversation list (desktop only) */}
                <div className="hidden md:flex" style={{
                    width: 360, flexShrink: 0, flexDirection: 'column',
                    borderRight: '1px solid #e8d9c4', background: 'white', height: '100dvh',
                }}>
                    <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #e8d9c4', flexShrink: 0 }}>
                        <a href="/messages" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#c4714a', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                            ← Správy
                        </a>
                        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#2d2118', margin: 0 }}>Konverzácie</h2>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.length === 0 ? (
                            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9a8a7a', fontSize: 14 }}>Žiadne konverzácie</div>
                        ) : conversations.map(conv => {
                            const isActive = conv.partner_id === partner.id;
                            const preview = conv.last_message
                                ? (conv.last_message.message_type === 'voice' ? '🎤 Hlasová správa' :
                                   conv.last_message.message_type === 'image' ? '📷 Fotka' :
                                   conv.last_message.message_type === 'video' ? '🎥 Video' :
                                   conv.last_message.content)
                                : 'Začni konverzáciu';
                            return (
                                <a key={conv.partner_id} href={`/messages/${conv.partner_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                    <div
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                            background: isActive ? '#fce8de' : 'white',
                                            borderBottom: '1px solid #f0e8df',
                                            borderLeft: isActive ? '3px solid #c4714a' : '3px solid transparent',
                                            transition: 'background 0.15s', cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#faf6f0'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}
                                    >
                                        <Avatar src={conv.partner_avatar} name={conv.partner_name} size={40} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                <span style={{ fontWeight: isActive ? 600 : conv.unread_count > 0 ? 700 : 500, fontSize: 13, color: isActive ? '#c4714a' : '#2d2118' }}>
                                                    {conv.partner_name}
                                                </span>
                                                {conv.last_message && <span style={{ fontSize: 10, color: '#9a8a7a' }}>{relativeTime(conv.last_message.created_at)}</span>}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 12, color: '#9a8a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                    {conv.last_message?.is_mine ? 'Ty: ' : ''}{preview}
                                                </span>
                                                {conv.unread_count > 0 && (
                                                    <span style={{ background: '#c4714a', color: 'white', borderRadius: 999, minWidth: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, padding: '0 4px', marginLeft: 6, flexShrink: 0 }}>
                                                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Right panel — chat (fills remaining space) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100dvh' }}>

                {/* Top bar */}
                <div style={{
                    background: 'white', borderBottom: '1px solid #e8d9c4',
                    padding: '12px 16px', display: 'flex', alignItems: 'center',
                    gap: 12, flexShrink: 0, zIndex: 10,
                }}>
                    <a href="/messages" className="md:hidden" style={{ color: '#c4714a', fontSize: 22, textDecoration: 'none', lineHeight: 1 }}>←</a>
                    <Avatar src={partner.avatar} name={partner.name} size={40} />
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
                        const isImage = msg.message_type === 'image' && !!msg.media_path;
                        return (
                            <React.Fragment key={msg.id}>
                                {showDateSep && (
                                    <div style={{ textAlign: 'center', margin: '16px 0 8px', color: '#9a8a7a', fontSize: 12 }}>
                                        {formatChatDate(msg.created_at)}
                                    </div>
                                )}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: msg.is_mine ? 'flex-end' : 'flex-start',
                                    marginBottom: 6,
                                }}>
                                    <div style={{ maxWidth: '72%' }}>
                                        <div style={{
                                            padding: isImage ? '4px' : '10px 14px',
                                            borderRadius: msg.is_mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                            background: msg.is_mine ? '#c4714a' : 'white',
                                            color: msg.is_mine ? 'white' : '#2d2118',
                                            fontSize: 15, lineHeight: '1.45',
                                            boxShadow: msg.is_mine ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
                                            wordBreak: 'break-word',
                                            cursor: isImage ? 'zoom-in' : 'default',
                                        }}
                                            onClick={isImage ? () => setLightbox(msg.media_path!) : undefined}
                                        >
                                            {msg.message_type === 'image' ? (
                                                msg.media_path ? (
                                                    <img
                                                        src={msg.media_path}
                                                        alt="Obrázok"
                                                        style={{ maxWidth: 240, maxHeight: 320, borderRadius: 14, display: 'block', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: 13, opacity: 0.7 }}>🖼️ Obrázok</span>
                                                )
                                            ) : msg.message_type === 'video' ? (
                                                msg.media_path ? (
                                                    <video
                                                        src={msg.media_path}
                                                        controls
                                                        preload="metadata"
                                                        style={{ maxWidth: 240, borderRadius: 14, display: 'block' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: 13, opacity: 0.7 }}>🎥 Video</span>
                                                )
                                            ) : msg.message_type === 'voice' ? (
                                                msg.media_path ? (
                                                    <VoiceBubble msg={msg} />
                                                ) : (
                                                    <span style={{ fontSize: 13, opacity: 0.7 }}>🎤 Hlasová správa</span>
                                                )
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: 11, color: '#9a8a7a', marginTop: 3,
                                            textAlign: msg.is_mine ? 'right' : 'left',
                                            paddingLeft: msg.is_mine ? 0 : 4,
                                            paddingRight: msg.is_mine ? 4 : 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            justifyContent: msg.is_mine ? 'flex-end' : 'flex-start',
                                        }}>
                                            {formatTime(msg.created_at)}
                                            {msg.is_mine && (
                                                <span style={{
                                                    fontSize: 12,
                                                    color: msg.is_read ? '#c4714a' : '#9a8a7a',
                                                    fontWeight: msg.is_read ? 600 : 400,
                                                    letterSpacing: '-1px',
                                                }}>
                                                    {msg.is_read ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Toast */}
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
                {sending && progress > 0 && (
                    <div style={{ height: 3, background: '#e8d9c4', flexShrink: 0 }}>
                        <div style={{ height: '100%', background: '#c4714a', width: `${progress}%`, transition: 'width 0.15s' }} />
                    </div>
                )}

                {/* File preview */}
                {preview && (
                    <div style={{
                        background: 'white', borderTop: '1px solid #e8d9c4',
                        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                    }}>
                        {preview.type === 'image' ? (
                            <img src={preview.url} style={{ height: 56, borderRadius: 8, objectFit: 'cover' }} alt="náhľad" />
                        ) : (
                            <div style={{ fontSize: 13, color: '#9a8a7a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>🎥</span> Video pripravené na odoslanie…
                            </div>
                        )}
                        {sending && <span style={{ fontSize: 12, color: '#9a8a7a', marginLeft: 'auto' }}>{progress}%</span>}
                    </div>
                )}

                {/* Hidden file input */}
                <input
                    ref={mediaFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/webp,video/mp4,video/mov,video/quicktime"
                    style={{ display: 'none' }}
                    onChange={handleMediaFileChange}
                />

                {/* Bottom input bar */}
                <div style={{
                    background: 'white', borderTop: '1px solid #e8d9c4',
                    padding: '10px 16px', display: 'flex', alignItems: 'flex-end',
                    gap: 8, flexShrink: 0,
                }}>
                    {voiceState === 'recording' ? (
                        <>
                            <button
                                onClick={cancelRecording}
                                style={{
                                    padding: '0 14px', height: 36, borderRadius: 18,
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    fontSize: 13, color: '#9a8a7a', cursor: 'pointer', flexShrink: 0,
                                }}
                            >
                                Zruš
                            </button>
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                                border: '1px solid #e8d9c4', borderRadius: 20,
                                padding: '0 14px', height: 36, background: '#faf6f0',
                            }}>
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
                                    cursor: 'pointer', flexShrink: 0, fontSize: 16, color: 'white',
                                }}
                                title="Odoslať"
                            >
                                ■
                            </button>
                        </>
                    ) : voiceState === 'uploading' ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, color: '#9a8a7a', fontSize: 13, padding: '0 4px' }}>
                            <span>🎤</span> Odosielam hlasovú správu…
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => mediaFileRef.current?.click()}
                                disabled={sending}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: sending ? 'default' : 'pointer',
                                    flexShrink: 0, fontSize: 17, opacity: sending ? 0.4 : 1,
                                }}
                                title="Poslať obrázok alebo video"
                            >
                                🖼️
                            </button>

                            <button
                                onClick={startRecording}
                                disabled={sending}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: '#faf6f0', border: '1px solid #e8d9c4',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: sending ? 'default' : 'pointer',
                                    flexShrink: 0, fontSize: 17, opacity: sending ? 0.4 : 1,
                                }}
                                title="Nahrať hlasovú správu"
                            >
                                🎤
                            </button>

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
                                    padding: '8px 14px', fontSize: 15, outline: 'none',
                                    resize: 'none', background: '#faf6f0', color: '#2d2118',
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
                            >
                                ↑
                            </button>
                        </>
                    )}
                </div>
                </div> {/* end right panel */}
            </div> {/* end two-panel wrapper */}

            <style>{`
                @keyframes pulse-red {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.35; transform: scale(0.75); }
                }
                html, body { overflow: hidden; height: 100%; }
                @media (max-width: 767px) {
                    .chat-panel { height: calc(100dvh - 56px) !important; }
                    .chat-panel > * { height: calc(100dvh - 56px) !important; }
                }
            `}</style>
        </PulseLayout>
    );
}
