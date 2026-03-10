import { Head, router } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';
import { useState, useEffect, useRef, FormEventHandler } from 'react';
import axios from 'axios';
import {
    Radio, Camera, Monitor, Copy, Eye, EyeOff,
    CheckCircle2, AlertCircle, StopCircle, Users,
    Lock, Globe, ExternalLink, Mic, MicOff, Video, VideoOff,
    Smartphone, Check, Send, MessageCircle
} from 'lucide-react';

type StreamMethod = 'browser' | 'obs';

interface ChatMessage {
    id: number;
    message: string;
    created_at: string;
    type?: 'system';
    user?: {
        id: number;
        name: string;
        is_coach?: boolean;
        avatar_url: string | null;
    };
}

interface StreamData {
    id: number;
    title: string;
    description: string | null;
    status: 'idle' | 'active' | 'disabled';
    access: 'subscribers' | 'everyone';
    method: StreamMethod;
    rtmp_url: string;
    stream_key: string;
    mux_playback_id: string | null;
    started_at: string | null;
    viewers_count: number;
}

interface Props {
    // Inertia prop — updated on every page navigation, used directly (no state copy)
    activeStream: StreamData | null;
    coach: { id: number; specialization: string | null };
    flash?: { success?: string; error?: string };
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function LiveStream({ activeStream, coach, flash }: Props) {
    // Mutable runtime state — updated via poll / websocket
    const [streamStatus, setStreamStatus] = useState(activeStream?.status ?? 'idle');
    const [viewersCount, setViewersCount] = useState(activeStream?.viewers_count ?? 0);
    const [elapsed, setElapsed] = useState('');

    // Create form
    const [method, setMethod] = useState<StreamMethod>('browser');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [access, setAccess] = useState<'subscribers' | 'everyone'>('subscribers');
    const [submitting, setSubmitting] = useState(false);

    // OBS
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [ending, setEnding] = useState(false);

    // Browser streaming
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [broadcastError, setBroadcastError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    // Chat
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [sendingChat, setSendingChat] = useState(false);
    const [chatConnected, setChatConnected] = useState(false);
    const chatBottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Sync mutable state when Inertia delivers new props (e.g. after stream create/delete)
    useEffect(() => {
        setStreamStatus(activeStream?.status ?? 'idle');
        setViewersCount(activeStream?.viewers_count ?? 0);
        setIsBroadcasting(false);
        setBroadcastError(null);
    }, [activeStream?.id ?? 'none']);

    // Chat scroll
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reverb chat subscription
    useEffect(() => {
        if (!activeStream) return;
        const ch = window.Echo.channel(`live-stream.${activeStream.id}`);
        ch.listen('.chat.message', (d: ChatMessage) => setMessages(p => [...p, d]));
        ch.listen('.viewer.joined', (d: { viewer: { name: string }; viewers_count: number }) => {
            setViewersCount(d.viewers_count);
            setMessages(p => [...p, { id: Date.now(), type: 'system', message: `${d.viewer.name} sa pripojil 👋`, created_at: new Date().toISOString() }]);
        });
        ch.listen('.viewer.left', (d: { viewers_count: number }) => setViewersCount(d.viewers_count));
        ch.subscribed(() => setChatConnected(true));
        return () => { window.Echo.leaveChannel(`live-stream.${activeStream.id}`); setChatConnected(false); };
    }, [activeStream?.id]);

    // Poll stream status (Mux status sync)
    useEffect(() => {
        if (!activeStream) return;
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/live/${activeStream.id}/poll?last_message_id=0`);
                setStreamStatus(res.data.status);
                setViewersCount(res.data.viewers_count);
            } catch { /* silent */ }
        }, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeStream?.id]);

    // Elapsed timer
    useEffect(() => {
        if (streamStatus !== 'active' || !activeStream?.started_at) return;
        const tick = () => {
            const diff = Math.floor((Date.now() - new Date(activeStream.started_at!).getTime()) / 1000);
            setElapsed(`${String(Math.floor(diff / 3600)).padStart(2, '0')}:${String(Math.floor((diff % 3600) / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [streamStatus, activeStream?.started_at]);

    // Attach camera to <video>
    useEffect(() => {
        if (localStream && videoRef.current) videoRef.current.srcObject = localStream;
    }, [localStream]);

    // Cleanup camera on unmount
    useEffect(() => () => {
        localStream?.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
    }, [localStream]);

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post('/dashboard/live', { title, description, access, method }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const startCameraPreview = async () => {
        setBroadcastError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true,
            });
            setLocalStream(stream);
        } catch (err: any) {
            setBroadcastError(
                err?.name === 'NotAllowedError' ? 'Prístup ku kamere zamietnutý. Povol kameru v adresnom riadku.' :
                err?.name === 'NotFoundError'   ? 'Kamera alebo mikrofón nenájdený.' :
                'Nepodarilo sa získať prístup ku kamere: ' + (err?.message ?? err)
            );
        }
    };

    const startBroadcast = async () => {
        if (!localStream || !activeStream) return;
        setBroadcastError(null);
        setBroadcastLoading(true);
        try {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            pcRef.current = pc;
            localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
            await pc.setLocalDescription(await pc.createOffer());
            await new Promise<void>(resolve => {
                const to = setTimeout(resolve, 4000);
                pc.addEventListener('icegatheringstatechange', () => {
                    if (pc.iceGatheringState === 'complete') { clearTimeout(to); resolve(); }
                });
                if (pc.iceGatheringState === 'complete') { clearTimeout(to); resolve(); }
            });
            const res = await axios.post(`/dashboard/live/${activeStream.id}/whip`, pc.localDescription?.sdp,
                { headers: { 'Content-Type': 'application/sdp' }, responseType: 'text', timeout: 12000 });
            await pc.setRemoteDescription({ type: 'answer', sdp: res.data });
            setIsBroadcasting(true);
            setStreamStatus('active');
        } catch (err: any) {
            setBroadcastError('Nepodarilo sa spustiť stream: ' + (err?.message ?? String(err)));
        } finally {
            setBroadcastLoading(false);
        }
    };

    const stopBroadcast = () => {
        pcRef.current?.close(); pcRef.current = null;
        localStream?.getTracks().forEach(t => t.stop()); setLocalStream(null);
        setIsBroadcasting(false);
        if (activeStream) { setEnding(true); router.delete(`/dashboard/live/${activeStream.id}`, { onFinish: () => setEnding(false) }); }
    };

    const handleEndObs = () => {
        if (!activeStream || !confirm('Naozaj chceš ukončiť stream?')) return;
        setEnding(true);
        router.delete(`/dashboard/live/${activeStream.id}`, { onFinish: () => setEnding(false) });
    };

    const sendChatMessage: FormEventHandler = async (e) => {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text || sendingChat || !activeStream) return;
        setSendingChat(true); setChatInput('');
        try {
            const res = await axios.post(`/live/${activeStream.id}/message`, { message: text });
            setMessages(p => [...p, res.data]);
        } catch { setChatInput(text); }
        finally { setSendingChat(false); }
    };

    const appUrl = window.location.origin;

    // ── RENDER ───────────────────────────────────────────────────────────────

    return (
        <PulseLayout>
            <Head title="Live Stream" />
            <div className="max-w-5xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fce8de' }}>
                        <Radio size={20} style={{ color: '#c4714a' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#2d2118' }}>Live Stream</h1>
                        <p className="text-sm" style={{ color: '#9a8a7a' }}>Streamuj priamo svojim predplatiteľom</p>
                    </div>
                    {(streamStatus === 'active' || isBroadcasting) && (
                        <span className="ml-auto flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />LIVE
                        </span>
                    )}
                </div>

                {flash?.success && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5">
                        <CheckCircle2 size={16} />{flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5">
                        <AlertCircle size={16} />{flash.error}
                    </div>
                )}

                {/* ── CREATE FORM ───────────────────────────────────────────── */}
                {!activeStream && (
                    <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h2 className="font-semibold mb-4" style={{ color: '#2d2118' }}>Detaily streamu</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: '#2d2118' }}>Názov *</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="napr. Ranný tréning — chest day" required maxLength={200}
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                                        style={{ borderColor: '#e8d9c4', color: '#2d2118' }} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: '#2d2118' }}>Popis (voliteľné)</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                                        placeholder="O čom bude dnešný stream..." rows={2} maxLength={500}
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:ring-2"
                                        style={{ borderColor: '#e8d9c4', color: '#2d2118' }} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h2 className="font-semibold mb-3" style={{ color: '#2d2118' }}>Kto môže sledovať?</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {([
                                    { value: 'subscribers', icon: <Lock size={18} />, label: 'Len predplatitelia', desc: 'Iba platení predplatitelia' },
                                    { value: 'everyone',    icon: <Globe size={18} />, label: 'Všetci sledovatelia', desc: 'Ktokoľvek kto ťa sleduje' },
                                ] as const).map(opt => (
                                    <button key={opt.value} type="button" onClick={() => setAccess(opt.value)}
                                        className="p-3 rounded-xl border-2 text-left transition-all"
                                        style={{ borderColor: access === opt.value ? '#c4714a' : '#e8d9c4', background: access === opt.value ? '#fce8de' : 'white' }}>
                                        <div style={{ color: '#c4714a' }}>{opt.icon}</div>
                                        <div className="font-medium text-sm mt-1.5" style={{ color: '#2d2118' }}>{opt.label}</div>
                                        <div className="text-xs mt-0.5" style={{ color: '#9a8a7a' }}>{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h2 className="font-semibold mb-3" style={{ color: '#2d2118' }}>Ako chceš streamovať?</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setMethod('browser')}
                                    className="p-4 rounded-xl border-2 text-left transition-all"
                                    style={{ borderColor: method === 'browser' ? '#c4714a' : '#e8d9c4', background: method === 'browser' ? '#fce8de' : 'white' }}>
                                    <Camera size={22} style={{ color: '#c4714a' }} />
                                    <div className="font-semibold text-sm mt-2" style={{ color: '#2d2118' }}>📷 Z prehliadača</div>
                                    <div className="text-xs mt-1" style={{ color: '#9a8a7a' }}>Žiadna inštalácia. Priamo tu.</div>
                                    <div className="text-xs mt-1.5 font-medium" style={{ color: '#4a7c59' }}>✓ Najjednoduchšie</div>
                                </button>
                                <button type="button" onClick={() => setMethod('obs')}
                                    className="p-4 rounded-xl border-2 text-left transition-all"
                                    style={{ borderColor: method === 'obs' ? '#c4714a' : '#e8d9c4', background: method === 'obs' ? '#fce8de' : 'white' }}>
                                    <Monitor size={22} style={{ color: '#c4714a' }} />
                                    <div className="font-semibold text-sm mt-2" style={{ color: '#2d2118' }}>🎬 OBS / Larix</div>
                                    <div className="text-xs mt-1" style={{ color: '#9a8a7a' }}>Profesionálna kvalita.</div>
                                    <div className="text-xs mt-1.5 font-medium" style={{ color: '#3b82f6' }}>✓ Lepšia kvalita</div>
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={submitting || !title.trim()}
                            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-xl disabled:opacity-50"
                            style={{ background: '#c4714a' }}>
                            <Radio size={20} />{submitting ? 'Vytváram stream...' : 'Vytvoriť stream'}
                        </button>
                    </form>
                )}

                {/* ── ACTIVE STREAM ─────────────────────────────────────────── */}
                {activeStream && (
                    <div className="flex flex-col lg:flex-row gap-4">

                        {/* Controls */}
                        <div className="flex-1 space-y-4 min-w-0">

                            {activeStream.method === 'browser' && (<>
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border"
                                    style={{ background: isBroadcasting ? '#fee2e2' : '#fef9c3', borderColor: isBroadcasting ? '#fca5a5' : '#fde68a' }}>
                                    <span className={`w-3 h-3 rounded-full ${isBroadcasting ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`} />
                                    <span className="font-medium text-sm" style={{ color: '#2d2118' }}>
                                        {isBroadcasting ? `🔴 Streamuješ LIVE${elapsed ? ` · ${elapsed}` : ''}` : '⏳ Spusti kameru a začni streamovať'}
                                    </span>
                                </div>

                                {broadcastError && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <div><strong>Chyba:</strong> {broadcastError}
                                            <button onClick={() => { setBroadcastError(null); startCameraPreview(); }} className="ml-2 underline">Skúsiť znova</button>
                                        </div>
                                    </div>
                                )}

                                {!localStream ? (
                                    <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#e8d9c4' }}>
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#fce8de' }}>
                                            <Camera size={32} style={{ color: '#c4714a' }} />
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1" style={{ color: '#2d2118' }}>Spustiť kameru</h3>
                                        <p className="text-sm mb-5" style={{ color: '#9a8a7a' }}>Klikni — prehliadač ťa požiada o povolenie.</p>
                                        <button onClick={startCameraPreview}
                                            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl"
                                            style={{ background: '#c4714a' }}>
                                            <Camera size={18} />Povoliť kameru a mikrofón
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl overflow-hidden bg-black relative" style={{ aspectRatio: '16/9' }}>
                                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                                            <button onClick={() => { const n = !micOn; localStream.getAudioTracks().forEach(t => { t.enabled = n; }); setMicOn(n); }}
                                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                                style={{ background: micOn ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                                                {micOn ? <Mic size={18} className="text-white" /> : <MicOff size={18} className="text-white" />}
                                            </button>
                                            <button onClick={() => { const n = !camOn; localStream.getVideoTracks().forEach(t => { t.enabled = n; }); setCamOn(n); }}
                                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                                style={{ background: camOn ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                                                {camOn ? <Video size={18} className="text-white" /> : <VideoOff size={18} className="text-white" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {!isBroadcasting ? (
                                        <button onClick={startBroadcast} disabled={!localStream || broadcastLoading}
                                            className="col-span-2 flex items-center justify-center gap-2 font-semibold py-4 rounded-xl disabled:opacity-60"
                                            style={{ background: localStream ? '#c4714a' : '#d1d5db', color: 'white' }}>
                                            {broadcastLoading
                                                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Pripájam sa...</>
                                                : <><span className="w-3 h-3 bg-white rounded-full animate-pulse" />{localStream ? 'Spustiť stream' : 'Najprv povoľ kameru'}</>}
                                        </button>
                                    ) : (
                                        <>
                                            <div className="bg-white rounded-xl border p-3 text-center" style={{ borderColor: '#e8d9c4' }}>
                                                <Users size={18} className="mx-auto mb-1" style={{ color: '#c4714a' }} />
                                                <div className="font-bold text-lg" style={{ color: '#2d2118' }}>{viewersCount}</div>
                                                <div className="text-xs" style={{ color: '#9a8a7a' }}>divákov</div>
                                            </div>
                                            <button onClick={stopBroadcast} disabled={ending}
                                                className="flex items-center justify-center gap-2 font-semibold py-3 rounded-xl border disabled:opacity-60"
                                                style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
                                                <StopCircle size={18} />{ending ? 'Ukončujem...' : 'Ukončiť'}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e8d9c4' }}>
                                    <p className="text-sm font-medium mb-2" style={{ color: '#2d2118' }}>🔗 Link pre divákov</p>
                                    <div className="flex gap-2">
                                        <code className="flex-1 rounded-lg px-3 py-2 text-xs truncate" style={{ background: '#faf6f0', color: '#5a4a3a' }}>
                                            {appUrl}/live/{coach.id}
                                        </code>
                                        <button onClick={() => copy(`${appUrl}/live/${coach.id}`, 'link')}
                                            className="text-white px-3 py-2 rounded-lg flex items-center gap-1 shrink-0" style={{ background: '#c4714a' }}>
                                            {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </>)}

                            {activeStream.method === 'obs' && (<>
                                <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="font-semibold text-lg" style={{ color: '#2d2118' }}>{activeStream.title}</h2>
                                            {activeStream.description && <p className="text-sm mt-0.5" style={{ color: '#9a8a7a' }}>{activeStream.description}</p>}
                                        </div>
                                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                                            style={{ background: streamStatus === 'active' ? '#fee2e2' : '#fef9c3', color: streamStatus === 'active' ? '#dc2626' : '#92400e' }}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${streamStatus === 'active' ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`} />
                                            {streamStatus === 'active' ? `LIVE · ${elapsed}` : 'Čaká na OBS/Larix...'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm" style={{ color: '#9a8a7a' }}>
                                        <span className="flex items-center gap-1"><Users size={14} />{viewersCount} divákov</span>
                                        <span className="flex items-center gap-1">
                                            {activeStream.access === 'subscribers' ? <Lock size={14} /> : <Globe size={14} />}
                                            {activeStream.access === 'subscribers' ? 'Len predplatitelia' : 'Všetci sledovatelia'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                                    <h3 className="font-semibold mb-4" style={{ color: '#2d2118' }}>Nastavenia OBS / Larix</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide mb-1.5 block" style={{ color: '#9a8a7a' }}>RTMP URL</label>
                                            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: '#faf6f0', border: '1px solid #e8d9c4' }}>
                                                <code className="flex-1 text-sm font-mono truncate" style={{ color: '#2d2118' }}>{activeStream.rtmp_url}</code>
                                                <button onClick={() => copy(activeStream.rtmp_url, 'rtmp')} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200">
                                                    {copied === 'rtmp' ? <CheckCircle2 size={16} style={{ color: '#4a7c59' }} /> : <Copy size={16} style={{ color: '#9a8a7a' }} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium uppercase tracking-wide mb-1.5 block" style={{ color: '#9a8a7a' }}>Stream Key</label>
                                            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: '#faf6f0', border: '1px solid #e8d9c4' }}>
                                                <code className="flex-1 text-sm font-mono truncate" style={{ color: '#2d2118' }}>
                                                    {showKey ? activeStream.stream_key : '●'.repeat(28)}
                                                </code>
                                                <button onClick={() => setShowKey(v => !v)} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200">
                                                    {showKey ? <EyeOff size={16} style={{ color: '#9a8a7a' }} /> : <Eye size={16} style={{ color: '#9a8a7a' }} />}
                                                </button>
                                                <button onClick={() => copy(activeStream.stream_key, 'key')} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200">
                                                    {copied === 'key' ? <CheckCircle2 size={16} style={{ color: '#4a7c59' }} /> : <Copy size={16} style={{ color: '#9a8a7a' }} />}
                                                </button>
                                            </div>
                                            <p className="text-xs mt-1" style={{ color: '#9a8a7a' }}>Nikdy nezdieľaj stream key.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e8d9c4' }}>
                                        <div className="flex items-center gap-2 mb-2"><Smartphone size={16} style={{ color: '#c4714a' }} /><span className="font-semibold text-sm" style={{ color: '#2d2118' }}>Larix (mobil)</span></div>
                                        <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: '#9a8a7a' }}>
                                            <li>Stiahni Larix Broadcaster</li><li>Connections → Pridaj nové</li><li>Vlož RTMP URL a Stream Key</li><li>Stlač Record ●</li>
                                        </ol>
                                    </div>
                                    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e8d9c4' }}>
                                        <div className="flex items-center gap-2 mb-2"><Monitor size={16} style={{ color: '#c4714a' }} /><span className="font-semibold text-sm" style={{ color: '#2d2118' }}>OBS Studio (PC)</span></div>
                                        <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: '#9a8a7a' }}>
                                            <li>Otvor OBS Studio</li><li>Settings → Stream → Custom</li><li>Vlož RTMP URL a Stream Key</li><li>Klikni Start Streaming</li>
                                        </ol>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <a href={`/live/${coach.id}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 border rounded-xl hover:bg-gray-50"
                                        style={{ borderColor: '#e8d9c4', color: '#2d2118' }}>
                                        <ExternalLink size={15} />Zobraziť stream
                                    </a>
                                    <button onClick={() => copy(`${appUrl}/live/${coach.id}`, 'link')}
                                        className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 border rounded-xl hover:bg-gray-50"
                                        style={{ borderColor: '#e8d9c4', color: '#2d2118' }}>
                                        {copied === 'link' ? <Check size={15} style={{ color: '#4a7c59' }} /> : <Copy size={15} />}
                                        {copied === 'link' ? 'Skopírované!' : 'Kopírovať link'}
                                    </button>
                                    <button onClick={handleEndObs} disabled={ending}
                                        className="ml-auto flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl disabled:opacity-60"
                                        style={{ background: '#dc2626' }}>
                                        <StopCircle size={16} />{ending ? 'Ukončujem...' : 'Ukončiť stream'}
                                    </button>
                                </div>
                            </>)}
                        </div>

                        {/* Chat panel */}
                        <div className="lg:w-80 xl:w-96 flex flex-col rounded-2xl border overflow-hidden"
                            style={{ borderColor: '#e8d9c4', background: 'white', maxHeight: '80vh' }}>
                            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: '#e8d9c4' }}>
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={16} style={{ color: '#c4714a' }} />
                                    <span className="font-semibold text-sm" style={{ color: '#2d2118' }}>Live chat</span>
                                    {chatConnected && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                                </div>
                                <span className="flex items-center gap-1 text-xs" style={{ color: '#9a8a7a' }}><Users size={12} />{viewersCount} online</span>
                            </div>
                            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
                                {messages.length === 0 && (
                                    <p className="text-xs text-center py-6" style={{ color: '#9a8a7a' }}>Zatiaľ žiadne správy.</p>
                                )}
                                {messages.map(msg => (
                                    <div key={msg.id}>
                                        {msg.type === 'system' ? (
                                            <p className="text-xs text-center italic" style={{ color: '#aaa' }}>{msg.message}</p>
                                        ) : (
                                            <div className="flex items-start gap-2">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                                                    style={{ background: msg.user?.is_coach ? '#c4714a' : '#e8d9c4', color: msg.user?.is_coach ? 'white' : '#9a8a7a' }}>
                                                    {msg.user?.name ? getInitials(msg.user.name) : '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-xs font-semibold mr-1" style={{ color: msg.user?.is_coach ? '#c4714a' : '#9a8a7a' }}>
                                                        {msg.user?.name}
                                                        {msg.user?.is_coach && <span className="ml-1 text-white rounded px-1 py-0.5" style={{ background: '#c4714a', fontSize: '9px' }}>Kouč</span>}
                                                    </span>
                                                    <span className="text-sm break-words" style={{ color: '#2d2118' }}>{msg.message}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatBottomRef} />
                            </div>
                            <form onSubmit={sendChatMessage} className="flex items-center gap-2 px-3 py-3 border-t shrink-0" style={{ borderColor: '#e8d9c4' }}>
                                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                    placeholder="Odpovedaj divákom..." disabled={sendingChat} maxLength={300}
                                    className="flex-1 text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 border"
                                    style={{ borderColor: '#e8d9c4', color: '#2d2118' }} />
                                <button type="submit" disabled={!chatInput.trim() || sendingChat}
                                    className="p-2 rounded-xl disabled:opacity-40" style={{ background: '#c4714a' }}>
                                    <Send size={16} className="text-white" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PulseLayout>
    );
}
