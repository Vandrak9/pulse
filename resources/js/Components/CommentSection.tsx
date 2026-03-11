import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

interface Comment {
    id: number;
    content: string;
    parent_id: number | null;
    created_at: string;
    user: { id: number; name: string; avatar: string | null };
    is_own: boolean;
    replies: Comment[];
}

interface Props {
    postId: number;
    isGuest: boolean;
    onCountChange?: (n: number) => void;
}

function Avatar({ name, url, size = 28 }: { name: string; url: string | null; size?: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: '#c4714a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: Math.round(size * 0.42),
        }}>
            {url
                ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : name.charAt(0)
            }
        </div>
    );
}

export default function CommentSection({ postId, isGuest, onCountChange }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    // top-level comment input
    const [commentInput, setCommentInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // reply state — which ROOT comment id is being replied to
    const [replyingTo, setReplyingTo] = useState<{ rootId: number; name: string } | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);
    const replyRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`/feed/posts/${postId}/comments`)
            .then(({ data }) => setComments(data))
            .finally(() => setLoading(false));
    }, [postId]);

    useEffect(() => {
        if (replyingTo) setTimeout(() => replyRef.current?.focus(), 30);
    }, [replyingTo?.rootId]);

    function countAll(list: Comment[]): number {
        return list.reduce((acc, c) => acc + 1 + c.replies.length, 0);
    }

    function openReply(rootId: number, name: string) {
        if (replyingTo?.rootId === rootId) {
            setReplyingTo(null);
            setReplyText('');
        } else {
            setReplyingTo({ rootId, name });
            setReplyText('');
        }
    }

    async function submitComment() {
        const content = commentInput.trim();
        if (!content) return;
        setSubmitting(true);
        try {
            const { data } = await axios.post(`/feed/posts/${postId}/comments`, { content });
            const updated = [data, ...comments];
            setComments(updated);
            onCountChange?.(countAll(updated));
            setCommentInput('');
        } catch {} finally {
            setSubmitting(false);
        }
    }

    async function submitReply() {
        if (!replyingTo || !replyText.trim()) return;
        const { rootId } = replyingTo;
        setReplySubmitting(true);
        try {
            const { data } = await axios.post(`/feed/posts/${postId}/comments`, {
                content: replyText.trim(),
                parent_id: rootId,
            });
            const updated = comments.map(c =>
                c.id === rootId ? { ...c, replies: [...c.replies, data] } : c
            );
            setComments(updated);
            onCountChange?.(countAll(updated));
            setReplyText('');
            // keep input open for more replies
        } catch {} finally {
            setReplySubmitting(false);
        }
    }

    function handleDelete(commentId: number, parentId: number | null) {
        axios.delete(`/feed/comments/${commentId}`).then(() => {
            let updated: Comment[];
            if (parentId) {
                updated = comments.map(c =>
                    c.id === parentId
                        ? { ...c, replies: c.replies.filter(r => r.id !== commentId) }
                        : c
                );
            } else {
                updated = comments.filter(c => c.id !== commentId);
                if (replyingTo?.rootId === commentId) setReplyingTo(null);
            }
            setComments(updated);
            onCountChange?.(countAll(updated));
        });
    }

    return (
        <div style={{ borderTop: '1px solid #e8d9c4', padding: '12px 16px 14px' }}>
            {loading ? (
                <p style={{ fontSize: 12, color: '#9a8a7a', marginBottom: 10 }}>Načítavam…</p>
            ) : comments.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9a8a7a', marginBottom: 10 }}>Zatiaľ žiadne komentáre. Buď prvý!</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 10 }}>
                    {comments.map((c) => (
                        <div key={c.id} style={{ marginBottom: 10 }}>
                            {/* Top-level comment */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <Avatar name={c.user.name} url={c.user.avatar} size={28} />
                                <div style={{ flex: 1, background: '#faf6f0', borderRadius: 12, padding: '6px 10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#2d2118' }}>{c.user.name}</span>
                                        <span style={{ fontSize: 11, color: '#9a8a7a', flexShrink: 0, marginLeft: 6 }}>{c.created_at}</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#4a3728', margin: 0, lineHeight: 1.45 }}>{c.content}</p>
                                </div>
                                {c.is_own && (
                                    <button onClick={() => handleDelete(c.id, null)}
                                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9a8a7a', fontSize: 12 }}
                                        title="Zmazať">✕</button>
                                )}
                            </div>

                            {/* Reply button row */}
                            {!isGuest && (
                                <div style={{ paddingLeft: 36, marginTop: 3 }}>
                                    <button onClick={() => openReply(c.id, c.user.name)}
                                        style={{
                                            fontSize: 11, fontWeight: 600, background: 'none', border: 'none',
                                            cursor: 'pointer', padding: '1px 0',
                                            color: replyingTo?.rootId === c.id ? '#5a3e2b' : '#c4714a',
                                        }}>
                                        {replyingTo?.rootId === c.id ? '✕ Zrušiť' : 'Odpovedať'}
                                    </button>
                                </div>
                            )}

                            {/* Inline reply input */}
                            {replyingTo?.rootId === c.id && (
                                <div style={{ paddingLeft: 36, marginTop: 5 }}>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <input
                                            ref={replyRef}
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitReply()}
                                            placeholder={`Odpovedať @${replyingTo.name}…`}
                                            maxLength={500}
                                            style={{
                                                flex: 1, borderRadius: 999, border: '1px solid #e8d9c4',
                                                padding: '6px 12px', fontSize: 12, outline: 'none',
                                                backgroundColor: '#faf6f0', color: '#2d2118',
                                            }}
                                            onFocus={(e) => (e.currentTarget.style.borderColor = '#c4714a')}
                                            onBlur={(e) => (e.currentTarget.style.borderColor = '#e8d9c4')}
                                        />
                                        <button onClick={submitReply}
                                            disabled={replySubmitting || !replyText.trim()}
                                            style={{
                                                padding: '6px 12px', borderRadius: 999, border: 'none',
                                                backgroundColor: '#c4714a', color: 'white',
                                                fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                                                opacity: replySubmitting || !replyText.trim() ? 0.4 : 1,
                                            }}>
                                            {replySubmitting ? '…' : 'Odoslať'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Replies */}
                            {c.replies.length > 0 && (
                                <div style={{ paddingLeft: 36, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {c.replies.map((reply) => (
                                        <div key={reply.id}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                <Avatar name={reply.user.name} url={reply.user.avatar} size={24} />
                                                <div style={{ flex: 1, background: '#f0e8df', borderRadius: 12, padding: '5px 10px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#2d2118' }}>{reply.user.name}</span>
                                                        <span style={{ fontSize: 10, color: '#9a8a7a', flexShrink: 0, marginLeft: 6 }}>{reply.created_at}</span>
                                                    </div>
                                                    <p style={{ fontSize: 12, color: '#4a3728', margin: 0, lineHeight: 1.4 }}>{reply.content}</p>
                                                </div>
                                                {reply.is_own && (
                                                    <button onClick={() => handleDelete(reply.id, reply.parent_id)}
                                                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9a8a7a', fontSize: 11 }}
                                                        title="Zmazať">✕</button>
                                                )}
                                            </div>
                                            {/* Reply to a reply — goes to same root thread */}
                                            {!isGuest && (
                                                <div style={{ paddingLeft: 32, marginTop: 2 }}>
                                                    <button onClick={() => openReply(c.id, reply.user.name)}
                                                        style={{
                                                            fontSize: 11, fontWeight: 600, background: 'none', border: 'none',
                                                            cursor: 'pointer', padding: '1px 0',
                                                            color: replyingTo?.rootId === c.id ? '#5a3e2b' : '#c4714a',
                                                        }}>
                                                        {replyingTo?.rootId === c.id ? '✕ Zrušiť' : 'Odpovedať'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* New comment input */}
            {!isGuest && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
                        placeholder="Napíš komentár…"
                        maxLength={500}
                        style={{
                            flex: 1, borderRadius: 999, border: '1px solid #e8d9c4',
                            padding: '8px 14px', fontSize: 13, outline: 'none',
                            backgroundColor: '#faf6f0', color: '#2d2118',
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = '#c4714a')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = '#e8d9c4')}
                    />
                    <button onClick={submitComment}
                        disabled={submitting || !commentInput.trim()}
                        style={{
                            padding: '8px 16px', borderRadius: 999, border: 'none',
                            backgroundColor: '#c4714a', color: 'white',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                            opacity: submitting || !commentInput.trim() ? 0.4 : 1,
                        }}>
                        {submitting ? '…' : 'Odoslať'}
                    </button>
                </div>
            )}
        </div>
    );
}
