import { Head } from '@inertiajs/react';
import MuxPlayer from '@mux/mux-player-react';
import { useState, useEffect, useRef, FormEventHandler } from 'react';
import axios from 'axios';
import { Send, Users, Lock, Globe, Radio } from 'lucide-react';

interface ChatMessage {
    id: number;
    message: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        role: string;
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

export default function Watch({ stream: initialStream, coach, messages: initialMessages }: Props) {
    const [streamStatus, setStreamStatus] = useState(initialStream.status);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [lastMsgId, setLastMsgId] = useState(initialMessages.at(-1)?.id ?? 0);
    const [chatInput, setChatInput] = useState('');
    const [sending, setSending] = useState(false);
    const [streamEnded, setStreamEnded] = useState(initialStream.status === 'disabled');
    const [viewersCount, setViewersCount] = useState(initialStream.viewers_count);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Poll for new messages + status every 3s
    useEffect(() => {
        if (streamEnded) return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/live/${initialStream.id}/poll?last_message_id=${lastMsgId}`);
                setStreamStatus(res.data.status);
                setViewersCount(res.data.viewers_count);

                if (res.data.messages.length > 0) {
                    setMessages(prev => [...prev, ...res.data.messages]);
                    setLastMsgId(res.data.messages.at(-1).id);
                }

                if (res.data.status === 'disabled') {
                    setStreamEnded(true);
                    if (pollRef.current) clearInterval(pollRef.current);
                }
            } catch { /* silent */ }
        }, 3000);

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [lastMsgId, streamEnded]);

    // Scroll chat to bottom on new message
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage: FormEventHandler = async (e) => {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text || sending) return;

        setSending(true);
        setChatInput('');
        try {
            const res = await axios.post(`/live/${initialStream.id}/message`, { message: text });
            setMessages(prev => [...prev, res.data]);
            setLastMsgId(res.data.id);
        } catch {
            setChatInput(text);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Head title={`${coach.name} — LIVE`} />

            <div className="min-h-screen flex flex-col" style={{ background: '#111' }}>

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

                {/* Main */}
                <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">

                    {/* Video area */}
                    <div className="lg:flex-1 flex flex-col">
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
                                    streamType="live"
                                    playbackId={initialStream.playback_id}
                                    metadataVideoTitle={initialStream.title}
                                    autoPlay
                                    muted
                                    className="w-full"
                                />
                            ) : null}
                        </div>

                        {/* Stream info (desktop) */}
                        <div className="px-4 py-3 hidden lg:block" style={{ background: '#1a1a1a' }}>
                            <h1 className="text-white font-semibold">{initialStream.title}</h1>
                            {initialStream.description && (
                                <p className="text-sm mt-1" style={{ color: '#9a8a7a' }}>{initialStream.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="flex flex-col lg:w-80 xl:w-96 border-l"
                        style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>

                        <div className="px-4 py-3 font-semibold text-sm text-white border-b shrink-0"
                            style={{ borderColor: '#2a2a2a' }}>
                            💬 Live chat
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
                            style={{ minHeight: 0 }}>
                            {messages.length === 0 && (
                                <p className="text-xs text-center py-4" style={{ color: '#555' }}>
                                    Zatiaľ žiadne správy. Buď prvý!
                                </p>
                            )}
                            {messages.map(msg => (
                                <div key={msg.id} className="flex items-start gap-2">
                                    {msg.user.avatar_url ? (
                                        <img src={msg.user.avatar_url} alt={msg.user.name}
                                            className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                                            style={{ background: '#c4714a' }}>
                                            {getInitials(msg.user.name)}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <span className="text-xs font-semibold mr-1.5"
                                            style={{ color: msg.user.role === 'coach' ? '#c4714a' : '#aaa' }}>
                                            {msg.user.name}
                                            {msg.user.role === 'coach' && (
                                                <span className="ml-1 text-white rounded px-1 py-0.5"
                                                    style={{ background: '#c4714a', fontSize: '10px' }}>
                                                    Kouč
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-sm break-words" style={{ color: '#ddd' }}>{msg.message}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatBottomRef} />
                        </div>

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
                                className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
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
            </div>
        </>
    );
}
