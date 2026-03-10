import { Head, router } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';
import { useState, useEffect, useRef, FormEventHandler } from 'react';
import axios from 'axios';
import {
    Radio, Camera, Monitor, Copy, Eye, EyeOff,
    CheckCircle2, AlertCircle, StopCircle, Users,
    Lock, Globe, ExternalLink, Mic, MicOff, Video, VideoOff,
    Smartphone, Check
} from 'lucide-react';

type StreamMethod = 'browser' | 'obs';

interface ActiveStream {
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
    activeStream: ActiveStream | null;
    coach: { id: number; specialization: string | null };
    flash?: { success?: string; error?: string };
}

export default function LiveStream({ activeStream: initialStream, coach, flash }: Props) {
    const [activeStream, setActiveStream] = useState(initialStream);
    const [streamStatus, setStreamStatus] = useState(initialStream?.status ?? 'idle');

    // Create form state
    const [method, setMethod] = useState<StreamMethod>('browser');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [access, setAccess] = useState<'subscribers' | 'everyone'>('subscribers');
    const [submitting, setSubmitting] = useState(false);

    // OBS state
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [ending, setEnding] = useState(false);
    const [elapsed, setElapsed] = useState('');

    // Browser streaming state
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [broadcastError, setBroadcastError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Poll stream status every 5s (for OBS method)
    useEffect(() => {
        if (!activeStream) return;
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/live/${activeStream.id}/poll`);
                setStreamStatus(res.data.status);
                setActiveStream(prev => prev ? { ...prev, viewers_count: res.data.viewers_count } : prev);
            } catch { /* silent */ }
        }, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeStream?.id]);

    // Elapsed time counter
    useEffect(() => {
        if (streamStatus !== 'active' || !activeStream?.started_at) return;
        const tick = () => {
            const diff = Math.floor((Date.now() - new Date(activeStream.started_at!).getTime()) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setElapsed(`${h}:${m}:${s}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [streamStatus, activeStream?.started_at]);

    // Auto-start camera preview when browser stream is active
    useEffect(() => {
        if (activeStream?.method === 'browser' && !localStream) {
            startCameraPreview();
        }
    }, [activeStream?.id]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            localStream?.getTracks().forEach(t => t.stop());
            pcRef.current?.close();
        };
    }, [localStream]);

    const copyToClipboard = (text: string, label: string) => {
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

    // ── Browser streaming ──────────────────────────────────────────────────────

    const startCameraPreview = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                audio: true,
            });
            setLocalStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            setBroadcastError('Nepodarilo sa získať prístup ku kamere/mikrofónu. Skontroluj povolenia prehliadača.');
        }
    };

    const startBroadcast = async () => {
        if (!localStream || !activeStream) return;
        setBroadcastError(null);

        try {
            const res = await axios.get(`/dashboard/live/${activeStream.id}/webrtc-config`);
            const whipEndpoint = res.data.whip_endpoint;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            pcRef.current = pc;

            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Wait for ICE gathering (max 3s)
            await new Promise<void>(resolve => {
                if (pc.iceGatheringState === 'complete') return resolve();
                const timeout = setTimeout(resolve, 3000);
                pc.onicegatheringstatechange = () => {
                    if (pc.iceGatheringState === 'complete') {
                        clearTimeout(timeout);
                        resolve();
                    }
                };
            });

            const response = await fetch(whipEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/sdp' },
                body: pc.localDescription?.sdp,
            });

            if (!response.ok) {
                throw new Error(`WHIP ${response.status}: ${await response.text()}`);
            }

            const answerSdp = await response.text();
            await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
            setIsBroadcasting(true);
            setStreamStatus('active');

        } catch (err: any) {
            setBroadcastError('Nepodarilo sa spustiť stream: ' + (err.message ?? 'Neznáma chyba'));
        }
    };

    const stopBroadcast = async () => {
        pcRef.current?.close();
        pcRef.current = null;
        localStream?.getTracks().forEach(t => t.stop());
        setLocalStream(null);
        setIsBroadcasting(false);
        if (activeStream) {
            setEnding(true);
            router.delete(`/dashboard/live/${activeStream.id}`, {
                onFinish: () => setEnding(false),
            });
        }
    };

    const toggleMic = () => {
        if (!localStream) return;
        const next = !micOn;
        localStream.getAudioTracks().forEach(t => { t.enabled = next; });
        setMicOn(next);
    };

    const toggleCam = () => {
        if (!localStream) return;
        const next = !camOn;
        localStream.getVideoTracks().forEach(t => { t.enabled = next; });
        setCamOn(next);
    };

    const handleEndObs = () => {
        if (!activeStream || !confirm('Naozaj chceš ukončiť stream?')) return;
        setEnding(true);
        router.delete(`/dashboard/live/${activeStream.id}`, {
            onFinish: () => setEnding(false),
        });
    };

    const appUrl = window.location.origin;

    return (
        <PulseLayout>
            <Head title="Live Stream" />
            <div className="max-w-2xl mx-auto px-4 py-6">

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
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            LIVE
                        </span>
                    )}
                </div>

                {/* Flash */}
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

                {/* ── NO ACTIVE STREAM — Create form ───────────────────────────── */}
                {!activeStream && (
                    <form onSubmit={handleCreate} className="space-y-4">

                        {/* Stream details */}
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h2 className="font-semibold mb-4" style={{ color: '#2d2118' }}>Detaily streamu</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: '#2d2118' }}>Názov *</label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="napr. Ranný tréning — chest day"
                                        required maxLength={200}
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2"
                                        style={{ borderColor: '#e8d9c4', color: '#2d2118' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1" style={{ color: '#2d2118' }}>Popis (voliteľné)</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="O čom bude dnešný stream..."
                                        rows={2} maxLength={500}
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:ring-2"
                                        style={{ borderColor: '#e8d9c4', color: '#2d2118' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Access */}
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h2 className="font-semibold mb-3" style={{ color: '#2d2118' }}>Kto môže sledovať?</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'subscribers', icon: <Lock size={18} />, label: 'Len predplatitelia', desc: 'Iba platení predplatitelia' },
                                    { value: 'everyone', icon: <Globe size={18} />, label: 'Všetci sledovatelia', desc: 'Ktokoľvek kto ťa sleduje' },
                                ].map(opt => (
                                    <button key={opt.value} type="button"
                                        onClick={() => setAccess(opt.value as 'subscribers' | 'everyone')}
                                        className="p-3 rounded-xl border-2 text-left transition-all"
                                        style={{
                                            borderColor: access === opt.value ? '#c4714a' : '#e8d9c4',
                                            background: access === opt.value ? '#fce8de' : 'white',
                                        }}
                                    >
                                        <div style={{ color: '#c4714a' }}>{opt.icon}</div>
                                        <div className="font-medium text-sm mt-1.5" style={{ color: '#2d2118' }}>{opt.label}</div>
                                        <div className="text-xs mt-0.5" style={{ color: '#9a8a7a' }}>{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Method */}
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h2 className="font-semibold mb-3" style={{ color: '#2d2118' }}>Ako chceš streamovať?</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setMethod('browser')}
                                    className="p-4 rounded-xl border-2 text-left transition-all"
                                    style={{ borderColor: method === 'browser' ? '#c4714a' : '#e8d9c4', background: method === 'browser' ? '#fce8de' : 'white' }}
                                >
                                    <Camera size={22} style={{ color: '#c4714a' }} />
                                    <div className="font-semibold text-sm mt-2" style={{ color: '#2d2118' }}>📷 Z prehliadača</div>
                                    <div className="text-xs mt-1" style={{ color: '#9a8a7a' }}>Žiadna inštalácia. Priamo tu.</div>
                                    <div className="text-xs mt-1.5 font-medium" style={{ color: '#4a7c59' }}>✓ Najjednoduchšie</div>
                                </button>
                                <button type="button" onClick={() => setMethod('obs')}
                                    className="p-4 rounded-xl border-2 text-left transition-all"
                                    style={{ borderColor: method === 'obs' ? '#c4714a' : '#e8d9c4', background: method === 'obs' ? '#fce8de' : 'white' }}
                                >
                                    <Monitor size={22} style={{ color: '#c4714a' }} />
                                    <div className="font-semibold text-sm mt-2" style={{ color: '#2d2118' }}>🎬 OBS / Larix</div>
                                    <div className="text-xs mt-1" style={{ color: '#9a8a7a' }}>Profesionálna kvalita.</div>
                                    <div className="text-xs mt-1.5 font-medium" style={{ color: '#3b82f6' }}>✓ Lepšia kvalita</div>
                                </button>
                            </div>
                        </div>

                        <button type="submit"
                            disabled={submitting || !title.trim()}
                            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-xl transition disabled:opacity-50"
                            style={{ background: '#c4714a' }}
                        >
                            <Radio size={20} />
                            {submitting ? 'Vytváram stream...' : 'Vytvoriť stream'}
                        </button>
                    </form>
                )}

                {/* ── ACTIVE STREAM — BROWSER METHOD ──────────────────────────── */}
                {activeStream?.method === 'browser' && (
                    <div className="space-y-4">

                        {/* Status bar */}
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border"
                            style={{
                                background: isBroadcasting ? '#fee2e2' : '#fef9c3',
                                borderColor: isBroadcasting ? '#fca5a5' : '#fde68a',
                            }}>
                            <span className={`w-3 h-3 rounded-full ${isBroadcasting ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`} />
                            <span className="font-medium text-sm" style={{ color: '#2d2118' }}>
                                {isBroadcasting ? `🔴 Streamuješ LIVE${elapsed ? ` · ${elapsed}` : ''}` : '⏳ Pripravené — stlač Spustiť stream'}
                            </span>
                        </div>

                        {broadcastError && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                {broadcastError}
                            </div>
                        )}

                        {/* Camera preview */}
                        <div className="rounded-2xl overflow-hidden bg-black relative" style={{ aspectRatio: '16/9' }}>
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

                            {!localStream && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                    <Camera size={48} className="opacity-30 mb-3" />
                                    <p className="text-sm opacity-60 mb-3">Kamera nie je aktívna</p>
                                    <button onClick={startCameraPreview}
                                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium">
                                        Povoliť kameru
                                    </button>
                                </div>
                            )}

                            {localStream && (
                                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                                    <button onClick={toggleMic}
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition"
                                        style={{ background: micOn ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                                        {micOn ? <Mic size={18} className="text-white" /> : <MicOff size={18} className="text-white" />}
                                    </button>
                                    <button onClick={toggleCam}
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition"
                                        style={{ background: camOn ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                                        {camOn ? <Video size={18} className="text-white" /> : <VideoOff size={18} className="text-white" />}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            {!isBroadcasting ? (
                                <button onClick={startBroadcast} disabled={!localStream}
                                    className="col-span-2 flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-xl transition disabled:opacity-50"
                                    style={{ background: '#c4714a' }}>
                                    <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                    Spustiť stream
                                </button>
                            ) : (
                                <>
                                    <div className="bg-white rounded-xl border p-3 text-center" style={{ borderColor: '#e8d9c4' }}>
                                        <Users size={18} className="mx-auto mb-1" style={{ color: '#c4714a' }} />
                                        <div className="font-bold text-lg" style={{ color: '#2d2118' }}>{activeStream.viewers_count}</div>
                                        <div className="text-xs" style={{ color: '#9a8a7a' }}>divákov</div>
                                    </div>
                                    <button onClick={stopBroadcast} disabled={ending}
                                        className="flex items-center justify-center gap-2 font-semibold py-3 rounded-xl border transition disabled:opacity-60"
                                        style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>
                                        <StopCircle size={18} />
                                        {ending ? 'Ukončujem...' : 'Ukončiť'}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Share link */}
                        <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e8d9c4' }}>
                            <p className="text-sm font-medium mb-2" style={{ color: '#2d2118' }}>🔗 Link na stream pre divákov</p>
                            <div className="flex gap-2">
                                <code className="flex-1 rounded-lg px-3 py-2 text-xs truncate" style={{ background: '#faf6f0', color: '#5a4a3a' }}>
                                    {appUrl}/live/{coach.id}
                                </code>
                                <button onClick={() => copyToClipboard(`${appUrl}/live/${coach.id}`, 'link')}
                                    className="text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 shrink-0" style={{ background: '#c4714a' }}>
                                    {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ACTIVE STREAM — OBS METHOD ──────────────────────────────── */}
                {activeStream?.method === 'obs' && (
                    <div className="space-y-4">

                        {/* Status */}
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="font-semibold text-lg" style={{ color: '#2d2118' }}>{activeStream.title}</h2>
                                    {activeStream.description && <p className="text-sm mt-0.5" style={{ color: '#9a8a7a' }}>{activeStream.description}</p>}
                                </div>
                                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                                    style={{
                                        background: streamStatus === 'active' ? '#fee2e2' : '#fef9c3',
                                        color: streamStatus === 'active' ? '#dc2626' : '#92400e',
                                    }}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${streamStatus === 'active' ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'}`} />
                                    {streamStatus === 'active' ? `LIVE · ${elapsed}` : 'Čaká na OBS/Larix...'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm" style={{ color: '#9a8a7a' }}>
                                <span className="flex items-center gap-1"><Users size={14} />{activeStream.viewers_count} divákov</span>
                                <span className="flex items-center gap-1">
                                    {activeStream.access === 'subscribers' ? <Lock size={14} /> : <Globe size={14} />}
                                    {activeStream.access === 'subscribers' ? 'Len predplatitelia' : 'Všetci sledovatelia'}
                                </span>
                            </div>
                        </div>

                        {/* RTMP credentials */}
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h3 className="font-semibold mb-4" style={{ color: '#2d2118' }}>Nastavenia pre OBS / Larix</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium uppercase tracking-wide mb-1.5 block" style={{ color: '#9a8a7a' }}>RTMP URL</label>
                                    <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: '#faf6f0', border: '1px solid #e8d9c4' }}>
                                        <code className="flex-1 text-sm font-mono truncate" style={{ color: '#2d2118' }}>{activeStream.rtmp_url}</code>
                                        <button onClick={() => copyToClipboard(activeStream.rtmp_url, 'rtmp')} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200">
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
                                        <button onClick={() => copyToClipboard(activeStream.stream_key, 'key')} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200">
                                            {copied === 'key' ? <CheckCircle2 size={16} style={{ color: '#4a7c59' }} /> : <Copy size={16} style={{ color: '#9a8a7a' }} />}
                                        </button>
                                    </div>
                                    <p className="text-xs mt-1" style={{ color: '#9a8a7a' }}>Nikdy nezdieľaj stream key s nikým.</p>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e8d9c4' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Smartphone size={16} style={{ color: '#c4714a' }} />
                                    <span className="font-semibold text-sm" style={{ color: '#2d2118' }}>Larix (mobil)</span>
                                </div>
                                <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: '#9a8a7a' }}>
                                    <li>Stiahni Larix Broadcaster</li>
                                    <li>Connections → Pridaj nové</li>
                                    <li>Vlož RTMP URL a Stream Key</li>
                                    <li>Stlač Record ●</li>
                                </ol>
                            </div>
                            <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e8d9c4' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Monitor size={16} style={{ color: '#c4714a' }} />
                                    <span className="font-semibold text-sm" style={{ color: '#2d2118' }}>OBS Studio (PC)</span>
                                </div>
                                <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: '#9a8a7a' }}>
                                    <li>Otvor OBS Studio</li>
                                    <li>Settings → Stream → Custom</li>
                                    <li>Vlož RTMP URL a Stream Key</li>
                                    <li>Klikni Start Streaming</li>
                                </ol>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <a href={`/live/${coach.id}`} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 border rounded-xl hover:bg-gray-50"
                                style={{ borderColor: '#e8d9c4', color: '#2d2118' }}>
                                <ExternalLink size={15} />Zobraziť stream
                            </a>
                            <button onClick={() => copyToClipboard(`${appUrl}/live/${coach.id}`, 'link')}
                                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 border rounded-xl hover:bg-gray-50"
                                style={{ borderColor: '#e8d9c4', color: '#2d2118' }}>
                                {copied === 'link' ? <Check size={15} style={{ color: '#4a7c59' }} /> : <Copy size={15} />}
                                {copied === 'link' ? 'Skopírované!' : 'Kopírovať link'}
                            </button>
                            <button onClick={handleEndObs} disabled={ending}
                                className="ml-auto flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl disabled:opacity-60"
                                style={{ background: '#dc2626' }}>
                                <StopCircle size={16} />
                                {ending ? 'Ukončujem...' : 'Ukončiť stream'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PulseLayout>
    );
}
