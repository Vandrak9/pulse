import PulseLayout from '@/Layouts/PulseLayout';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface Props {
    coach: {
        id: number;
        subscriber_count: number;
        followers_count: number;
    };
}

export default function ReelCreate({ coach }: Props) {
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleVideoSelect(file: File) {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        const url = URL.createObjectURL(file);
        setVideoFile(file);
        setVideoUrl(url);

        // Get duration
        const video = document.createElement('video');
        video.src = url;
        video.onloadedmetadata = () => setVideoDuration(Math.round(video.duration));
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleVideoSelect(file);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) { setError('Zadaj názov reelu.'); return; }
        if (!videoFile) { setError('Nahraj video súbor.'); return; }
        setError(null);
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('caption', caption);
        formData.append('video', videoFile);

        router.post('/dashboard/reels', formData, {
            forceFormData: true,
            onProgress: p => { if (p?.percentage != null) setProgress(p.percentage); },
            onError: errs => {
                setError(Object.values(errs)[0] as string ?? 'Chyba pri uverejnení.');
                setUploading(false);
            },
            onFinish: () => setUploading(false),
        });
    }

    const canSubmit = title.trim().length > 0 && !!videoFile && !uploading;
    const durationWarning = videoDuration !== null && videoDuration > 60;
    const totalReach = coach.followers_count + coach.subscriber_count;

    return (
        <PulseLayout>
            <Head title="Nový reel" />

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 16px 60px' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#c4714a', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                        Dashboard
                    </p>
                    <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                        Nový reel ⚡
                    </h1>
                    <p style={{ fontSize: 13, color: '#9a8a7a', margin: '6px 0 0' }}>
                        Reely sú verejné — dostihnú všetkých tvojich followerov.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

                        {/* ── Left: upload + fields ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Video upload zone */}
                            {!videoFile ? (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${dragOver ? '#c4714a' : '#e8d9c4'}`,
                                        borderRadius: 16, cursor: 'pointer',
                                        background: dragOver ? '#fce8de' : 'white',
                                        transition: 'all 0.15s',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        padding: '60px 24px', textAlign: 'center',
                                        aspectRatio: '9/16', maxHeight: 480,
                                    }}
                                >
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2d2118', margin: '0 0 6px' }}>
                                        Nahraj video (9:16)
                                    </p>
                                    <p style={{ fontSize: 12, color: '#9a8a7a', margin: 0 }}>
                                        MP4, MOV, WebM — max 200 MB
                                    </p>
                                    <p style={{ fontSize: 11, color: '#9a8a7a', margin: '4px 0 0' }}>
                                        Odporúčaná dĺžka: do 60 sekúnd
                                    </p>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '9/16', maxHeight: 480 }}>
                                    <video
                                        src={videoUrl!}
                                        controls
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (videoUrl) URL.revokeObjectURL(videoUrl);
                                            setVideoFile(null);
                                            setVideoUrl(null);
                                            setVideoDuration(null);
                                        }}
                                        style={{
                                            position: 'absolute', top: 10, right: 10,
                                            background: 'rgba(0,0,0,0.7)', color: 'white',
                                            border: 'none', borderRadius: 999,
                                            padding: '6px 12px', fontSize: 12, fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Zmeniť
                                    </button>
                                    {videoDuration !== null && (
                                        <div style={{
                                            position: 'absolute', bottom: 10, left: 10,
                                            background: 'rgba(0,0,0,0.7)', color: 'white',
                                            borderRadius: 999, padding: '4px 10px', fontSize: 12,
                                        }}>
                                            {videoDuration}s
                                        </div>
                                    )}
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm"
                                style={{ display: 'none' }}
                                onChange={e => {
                                    if (e.target.files?.[0]) handleVideoSelect(e.target.files[0]);
                                    e.target.value = '';
                                }}
                            />

                            {/* Duration warning */}
                            {durationWarning && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 10,
                                    background: '#fffbeb', border: '1px solid #f6e05e',
                                    fontSize: 13, color: '#744210',
                                }}>
                                    ⚠️ Video je dlhšie ako 60 sekúnd ({videoDuration}s). Odporúčame kratšie reely pre lepší dosah.
                                </div>
                            )}

                            {/* Title */}
                            <input
                                type="text"
                                placeholder="Názov reelu…"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                maxLength={255}
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700,
                                    color: '#2d2118', background: 'white',
                                    border: '1px solid #e8d9c4', borderRadius: 12,
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />

                            {/* Caption */}
                            <textarea
                                placeholder="Popis / caption (voliteľné)…"
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                maxLength={5000}
                                rows={4}
                                style={{
                                    width: '100%', padding: '12px 16px',
                                    fontSize: 14, color: '#2d2118', background: 'white',
                                    border: '1px solid #e8d9c4', borderRadius: 12,
                                    outline: 'none', resize: 'vertical',
                                    boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: '1.5',
                                }}
                            />

                            {/* Upload progress */}
                            {uploading && (
                                <div>
                                    <div style={{ height: 4, background: '#f0e8df', borderRadius: 2, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progress}%`, background: '#c4714a', transition: 'width 0.3s' }} />
                                    </div>
                                    <p style={{ fontSize: 12, color: '#9a8a7a', marginTop: 4 }}>{progress}% nahraté…</p>
                                </div>
                            )}

                            {error && (
                                <p style={{ fontSize: 13, color: '#e53e3e', padding: '10px 14px', background: '#fff5f5', borderRadius: 8, border: '1px solid #fed7d7' }}>
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* ── Right: stats + tips + publish ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Reach */}
                            <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: 16 }}>
                                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                                    Dosah reelu
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: '#6b5e52' }}>👥 Followersi</span>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif' }}>
                                            {coach.followers_count.toLocaleString('sk-SK')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: '#6b5e52' }}>⭐ Predplatitelia</span>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif' }}>
                                            {coach.subscriber_count.toLocaleString('sk-SK')}
                                        </span>
                                    </div>
                                    <div style={{ borderTop: '1px solid #f0e8df', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#2d2118' }}>⚡ Celkový dosah</span>
                                        <span style={{ fontSize: 20, fontWeight: 700, color: '#c4714a', fontFamily: 'Georgia, serif' }}>
                                            {totalReach.toLocaleString('sk-SK')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: 16 }}>
                                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                                    Tipy pre reely
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        { icon: '📱', text: 'Natáčaj vertikálne (9:16)' },
                                        { icon: '⏱️', text: 'Do 60 sekúnd = väčší dosah' },
                                        { icon: '🎵', text: 'Začni zaujímavo — prvé 3s rozhodujú' },
                                        { icon: '💡', text: 'Dobré svetlo = profesionálny vzhľad' },
                                    ].map((tip, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: 14, flexShrink: 0 }}>{tip.icon}</span>
                                            <span style={{ fontSize: 12, color: '#6b5e52', lineHeight: '1.45' }}>{tip.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reel badge */}
                            <div style={{
                                background: 'linear-gradient(135deg, #c4714a 0%, #f5a623 100%)',
                                borderRadius: 14, padding: 16, color: 'white', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
                                <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Reely sú vždy verejné</p>
                                <p style={{ fontSize: 12, opacity: 0.85, margin: 0 }}>Notifikácia ide všetkým followerom</p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                style={{
                                    width: '100%', padding: '14px',
                                    borderRadius: 12, border: 'none',
                                    background: canSubmit ? '#c4714a' : '#e8d9c4',
                                    color: canSubmit ? 'white' : '#9a8a7a',
                                    fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#5a3e2b'; }}
                                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#c4714a'; }}
                            >
                                {uploading ? `Nahrávam… ${progress}%` : '⚡ Uverejniť reel'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </PulseLayout>
    );
}
