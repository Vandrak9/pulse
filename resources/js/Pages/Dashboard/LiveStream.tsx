import { Head, router } from '@inertiajs/react';
import PulseLayout from '@/Layouts/PulseLayout';
import { useState, useEffect, useRef, FormEventHandler } from 'react';
import axios from 'axios';
import {
    Radio, Copy, Eye, EyeOff, CheckCircle2, AlertCircle,
    Smartphone, Monitor, Users, Lock, Globe, StopCircle, ExternalLink
} from 'lucide-react';

interface ActiveStream {
    id: number;
    title: string;
    description: string | null;
    status: 'idle' | 'active' | 'disabled';
    access: 'subscribers' | 'everyone';
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
    const [showKey, setShowKey] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [access, setAccess] = useState<'subscribers' | 'everyone'>('subscribers');
    const [submitting, setSubmitting] = useState(false);
    const [ending, setEnding] = useState(false);
    const [elapsed, setElapsed] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Poll stream status every 5s
    useEffect(() => {
        if (!activeStream) return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`/live/${activeStream.id}/poll`);
                setStreamStatus(res.data.status);
                setActiveStream(prev => prev ? { ...prev, viewers_count: res.data.viewers_count } : prev);
            } catch { /* silent */ }
        }, 5000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
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

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post('/dashboard/live', { title, description, access }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const handleEnd = async () => {
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
                    <Radio size={24} style={{ color: '#c4714a' }} />
                    <h1 className="text-2xl font-bold" style={{ color: '#2d2118' }}>Live Stream</h1>
                    {streamStatus === 'active' && (
                        <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            LIVE
                        </span>
                    )}
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-5">
                        <CheckCircle2 size={16} />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5">
                        <AlertCircle size={16} />
                        {flash.error}
                    </div>
                )}

                {/* No active stream — create form */}
                {!activeStream && (
                    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#e8d9c4' }}>
                        <h2 className="text-lg font-semibold mb-5" style={{ color: '#2d2118' }}>
                            Spustiť nový stream
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#2d2118' }}>
                                    Názov streamu *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="napr. Ranný tréning naživo"
                                    required
                                    maxLength={200}
                                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2"
                                    style={{ borderColor: '#e8d9c4', color: '#2d2118' }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#2d2118' }}>
                                    Popis (voliteľné)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Čo bude obsahovať dnešný stream?"
                                    rows={3}
                                    maxLength={500}
                                    className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2"
                                    style={{ borderColor: '#e8d9c4', color: '#2d2118' }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#2d2118' }}>
                                    Kto môže sledovať
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer"
                                        style={{ borderColor: access === 'subscribers' ? '#c4714a' : '#e8d9c4', background: access === 'subscribers' ? '#fce8de' : 'white' }}>
                                        <input type="radio" name="access" value="subscribers"
                                            checked={access === 'subscribers'}
                                            onChange={() => setAccess('subscribers')}
                                            className="accent-[#c4714a]" />
                                        <Lock size={16} style={{ color: '#c4714a' }} />
                                        <div>
                                            <div className="text-sm font-medium" style={{ color: '#2d2118' }}>Len predplatitelia</div>
                                            <div className="text-xs" style={{ color: '#9a8a7a' }}>Iba platení predplatitelia uvidia stream</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer"
                                        style={{ borderColor: access === 'everyone' ? '#c4714a' : '#e8d9c4', background: access === 'everyone' ? '#fce8de' : 'white' }}>
                                        <input type="radio" name="access" value="everyone"
                                            checked={access === 'everyone'}
                                            onChange={() => setAccess('everyone')}
                                            className="accent-[#c4714a]" />
                                        <Globe size={16} style={{ color: '#4a7c59' }} />
                                        <div>
                                            <div className="text-sm font-medium" style={{ color: '#2d2118' }}>Všetci sledovatelia</div>
                                            <div className="text-xs" style={{ color: '#9a8a7a' }}>Všetci, ktorí ťa sledujú, uvidia stream zadarmo</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !title.trim()}
                                className="w-full flex items-center justify-center gap-2 text-white font-semibold rounded-xl py-3 transition disabled:opacity-50"
                                style={{ background: '#c4714a' }}
                            >
                                <Radio size={18} />
                                {submitting ? 'Vytváram...' : 'Vytvoriť stream'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Active stream — OBS/Larix info */}
                {activeStream && (
                    <div className="space-y-4">
                        {/* Status card */}
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="font-semibold text-lg" style={{ color: '#2d2118' }}>{activeStream.title}</h2>
                                    {activeStream.description && (
                                        <p className="text-sm mt-0.5" style={{ color: '#9a8a7a' }}>{activeStream.description}</p>
                                    )}
                                </div>
                                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                                    style={{
                                        background: streamStatus === 'active' ? '#fee2e2' : '#f0e8df',
                                        color: streamStatus === 'active' ? '#dc2626' : '#9a8a7a',
                                    }}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${streamStatus === 'active' ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                                    {streamStatus === 'active' ? `LIVE · ${elapsed}` : 'Čaká na pripojenie...'}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm" style={{ color: '#9a8a7a' }}>
                                <span className="flex items-center gap-1">
                                    <Users size={14} />
                                    {activeStream.viewers_count} divákov
                                </span>
                                <span className="flex items-center gap-1">
                                    {activeStream.access === 'subscribers' ? <Lock size={14} /> : <Globe size={14} />}
                                    {activeStream.access === 'subscribers' ? 'Len predplatitelia' : 'Všetci sledovatelia'}
                                </span>
                            </div>
                        </div>

                        {/* RTMP credentials */}
                        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                            <h3 className="font-semibold mb-4" style={{ color: '#2d2118' }}>Nastavenia pre OBS / Larix</h3>

                            {/* RTMP URL */}
                            <div className="mb-4">
                                <label className="text-xs font-medium uppercase tracking-wide mb-1.5 block" style={{ color: '#9a8a7a' }}>
                                    RTMP URL (Server)
                                </label>
                                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2.5" style={{ borderColor: '#e8d9c4' }}>
                                    <code className="flex-1 text-sm font-mono truncate" style={{ color: '#2d2118' }}>
                                        {activeStream.rtmp_url}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(activeStream.rtmp_url, 'rtmp')}
                                        className="shrink-0 p-1.5 rounded-lg transition hover:bg-gray-200"
                                        title="Kopírovať"
                                    >
                                        {copied === 'rtmp'
                                            ? <CheckCircle2 size={16} style={{ color: '#4a7c59' }} />
                                            : <Copy size={16} style={{ color: '#9a8a7a' }} />}
                                    </button>
                                </div>
                            </div>

                            {/* Stream Key */}
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide mb-1.5 block" style={{ color: '#9a8a7a' }}>
                                    Stream Key
                                </label>
                                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2.5" style={{ borderColor: '#e8d9c4' }}>
                                    <code className="flex-1 text-sm font-mono truncate" style={{ color: '#2d2118' }}>
                                        {showKey ? activeStream.stream_key : '●'.repeat(28)}
                                    </code>
                                    <button
                                        onClick={() => setShowKey(v => !v)}
                                        className="shrink-0 p-1.5 rounded-lg transition hover:bg-gray-200"
                                        title={showKey ? 'Skryť' : 'Zobraziť'}
                                    >
                                        {showKey
                                            ? <EyeOff size={16} style={{ color: '#9a8a7a' }} />
                                            : <Eye size={16} style={{ color: '#9a8a7a' }} />}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(activeStream.stream_key, 'key')}
                                        className="shrink-0 p-1.5 rounded-lg transition hover:bg-gray-200"
                                        title="Kopírovať"
                                    >
                                        {copied === 'key'
                                            ? <CheckCircle2 size={16} style={{ color: '#4a7c59' }} />
                                            : <Copy size={16} style={{ color: '#9a8a7a' }} />}
                                    </button>
                                </div>
                                <p className="text-xs mt-1.5" style={{ color: '#9a8a7a' }}>
                                    Nikdy nezdieľaj stream key s nikým.
                                </p>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Mobile */}
                            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Smartphone size={18} style={{ color: '#c4714a' }} />
                                    <h3 className="font-semibold text-sm" style={{ color: '#2d2118' }}>Mobil — Larix</h3>
                                </div>
                                <ol className="text-sm space-y-1.5 list-decimal list-inside" style={{ color: '#9a8a7a' }}>
                                    <li>Stiahni <strong>Larix Broadcaster</strong></li>
                                    <li>Connections → pridaj nové</li>
                                    <li>Vlož RTMP URL a Stream Key</li>
                                    <li>Stlač červené tlačidlo ●</li>
                                </ol>
                            </div>

                            {/* Desktop */}
                            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#e8d9c4' }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Monitor size={18} style={{ color: '#c4714a' }} />
                                    <h3 className="font-semibold text-sm" style={{ color: '#2d2118' }}>PC — OBS Studio</h3>
                                </div>
                                <ol className="text-sm space-y-1.5 list-decimal list-inside" style={{ color: '#9a8a7a' }}>
                                    <li>Otvor <strong>OBS Studio</strong></li>
                                    <li>Settings → Stream → Custom</li>
                                    <li>Vlož RTMP URL a Stream Key</li>
                                    <li>Klikni <strong>Start Streaming</strong></li>
                                </ol>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <a
                                href={`/live/${coach.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 border rounded-xl transition hover:bg-gray-50"
                                style={{ borderColor: '#e8d9c4', color: '#2d2118' }}
                            >
                                <ExternalLink size={15} />
                                Zobraziť stream
                            </a>

                            <button
                                onClick={() => copyToClipboard(`${appUrl}/live/${coach.id}`, 'link')}
                                className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 border rounded-xl transition hover:bg-gray-50"
                                style={{ borderColor: '#e8d9c4', color: '#2d2118' }}
                            >
                                {copied === 'link' ? <CheckCircle2 size={15} style={{ color: '#4a7c59' }} /> : <Copy size={15} />}
                                {copied === 'link' ? 'Skopírované!' : 'Kopírovať link'}
                            </button>

                            <button
                                onClick={handleEnd}
                                disabled={ending}
                                className="ml-auto flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition disabled:opacity-60"
                                style={{ background: '#dc2626' }}
                            >
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
