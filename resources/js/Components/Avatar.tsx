import React from 'react';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
    /** Image URL — if null/empty, initials fallback is shown */
    src: string | null | undefined;
    /** Full name used to generate initials fallback */
    name: string;
    /** Diameter in pixels (default 40) */
    size?: number;
    /** Extra border — e.g. showRing adds 4px white border */
    showRing?: boolean;
    /** Additional style overrides on the outer circle */
    style?: React.CSSProperties;
    className?: string;
}

/**
 * Consistent avatar component used across PULSE.
 * Shows the photo if available, otherwise a terracotta circle with initials.
 */
export default function Avatar({ src, name, size = 40, showRing = false, style, className }: AvatarProps) {
    const base: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(showRing ? { border: '4px solid white' } : {}),
        ...style,
    };

    if (src) {
        return (
            <div style={base} className={className}>
                <img
                    src={src}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
        );
    }

    return (
        <div
            style={{ ...base, background: '#c4714a', color: 'white', fontSize: Math.round(size * 0.35), fontWeight: 700 }}
            className={className}
        >
            {getInitials(name)}
        </div>
    );
}
