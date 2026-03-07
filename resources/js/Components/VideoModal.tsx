import { useEffect, useRef } from 'react';

interface VideoModalProps {
    videoUrl: string;
    title: string;
    coachName: string;
    onClose: () => void;
}

export default function VideoModal({ videoUrl, title, coachName, onClose }: VideoModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Close on Escape key
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
            onClick={onClose}
        >
            {/* Header */}
            <div
                className="flex flex-shrink-0 items-center justify-between px-4 py-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{coachName}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                    aria-label="Zavrieť"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Video player */}
            <div
                className="flex flex-1 items-center justify-center px-0"
                onClick={(e) => e.stopPropagation()}
            >
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    autoPlay
                    playsInline
                    controlsList="nodownload"
                    className="max-h-full w-full"
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                >
                    Váš prehliadač nepodporuje prehrávanie videa.
                </video>
            </div>

            {/* Bottom hint */}
            <div className="flex-shrink-0 py-3 text-center">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Klikni mimo videa pre zatvorenie</p>
            </div>
        </div>
    );
}
