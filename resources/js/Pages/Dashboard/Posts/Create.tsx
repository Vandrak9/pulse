import PulseLayout from '@/Layouts/PulseLayout';
import { Head, router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';

interface Props {
    coach: {
        id: number;
        subscriber_count: number;
    };
}

interface MediaPreview {
    file: File;
    url: string;
    type: 'image' | 'video';
}

export default function PostCreate({ coach }: Props) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isExclusive, setIsExclusive] = useState(false);
    const [previews, setPreviews] = useState<MediaPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((files: File[]) => {
        const remaining = 3 - previews.length;
        const toAdd = files.slice(0, remaining);
        const newPreviews: MediaPreview[] = toAdd.map(file => ({
            file,
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' : 'image',
        }));
        setPreviews(prev => [...prev, ...newPreviews]);
    }, [previews.length]);

    function removeMedia(index: number) {
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    }

    function insertMarkdown(before: string, after: string = '') {
        const ta = document.getElementById('post-content') as HTMLTextAreaElement;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.slice(start, end);
        const newContent =
            content.slice(0, start) + before + selected + after + content.slice(end);
        setContent(newContent);
        setTimeout(() => {
            ta.selectionStart = start + before.length;
            ta.selectionEnd = start + before.length + selected.length;
            ta.focus();
        }, 0);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) {
            setError('Zadaj názov príspevku.');
            return;
        }
        setError(null);
        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('is_exclusive', isExclusive ? '1' : '0');
        previews.forEach(p => formData.append('media[]', p.file));

        router.post('/dashboard/posts', formData, {
            forceFormData: true,
            onProgress: (p) => {
                if (p?.percentage != null) setProgress(p.percentage);
            },
            onError: (errs) => {
                setError(Object.values(errs)[0] as string ?? 'Chyba pri uverejnení.');
                setUploading(false);
            },
            onFinish: () => setUploading(false),
        });
    }

    const canSubmit = title.trim().length > 0 && !uploading;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    return (
        <PulseLayout>
            <Head title="Nový príspevok" />

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px 60px' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#c4714a', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                        Dashboard
                    </p>
                    <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: '#2d2118', margin: 0 }}>
                        Nový príspevok
                    </h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

                        {/* ── Left: composer ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Title */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Názov príspevku…"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    maxLength={255}
                                    style={{
                                        width: '100%', padding: '14px 16px',
                                        fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700,
                                        color: '#2d2118', background: 'white',
                                        border: '1px solid #e8d9c4', borderRadius: 12,
                                        outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {/* Markdown toolbar */}
                            <div style={{
                                display: 'flex', gap: 4, flexWrap: 'wrap',
                                background: 'white', border: '1px solid #e8d9c4',
                                borderRadius: '12px 12px 0 0', padding: '8px 12px',
                            }}>
                                {[
                                    { label: 'B', action: () => insertMarkdown('**', '**') },
                                    { label: 'I', action: () => insertMarkdown('_', '_') },
                                    { label: 'H2', action: () => insertMarkdown('## ') },
                                    { label: 'H3', action: () => insertMarkdown('### ') },
                                    { label: '— List', action: () => insertMarkdown('- ') },
                                    { label: '1. List', action: () => insertMarkdown('1. ') },
                                    { label: '> Quote', action: () => insertMarkdown('> ') },
                                ].map(btn => (
                                    <button
                                        key={btn.label}
                                        type="button"
                                        onClick={btn.action}
                                        style={{
                                            padding: '4px 10px', borderRadius: 6,
                                            border: '1px solid #e8d9c4', background: '#faf6f0',
                                            fontSize: 12, fontWeight: 600, color: '#2d2118',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#fce8de')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#faf6f0')}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content textarea */}
                            <div style={{ marginTop: -16 }}>
                                <textarea
                                    id="post-content"
                                    placeholder="Napíš obsah príspevku… (podporuje Markdown)"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    rows={10}
                                    style={{
                                        width: '100%', padding: '14px 16px',
                                        fontSize: 14, lineHeight: '1.6',
                                        color: '#2d2118', background: 'white',
                                        border: '1px solid #e8d9c4', borderTop: 'none',
                                        borderRadius: '0 0 12px 12px',
                                        outline: 'none', resize: 'vertical',
                                        boxSizing: 'border-box', fontFamily: 'inherit',
                                    }}
                                />
                                <p style={{ fontSize: 11, color: '#9a8a7a', textAlign: 'right', marginTop: 4 }}>
                                    {wordCount} slov
                                </p>
                            </div>

                            {/* Media drop zone */}
                            <div>
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onClick={() => previews.length < 3 && fileInputRef.current?.click()}
                                    style={{
                                        border: `2px dashed ${dragOver ? '#c4714a' : '#e8d9c4'}`,
                                        borderRadius: 12, padding: '24px 16px',
                                        textAlign: 'center', cursor: previews.length >= 3 ? 'default' : 'pointer',
                                        background: dragOver ? '#fce8de' : 'white',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                                    <p style={{ fontSize: 13, color: '#9a8a7a', margin: 0 }}>
                                        {previews.length >= 3
                                            ? 'Maximum 3 súbory'
                                            : 'Presuň sem obrázky/videá alebo klikni'}
                                    </p>
                                    <p style={{ fontSize: 11, color: '#9a8a7a', margin: '4px 0 0' }}>
                                        JPG, PNG, GIF, WebP, MP4, MOV, WebM — max 80 MB/súbor
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                        if (e.target.files) addFiles(Array.from(e.target.files));
                                        e.target.value = '';
                                    }}
                                />
                            </div>

                            {/* Media previews */}
                            {previews.length > 0 && (
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {previews.map((p, i) => (
                                        <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 10, overflow: 'hidden', border: '1px solid #e8d9c4' }}>
                                            {p.type === 'image' ? (
                                                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <video src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(i)}
                                                style={{
                                                    position: 'absolute', top: 4, right: 4,
                                                    width: 22, height: 22, borderRadius: '50%',
                                                    background: 'rgba(0,0,0,0.6)', color: 'white',
                                                    border: 'none', cursor: 'pointer',
                                                    fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >
                                                ×
                                            </button>
                                            <div style={{
                                                position: 'absolute', bottom: 4, left: 4,
                                                background: 'rgba(0,0,0,0.5)', color: 'white',
                                                fontSize: 9, padding: '2px 5px', borderRadius: 4,
                                            }}>
                                                {p.type === 'video' ? '🎬' : '📸'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

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

                        {/* ── Right: options + preview ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Audience selector */}
                            <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: '16px' }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2d2118', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Publikum
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label
                                        onClick={() => setIsExclusive(false)}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 12,
                                            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                                            border: `1.5px solid ${!isExclusive ? '#c4714a' : '#e8d9c4'}`,
                                            background: !isExclusive ? '#fce8de' : 'white',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ fontSize: 20 }}>🌍</span>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', margin: 0 }}>Verejný</p>
                                            <p style={{ fontSize: 11, color: '#9a8a7a', margin: '2px 0 0' }}>Všetci followersi + predplatitelia</p>
                                        </div>
                                        <input type="radio" name="audience" checked={!isExclusive} onChange={() => setIsExclusive(false)} style={{ marginLeft: 'auto' }} />
                                    </label>
                                    <label
                                        onClick={() => setIsExclusive(true)}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 12,
                                            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                                            border: `1.5px solid ${isExclusive ? '#c4714a' : '#e8d9c4'}`,
                                            background: isExclusive ? '#fce8de' : 'white',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ fontSize: 20 }}>🔒</span>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: '#2d2118', margin: 0 }}>Exkluzívny</p>
                                            <p style={{ fontSize: 11, color: '#9a8a7a', margin: '2px 0 0' }}>Len predplatitelia</p>
                                        </div>
                                        <input type="radio" name="audience" checked={isExclusive} onChange={() => setIsExclusive(true)} style={{ marginLeft: 'auto' }} />
                                    </label>
                                </div>
                            </div>

                            {/* Reach estimate */}
                            <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: '16px' }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2d2118', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Dosah
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fce8de', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                        {isExclusive ? '🔒' : '📢'}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 22, fontWeight: 700, color: '#c4714a', margin: 0, fontFamily: 'Georgia, serif' }}>
                                            {coach.subscriber_count.toLocaleString('sk-SK')}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#9a8a7a', margin: 0 }}>
                                            {isExclusive ? 'predplatiteľov dostane notifikáciu' : 'followersi + predplatitelia'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Post preview card */}
                            {(title || content) && (
                                <div style={{ background: 'white', border: '1px solid #e8d9c4', borderRadius: 14, padding: '14px', overflow: 'hidden' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9a8a7a', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                                        Náhľad
                                    </p>
                                    {isExclusive && (
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#c4714a', background: '#fce8de', padding: '2px 8px', borderRadius: 999, display: 'inline-block', marginBottom: 6 }}>
                                            🔒 EXKLUZÍVNE
                                        </span>
                                    )}
                                    {title && (
                                        <p style={{ fontSize: 14, fontWeight: 700, color: '#2d2118', margin: '0 0 6px', lineHeight: '1.3' }}>
                                            {title}
                                        </p>
                                    )}
                                    {content && (
                                        <p style={{ fontSize: 12, color: '#6b5e52', margin: 0, lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                            {content}
                                        </p>
                                    )}
                                    {previews.length > 0 && (
                                        <div style={{ marginTop: 8, height: 60, display: 'flex', gap: 4 }}>
                                            {previews.slice(0, 3).map((p, i) => (
                                                <div key={i} style={{ flex: 1, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                                                    {p.type === 'image' ? (
                                                        <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', background: '#2d2118', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit button */}
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
                                {uploading ? `Uverejňujem… ${progress}%` : '📤 Uverejniť príspevok'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </PulseLayout>
    );
}
