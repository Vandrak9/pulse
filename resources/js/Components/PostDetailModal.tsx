import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import CommentSection from '@/Components/CommentSection';

interface PostCoach {
    id: number;
    name: string;
    specialization: string | null;
    monthly_price: string;
    is_subscribed: boolean;
    avatar_url: string | null;
}

interface PostDetail {
    id: number;
    title: string;
    content: string;
    media_type: 'none' | 'image' | 'video';
    media_url: string | null;
    thumbnail_url: string | null;
    video_type: 'reel' | 'video' | null;
    video_duration: number | null;
    is_exclusive: boolean;
    like_count: number;
    comment_count: number;
    is_liked: boolean;
    created_at: string;
    coach: PostCoach;
}

interface Props {
    postId: number | null;
    onClose: () => void;
    isGuest?: boolean;
}

function relTime(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'práve teraz';
    if (diff < 3600) return `pred ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `pred ${Math.floor(diff / 3600)} hod`;
    return `pred ${Math.floor(diff / 86400)} d`;
}

function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: '#c4714a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: Math.round(size * 0.4),
        }}>
            {url
                ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : name.charAt(0)
            }
        </div>
    );
}

export default function PostDetailModal({ postId, onClose, isGuest = false }: Props) {
    const [post, setPost] = useState<PostDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);

    useEffect(() => {
        if (!postId) return;
        setLoading(true);
        setPost(null);

        axios.get(`/api/posts/${postId}`).then(({ data }) => {
            setPost(data);
            setIsLiked(data.is_liked);
            setLikeCount(data.like_count);
            setCommentCount(data.comment_count);
        }).finally(() => setLoading(false));
    }, [postId]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        if (!postId) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [postId]);

    function toggleLike() {
        if (!post || isGuest) return;
        const wasLiked = isLiked;
        setIsLiked(!wasLiked);
        setLikeCount(c => c + (wasLiked ? -1 : 1));
        router.post(`/feed/like/${post.id}`, {}, { preserveScroll: true, preserveState: true });
    }

    if (!postId) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9000,
                backgroundColor: 'rgba(0,0,0,0.65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                backgroundColor: 'white', borderRadius: 20,
                width: '100%', maxWidth: 720, maxHeight: '92dvh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px',
                    borderBottom: '1px solid #e8d9c4', flexShrink: 0,
                }}>
                    {post && (
                        <Link href={`/coaches/${post.coach.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1 }}>
                            <Avatar name={post.coach.name} url={post.coach.avatar_url} />
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#2d2118', margin: 0 }}>{post.coach.name}</p>
                                {post.coach.specialization && (
                                    <p style={{ fontSize: 12, color: '#c4714a', margin: 0 }}>{post.coach.specialization}</p>
                                )}
                            </div>
                        </Link>
                    )}
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: '50%', border: 'none',
                        background: '#f0e8df', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, color: '#2d2118',
                    }}>✕</button>
                </div>

                {/* Scrollable body */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9a8a7a' }}>
                            Načítavam…
                        </div>
                    )}

                    {post && (
                        <>
                            {/* Media */}
                            {post.media_type !== 'none' && (
                                <div style={{ width: '100%', backgroundColor: '#0d0a07' }}>
                                    {post.is_exclusive ? (
                                        <div style={{
                                            aspectRatio: '16/9', display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center', position: 'relative',
                                        }}>
                                            {post.thumbnail_url && (
                                                <img src={post.thumbnail_url} alt="" style={{
                                                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                                                    objectFit: 'cover', opacity: 0.15, filter: 'blur(10px)', transform: 'scale(1.05)',
                                                }} />
                                            )}
                                            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                                                <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
                                                <p style={{ color: 'white', fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Exkluzívny obsah</p>
                                                <Link href={`/coaches/${post.coach.id}`} style={{
                                                    padding: '10px 24px', borderRadius: 999, backgroundColor: '#c4714a',
                                                    color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 13,
                                                }}>
                                                    Predplatiť za €{parseFloat(post.coach.monthly_price).toFixed(2)}/mes
                                                </Link>
                                            </div>
                                        </div>
                                    ) : post.media_type === 'video' && post.media_url ? (
                                        <video src={post.media_url} controls
                                            style={{ width: '100%', maxHeight: '55dvh', display: 'block' }}
                                            poster={post.thumbnail_url ?? undefined} />
                                    ) : post.media_url ? (
                                        <img src={post.media_url} alt={post.title}
                                            style={{ width: '100%', maxHeight: '55dvh', objectFit: 'contain', display: 'block' }} />
                                    ) : null}
                                </div>
                            )}

                            {/* Action bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px 0' }}>
                                <button onClick={toggleLike} style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 12px', borderRadius: 999, border: 'none',
                                    background: isLiked ? '#fce8de' : '#f5f5f5',
                                    cursor: isGuest ? 'default' : 'pointer',
                                    fontSize: 14, fontWeight: 600,
                                    color: isLiked ? '#c4714a' : '#9a8a7a',
                                }}>
                                    <span>{isLiked ? '❤️' : '🤍'}</span>
                                    {likeCount > 0 && <span>{likeCount}</span>}
                                </button>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 12px', borderRadius: 999,
                                    background: '#f5f5f5', fontSize: 14, fontWeight: 600, color: '#9a8a7a',
                                }}>
                                    <span>💬</span>
                                    {commentCount > 0 && <span>{commentCount}</span>}
                                </div>
                                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9a8a7a' }}>
                                    {relTime(post.created_at)}
                                </span>
                            </div>

                            {/* Text content */}
                            <div style={{ padding: '8px 16px 12px' }}>
                                {post.title && (
                                    <p style={{ fontSize: 15, fontWeight: 700, color: '#2d2118', marginBottom: 6 }}>{post.title}</p>
                                )}
                                {post.content && (
                                    <p style={{ fontSize: 14, color: '#4a3728', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                                )}
                            </div>

                            <div style={{ height: 1, background: '#e8d9c4' }} />

                            {/* Comments via shared component */}
                            <CommentSection
                                postId={post.id}
                                isGuest={isGuest}
                                onCountChange={setCommentCount}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
