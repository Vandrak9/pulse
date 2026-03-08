import PulseLayout from '@/Layouts/PulseLayout';
import { Head, router } from '@inertiajs/react';
import { useRef, useState } from 'react';

interface Props {
    coach: {
        id: number;
        subscriber_count: number;
        followers_count: number;
        monthly_price: string;
    };
}

type MediaTab = 'photo' | 'video';

interface PhotoPreview {
    file: File;
    url: string;
}

export default function PostCreate({ coach }: Props) {
    const [title, setTitle]             = useState('');
    const [content, setContent]         = useState('');
    const [isExclusive, setIsExclusive] = useState(true);   // default exclusive
    const [mediaTab, setMediaTab]       = useState<MediaTab>('photo');

    // Photo state
    const [photos, setPhotos]           = useState<PhotoPreview[]>([]);
    const [photoDragOver, setPhotoDragOver] = useState(false);
    const photoInputRef                 = useRef<HTMLInputElement>(null);

    // Video state
    const [videoFile, setVideoFile]     = useState<File | null>(null);
    const [videoUrl, setVideoUrl]       = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const [videoDragOver, setVideoDragOver] = useState(false);
    const videoInputRef                 = useRef<HTMLInputElement>(null);

    // Submit state
    const [uploading, setUploading]     = useState(false);
    const [progress, setProgress]       = useState(0);
    const [error, setError]             = useState<string | null>(null);

    // ── Photo handlers ────────────────────────────────────────────────────────

    function addPhotos(files: File[]) {
        const remaining = 3 - photos.length;
        const toAdd = files
            .filter(f => f.type.startsWith('image/'))
            .slice(0, remaining);
        const newPreviews: PhotoPreview[] = toAdd.map(file => ({
            file,
            url: URL.createObjectURL(file),
        }));
        setPhotos(prev => [...prev, ...newPreviews]);
    }

    function removePhoto(index: number) {
        setPhotos(prev => {
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
    }

    // ── Video handlers ────────────────────────────────────────────────────────

    function setVideo(file: File) {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        const url = URL.createObjectURL(file);
        setVideoFile(file);
        setVideoUrl(url);
        const vid = document.createElement('video');
        vid.src = url;
        vid.onloadedmetadata = () => setVideoDuration(Math.round(vid.duration));
    }

    function clearVideo() {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoFile(null);
        setVideoUrl(null);
        setVideoDuration(null);
    }

    // ── Markdown toolbar ──────────────────────────────────────────────────────

    function insertMarkdown(before: string, after = '') {
        const ta = document.getElementById('post-content') as HTMLTextAreaElement;
        if (!ta) return;
        const s = ta.selectionStart;
        const e = ta.selectionEnd;
        const sel = content.slice(s, e);
        setContent(content.slice(0, s) + before + sel + after + content.slice(e));
        setTimeout(() => {
            ta.selectionStart = s + before.length;
            ta.selectionEnd   = s + before.length + sel.length;
            ta.focus();
        }, 0);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) { setError('Zadaj názov príspevku.'); return; }
        if (mediaTab === 'video' && !videoFile) { setError('Nahraj video súbor.'); return; }
        setError(null);
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('is_exclusive', isExclusive ? '1' : '0');

        if (mediaTab === 'photo') {
            photos.forEach(p => formData.append('media[]', p.file));
        } else if (videoFile) {
            formData.append('media[]', videoFile);
        }

        router.post('/dashboard/posts', formData, {
            forceFormData: true,
            onProgress: p => { if (p?.percentage != null) setProgress(p.percentage); },
            onError: errs => {
                setError(Object.values(errs)[0] as string ?? 'Chyba pri uverejnení.');
                setUploading(false);
            },
            onFinish: () => setUploading(false),
        });
    }

    // ── Derived values ────────────────────────────────────────────────────────

    const canSubmit    = title.trim().length > 0 && !uploading;
    const wordCount    = content.trim().split(/\s+/).filter(Boolean).length;
    const price        = parseFloat(coach.monthly_price) || 0;
    const estimatedEarnings = (coach.subscriber_count * price * 0.85).toFixed(2);
    const showExclusiveVideoPreview = isExclusive && mediaTab === 'video' && !!videoFile;
    const videoSizeMB  = videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) : null;

    const tabStyle = (active: boolean) => ({
        padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', border: 'none', transition: 'all 0.15s',
        background: active ? '#c4714a' : 'transparent',
        color: active ? 'white' : '#9a8a7a',
    });

    return (
        <PulseLayout>
            <Head title="Nový príspevok" />

            <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 16px 80px' }}>

                {/* ── Header ── */}
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#c4714a', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                        Dashboard
                    </p>
                    <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                        Nový príspevok
                    </h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

                        {/* ── LEFT: composer ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Title */}
                            <input
                                type="text"
                                placeholder="Názov príspevku…"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                maxLength={255}
                                style={{
                                    width: '100%', padding: '14px 16px', boxSizing: 'border-box',
                                    fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700,
                                    color: '#2d2118', background: 'white',
                                    border: '1px solid #e8d9c4', borderRadius: 12, outline: 'none',
                                }}
                            />

                            {/* Markdown toolbar + textarea */}
                            <div>
                                <div style={{
                                    display: 'flex', gap: 4, flexWrap: 'wrap',
                                    background: 'white', border: '1px solid #e8d9c4',
                                    borderRadius: '12px 12px 0 0', padding: '8px 12px',
                                }}>
                                    {[
                                        { label: 'B',       action: () => insertMarkdown('**', '**') },
                                        { label: 'I',       action: () => insertMarkdown('_', '_') },
                                        { label: 'H2',      action: () => insertMarkdown('## ') },
                                        { label: 'H3',      action: () => insertMarkdown('### ') },
                                        { label: '— List',  action: () => insertMarkdown('- ') },
                                        { label: '1. List', action: () => insertMarkdown('1. ') },
                                        { label: '> Quote', action: () => insertMarkdown('> ') },
                                    ].map(btn => (
                                        <button key={btn.label} type="button" onClick={btn.action}
                                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e8d9c4', background: '#faf6f0', fontSize: 12, fontWeight: 600, color: '#2d2118', cursor: 'pointer' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#fce8de')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '#faf6f0')}
                                        >{btn.label}</button>
                                    ))}
                                </div>
                                <textarea
                                    id="post-content"
                                    placeholder="Napíš obsah príspevku… (podporuje Markdown)"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    rows={8}
                                    style={{
                                        width: '100%', padding: '14px 16px', boxSizing: 'border-box',
                                        fontSize: 14, lineHeight: '1.6', color: '#2d2118',
                                        background: 'white', border: '1px solid #e8d9c4',
                                        borderTop: 'none', borderRadius: '0 0 12px 12px',
                                        outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                                    }}
                                />
                                <p style={{ fontSize: 11, color: '#9a8a7a', textAlign: 'right', marginTop: 4 }}>
                                    {wordCount} slov
                                </p>
                            </div>

                            {/* ── Media section ── */}
                            <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, overflow: 'hidden' }}>

                                {/* Tab switcher */}
                                <div style={{ display: 'flex', gap: 4, padding: '12px 14px', borderBottom: '1px solid #f0e8df', background: '#faf6f0' }}>
                                    <button type="button" onClick={() => setMediaTab('photo')} style={tabStyle(mediaTab === 'photo')}>
                                        📸 Fotka
                                    </button>
                                    <button type="button" onClick={() => setMediaTab('video')} style={tabStyle(mediaTab === 'video')}>
                                        🎬 Video
                                    </button>
                                </div>

                                <div style={{ padding: 16 }}>

                                    {/* ── 📸 Photo tab ── */}
                                    {mediaTab === 'photo' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {photos.length < 3 && (
                                                <div
                                                    onDrop={e => { e.preventDefault(); setPhotoDragOver(false); addPhotos(Array.from(e.dataTransfer.files)); }}
                                                    onDragOver={e => { e.preventDefault(); setPhotoDragOver(true); }}
                                                    onDragLeave={() => setPhotoDragOver(false)}
                                                    onClick={() => photoInputRef.current?.click()}
                                                    style={{
                                                        border: `2px dashed ${photoDragOver ? '#c4714a' : '#e8d9c4'}`,
                                                        borderRadius: 10, padding: '28px 16px',
                                                        textAlign: 'center', cursor: 'pointer',
                                                        background: photoDragOver ? '#fce8de' : '#faf6f0',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                                                    <p style={{ fontSize: 13, color: '#2d2118', fontWeight: 600, margin: '0 0 4px' }}>
                                                        Presuň fotky sem alebo klikni
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#9a8a7a', margin: 0 }}>
                                                        JPG, PNG, WebP, HEIC — max 80 MB · až 3 fotky · prvá = náhľad
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                ref={photoInputRef}
                                                type="file" multiple
                                                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                                style={{ display: 'none' }}
                                                onChange={e => { if (e.target.files) addPhotos(Array.from(e.target.files)); e.target.value = ''; }}
                                            />

                                            {photos.length > 0 && (
                                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                    {photos.map((p, i) => (
                                                        <div key={i} style={{ position: 'relative', width: 110, height: 110, borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === 0 ? '#c4714a' : '#e8d9c4'}` }}>
                                                            <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button type="button" onClick={() => removePhoto(i)} style={{
                                                                position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                                                                borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: 'white',
                                                                border: 'none', cursor: 'pointer', fontSize: 13, lineHeight: 1,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}>×</button>
                                                            {i === 0 && (
                                                                <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#c4714a', color: 'white', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                                    COVER
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {photos.length < 3 && (
                                                        <div onClick={() => photoInputRef.current?.click()} style={{
                                                            width: 110, height: 110, borderRadius: 10,
                                                            border: '2px dashed #e8d9c4', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer', color: '#9a8a7a', fontSize: 28,
                                                            background: '#faf6f0',
                                                        }}>+</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ── 🎬 Video tab ── */}
                                    {mediaTab === 'video' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {!videoFile ? (
                                                <div
                                                    onDrop={e => { e.preventDefault(); setVideoDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) setVideo(f); }}
                                                    onDragOver={e => { e.preventDefault(); setVideoDragOver(true); }}
                                                    onDragLeave={() => setVideoDragOver(false)}
                                                    onClick={() => videoInputRef.current?.click()}
                                                    style={{
                                                        border: `2px dashed ${videoDragOver ? '#c4714a' : '#e8d9c4'}`,
                                                        borderRadius: 10, padding: '40px 16px',
                                                        textAlign: 'center', cursor: 'pointer',
                                                        background: videoDragOver ? '#fce8de' : '#faf6f0',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
                                                    <p style={{ fontSize: 13, color: '#2d2118', fontWeight: 600, margin: '0 0 4px' }}>
                                                        Presuň video sem alebo klikni
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#9a8a7a', margin: 0 }}>
                                                        MP4, MOV, WebM — max 200 MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    {/* Video preview */}
                                                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#000', aspectRatio: '16/9' }}>
                                                        <video src={videoUrl!} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

                                                        {/* Exclusive overlay preview */}
                                                        {showExclusiveVideoPreview && (
                                                            <div style={{
                                                                position: 'absolute', inset: 0,
                                                                backdropFilter: 'blur(12px)',
                                                                background: 'rgba(0,0,0,0.45)',
                                                                display: 'flex', flexDirection: 'column',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                gap: 8,
                                                            }}>
                                                                <div style={{ fontSize: 36 }}>🔒</div>
                                                                <p style={{ fontSize: 13, color: 'white', fontWeight: 700, margin: 0 }}>Exkluzívne video</p>
                                                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                                                                    Len predplatitelia uvidia toto video
                                                                </p>
                                                                <button type="button" onClick={e => { e.stopPropagation(); }} style={{ display: 'none' }} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* File info */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b5e52' }}>
                                                            <span>📁 {videoFile.name}</span>
                                                            <span>💾 {videoSizeMB} MB</span>
                                                            {videoDuration != null && <span>⏱ {videoDuration}s</span>}
                                                        </div>
                                                        <button type="button" onClick={clearVideo} style={{
                                                            fontSize: 12, color: '#c4714a', background: 'none',
                                                            border: 'none', cursor: 'pointer', fontWeight: 600,
                                                        }}>
                                                            Zmeniť
                                                        </button>
                                                    </div>

                                                    {/* Exclusive badge */}
                                                    {isExclusive && (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                            padding: '10px 14px', borderRadius: 10,
                                                            background: '#fce8de', border: '1px solid #f0c9b2',
                                                        }}>
                                                            <span style={{ fontSize: 18 }}>🔒</span>
                                                            <div>
                                                                <p style={{ fontSize: 13, fontWeight: 700, color: '#c4714a', margin: 0 }}>
                                                                    Exkluzívne video
                                                                </p>
                                                                <p style={{ fontSize: 11, color: '#9a8a7a', margin: 0 }}>
                                                                    Len predplatitelia uvidia toto video
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <input
                                                ref={videoInputRef}
                                                type="file"
                                                accept="video/mp4,video/quicktime,video/webm,video/mov"
                                                style={{ display: 'none' }}
                                                onChange={e => { if (e.target.files?.[0]) setVideo(e.target.files[0]); e.target.value = ''; }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload progress */}
                            {uploading && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, color: '#9a8a7a' }}>Nahrávam…</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#c4714a' }}>{progress}%</span>
                                    </div>
                                    <div style={{ height: 6, background: '#f0e8df', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${progress}%`, background: '#c4714a', transition: 'width 0.3s', borderRadius: 3 }} />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p style={{ fontSize: 13, color: '#e53e3e', padding: '10px 14px', background: '#fff5f5', borderRadius: 8, border: '1px solid #fed7d7', margin: 0 }}>
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* ── RIGHT: options panel ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* ── Audience selector — two cards side by side ── */}
                            <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: 16 }}>
                                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                                    Publikum
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {/* Public */}
                                    <button
                                        type="button"
                                        onClick={() => setIsExclusive(false)}
                                        style={{
                                            padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                                            border: `2px solid ${!isExclusive ? '#4a7c59' : '#e8d9c4'}`,
                                            background: !isExclusive ? '#f0faf4' : 'white',
                                            textAlign: 'left', transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ fontSize: 22, marginBottom: 6 }}>🌍</div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: !isExclusive ? '#4a7c59' : '#2d2118', margin: '0 0 4px' }}>
                                            Verejný
                                        </p>
                                        <p style={{ fontSize: 11, color: '#9a8a7a', margin: '0 0 8px', lineHeight: '1.4' }}>
                                            Všetci sledovatelia dostanú notifikáciu
                                        </p>
                                        <p style={{ fontSize: 10, color: '#9a8a7a', margin: 0, lineHeight: '1.3' }}>
                                            Vhodné pre Reels a ukážky
                                        </p>
                                    </button>

                                    {/* Exclusive */}
                                    <button
                                        type="button"
                                        onClick={() => setIsExclusive(true)}
                                        style={{
                                            padding: '14px 10px', borderRadius: 12, cursor: 'pointer',
                                            border: `2px solid ${isExclusive ? '#c4714a' : '#e8d9c4'}`,
                                            background: isExclusive ? '#fce8de' : 'white',
                                            textAlign: 'left', transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ fontSize: 22, marginBottom: 6 }}>🔒</div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: isExclusive ? '#c4714a' : '#2d2118', margin: '0 0 4px' }}>
                                            Exkluzívny
                                        </p>
                                        <p style={{ fontSize: 11, color: '#9a8a7a', margin: '0 0 8px', lineHeight: '1.4' }}>
                                            Len predplatitelia majú prístup
                                        </p>
                                        <p style={{ fontSize: 10, color: '#9a8a7a', margin: 0, lineHeight: '1.3' }}>
                                            Vhodné pre prémiový obsah
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* ── Earnings estimate ── */}
                            {isExclusive && coach.subscriber_count > 0 && (
                                <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: 16 }}>
                                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                                        Odhadovaný dosah
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                            <span style={{ color: '#6b5e52' }}>🔒 Predplatitelia</span>
                                            <span style={{ fontWeight: 700, color: '#2d2118', fontFamily: 'Georgia, serif' }}>
                                                {coach.subscriber_count.toLocaleString('sk-SK')}
                                            </span>
                                        </div>
                                        <div style={{ borderTop: '1px solid #f0e8df', paddingTop: 8 }}>
                                            <p style={{ fontSize: 11, color: '#9a8a7a', margin: '0 0 4px' }}>
                                                💰 Pri {coach.subscriber_count} predplatiteľoch po €{price.toFixed(2)}
                                            </p>
                                            <p style={{ fontSize: 18, fontWeight: 700, color: '#c4714a', margin: 0, fontFamily: 'Georgia, serif' }}>
                                                €{estimatedEarnings}/mes
                                            </p>
                                            <p style={{ fontSize: 10, color: '#9a8a7a', margin: '2px 0 0' }}>
                                                tvoj podiel (85% z príjmov)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Post preview ── */}
                            {(title || content || photos.length > 0 || videoFile) && (
                                <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: 14, overflow: 'hidden' }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                                        Náhľad príspevku
                                    </p>
                                    {isExclusive && (
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#c4714a', background: '#fce8de', padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginBottom: 6 }}>
                                            🔒 EXKLUZÍVNE
                                        </span>
                                    )}
                                    {title && (
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#2d2118', margin: '0 0 4px', lineHeight: '1.3' }}>
                                            {title}
                                        </p>
                                    )}
                                    {content && (
                                        <p style={{ fontSize: 12, color: '#6b5e52', margin: 0, lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                            {content}
                                        </p>
                                    )}

                                    {/* Photo preview grid */}
                                    {mediaTab === 'photo' && photos.length > 0 && (
                                        <div style={{ marginTop: 8, display: 'flex', gap: 4, height: 64 }}>
                                            {photos.slice(0, 3).map((p, i) => (
                                                <div key={i} style={{ flex: 1, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                                                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {isExclusive && i > 0 && (
                                                        <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔒</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Video preview (blurred if exclusive) */}
                                    {mediaTab === 'video' && videoFile && (
                                        <div style={{ marginTop: 8, height: 64, borderRadius: 6, overflow: 'hidden', position: 'relative', background: '#000' }}>
                                            <video src={videoUrl!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                            {isExclusive && (
                                                <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <span style={{ fontSize: 16 }}>🔒</span>
                                                    <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>Exkluzívne</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Submit ── */}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                style={{
                                    width: '100%', padding: '15px',
                                    borderRadius: 12, border: 'none',
                                    background: canSubmit ? '#c4714a' : '#e8d9c4',
                                    color: canSubmit ? 'white' : '#9a8a7a',
                                    fontSize: 15, fontWeight: 700,
                                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#5a3e2b'; }}
                                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#c4714a'; }}
                            >
                                {uploading
                                    ? `Nahrávam… ${progress}%`
                                    : isExclusive
                                        ? '🔒 Uverejniť exkluzívne'
                                        : '📤 Uverejniť príspevok'}
                            </button>

                            <p style={{ fontSize: 11, color: '#9a8a7a', textAlign: 'center', margin: 0 }}>
                                Príspevok sa zobrazí vo feede ihneď po uverejnení
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </PulseLayout>
    );
}
