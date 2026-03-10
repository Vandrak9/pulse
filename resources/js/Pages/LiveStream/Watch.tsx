import { Head } from '@inertiajs/react';
import MuxPlayer from '@mux/mux-player-react';
import { useState, useEffect, useRef, FormEventHandler } from 'react';
import axios from 'axios';
import { Send, Users, Lock, Globe, Radio, MessageCircle } from 'lucide-react';

interface ChatMessage {
    id: number;
    message: string;
    created_at: string;
    type?: 'system';
    user?: {
        id: number;
        name: string;
        role: string;
        is_coach?: boolean;
        avatar_url: string | null;
    };
}

interface Props {
    stream: {
        id: number;
        title: string;
        description: string | null;
        playback_id: string | null;
        status: 'idle' | 'active' | 'disabled';
        access: 'subscribers' | 'everyone';
        viewers_count: number;
        started_at: string | null;
    };
    coach: {
        id: number;
        name: string;
        specialization: string | null;
        avatar_url: string | null;
    };
    messages: ChatMessage[];
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const REACTIONS = ['👏', '💪', '🔥', '❤️', '😮'];

export default function Watch({ stream: initialStream, coach, messages: initialMessages }: Props) {
    const [streamStatus, setStreamStatus] = useState(initialStream.status);
    const [streamEnded, setStreamEnded] = useState(initialStream.status === 'disabled');
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [viewersCount, setViewersCount] = useState(initialStream.viewers_count);
    const [chatInput, setChatInput] = useState('');
    const [sending, setSending] = useState(false);
    const [connected, setConnected] = useState(false);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Join stream + subscribe to Reverb channel
    useEffect(() => {
        if (streamEnded) return;

        // Notify server we joined
        axios.post(`/live/${initialStream.id}/join`).catch(() => {});

        // Subscribe to Reverb channel
        const channel = window.Echo.channel(`live-stream.${initialStream.id}`);

        channel.listen('.chat.message', (data: ChatMessage) => {
            setMessages(prev => [...prev, data]);
        });

        channel.listen('.viewer.joined', (data: { viewer: { name: string }; viewers_count: number }) => {
            setViewersCount(data.viewers_count);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'system',
                message: `${data.viewer.name} sa pripojil 👋`,
                created_at: new Date().toISOString(),
            }]);
        });

        channel.listen('.viewer.left', (data: { viewers_count: number }) => {
            setViewersCount(data.viewers_count);
        });

        channel.subscribed(() => setConnected(true));

        // Fallback poll for stream status only (no messages — Reverb handles those)
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/live/${initialStream.id}/poll?last_message_id=0`);
                if (res.data.status !== streamStatus) setStreamStatus(res.data.status);
                if (res.data.status === 'disabled') {
                    setStreamEnded(true);
                    clearInterval(pollRef.current!);
                }
            } catch { /* silent */ }
        }, 10000);

        return () => {
            axios.post(`/live/${initialStream.id}/leave`).catch(() => {});
            window.Echo.leaveChannel(`live-stream.${initialStream.id}`);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [initialStream.id, streamEnded]);

    const sendMessage: FormEventHandler = async (e) => {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text || sending) return;

        setSending(true);
        setChatInput('');
        try {
            const res = await axios.post(`/live/${initialStream.id}/message`, { message: text });
            // Add own message immediately (others get it via Reverb)
            setMessages(prev => [...prev, res.data]);
        } catch {
            setChatInput(text);
        } finally {
            setSending(false);
        }
    };

    const sendReaction = (emoji: string) => {
        axios.post(`/live/${initialStream.id}/message`, { message: emoji }).catch(() => {});
    };

    return (
        <>
            <Head title={`${coach.name} — LIVE`} />

            <div className="flex flex-col lg:flex-row" style={{ height: '100dvh', background: '#111' }}>

                {/* ── VIDEO SIDE ─────────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col min-h-0">

                    {/* Top bar */}
                    <div className="flex items-center gap-3 px-4 py-3 shrink-0"
                        style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                        <a href={`/coaches/${coach.id}`} className="flex items-center gap-2.5">
                            {coach.avatar_url ? (
                                <img src={coach.avatar_url} alt={coach.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: '#c4714a' }}>
                                    {getInitials(coach.name)}
                                </div>
                            )}
                            <div>
                                <div className="text-white text-sm font-semibold leading-none">{coach.name}</div>
                                {coach.specialization && (
                                    <div className="text-xs mt-0.5" style={{ color: '#9a8a7a' }}>{coach.specialization}</div>
                                )}
                            </div>
                        </a>

                        <div className="ml-2">
                            {streamStatus === 'active' ? (
                                <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full" />LIVE
                                </span>
                            ) : streamStatus === 'idle' ? (
                                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                                    style={{ background: '#2a2a2a', color: '#9a8a7a' }}>
                                    <Radio size={12} />Čaká na stream...
                                </span>
                            ) : null}
                        </div>

                        <div className="ml-auto flex items-center gap-3 text-xs" style={{ color: '#9a8a7a' }}>
                            <span className="flex items-center gap-1"><Users size={13} />{viewersCount}</span>
                            <span className="flex items-center gap-1">
                                {initialStream.access === 'subscribers' ? <Lock size={13} /> : <Globe size={13} />}
                            </span>
                        </div>
                    </div>

                    {/* Video player */}
                    <div className="w-full bg-black" style={{ aspectRatio: '16/9' }}>
                        {streamEnded ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                                <div className="text-4xl mb-3">👋</div>
                                <p className="text-white text-lg font-semibold mb-1">Stream skončil</p>
                                <p className="text-sm mb-5" style={{ color: '#9a8a7a' }}>Ďakujeme za sledovanie!</p>
                                <a href={`/coaches/${coach.id}`}
                                    className="px-5 py-2.5 rounded-xl text-white text-sm font-medium"
                                    style={{ background: '#c4714a' }}>
                                    Zobraziť profil kouča
                                </a>
                            </div>
                        ) : streamStatus === 'idle' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                                <Radio size={40} className="mb-3 animate-pulse" style={{ color: '#c4714a' }} />
                                <p className="text-white text-lg font-semibold mb-1">Stream sa pripravuje...</p>
                                <p className="text-sm" style={{ color: '#9a8a7a' }}>Kouč čoskoro začne streamovať.</p>
                            </div>
                        ) : initialStream.playback_id ? (
                            <MuxPlayer
                                streamType="ll-live"
                                playbackId={initialStream.playback_id}
                                metadataVideoTitle={initialStream.title}
                                autoPlay
                                muted
                                className="w-full h-full"
                            />
                        ) : null}
                    </div>

                    {/* Stream info */}
                    <div className="px-4 py-3 hidden lg:block shrink-0" style={{ background: '#1a1a1a' }}>
                        <h1 className="text-white font-semibold">{initialStream.title}</h1>
                        {initialStream.description && (
                            <p className="text-sm mt-1" style={{ color: '#9a8a7a' }}>{initialStream.description}</p>
                        )}
                    </div>

                    {/* Emoji reactions */}
                    {!streamEnded && (
                        <div className="flex gap-3 px-4 py-2 shrink-0" style={{ background: '#1a1a1a' }}>
                            {REACTIONS.map(emoji => (
                                <button key={emoji} onClick={() => sendReaction(emoji)}
                                    className="text-xl hover:scale-125 transition-transform active:scale-95">
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── CHAT SIDE ──────────────────────────────────────────────── */}
                <div className="flex flex-col lg:w-80 xl:w-96 border-l"
                    style={{ background: '#1a1a1a', borderColor: '#2a2a2a', height: '100%', minHeight: 0 }}>

                    {/* Chat header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                        style={{ borderColor: '#2a2a2a' }}>
                        <div className="flex items-center gap-2">
                            <MessageCircle size={16} style={{ color: '#9a8a7a' }} />
                            <span className="text-white text-sm font-semibold">Live chat</span>
                            {connected && <span className="w-2 h-2 bg-green-500 rounded-full" title="Pripojený" />}
                        </div>
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#9a8a7a' }}>
                            <Users size={12} />{viewersCount} online
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
                        {messages.length === 0 && (
                            <p className="text-xs text-center py-4" style={{ color: '#555' }}>
                                Zatiaľ žiadne správy. Buď prvý!
                            </p>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id}>
                                {msg.type === 'system' ? (
                                    <p className="text-xs text-center italic" style={{ color: '#555' }}>
                                        {msg.message}
                                    </p>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        {msg.user?.avatar_url ? (
                                            <img src={msg.user.avatar_url} alt={msg.user.name}
                                                className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                                                style={{ background: msg.user?.is_coach ? '#c4714a' : '#333' }}>
                                                {msg.user?.name ? getInitials(msg.user.name) : '?'}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <span className="text-xs font-semibold mr-1.5"
                                                style={{ color: msg.user?.is_coach ? '#c4714a' : '#aaa' }}>
                                                {msg.user?.is_coach && '💪 '}
                                                {msg.user?.name}
                                                {msg.user?.is_coach && (
                                                    <span className="ml-1 text-white rounded px-1 py-0.5"
                                                        style={{ background: '#c4714a', fontSize: '10px' }}>
                                                        Kouč
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-sm break-words" style={{ color: '#ddd' }}>
                                                {msg.message}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={chatBottomRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage}
                        className="flex items-center gap-2 px-3 py-3 border-t shrink-0"
                        style={{ borderColor: '#2a2a2a' }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder={streamEnded ? 'Stream skončil' : 'Napíš správu...'}
                            disabled={streamEnded || sending}
                            maxLength={300}
                            className="flex-1 text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
                            style={{ background: '#2a2a2a', color: '#eee', border: '1px solid #3a3a3a' }}
                        />
                        <button type="submit"
                            disabled={!chatInput.trim() || sending || streamEnded}
                            className="p-2 rounded-xl transition disabled:opacity-40"
                            style={{ background: '#c4714a' }}>
                            <Send size={16} className="text-white" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
