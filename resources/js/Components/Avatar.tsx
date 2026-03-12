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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(showRing ? { border: '4px solid white' } : {}),
        ...style,
    };

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={className}
                style={{
                    width: size, height: size,
                    minWidth: size, minHeight: size,
                    display: 'block', flexShrink: 0,
                    objectFit: 'cover', objectPosition: 'center',
                    clipPath: 'circle(50%)',
                    WebkitClipPath: 'circle(50%)',
                    transform: 'translateZ(0)',
                    WebkitTransform: 'translateZ(0)',
                    ...(showRing ? { outline: '4px solid white' } : {}),
                    ...style,
                } as React.CSSProperties}
            />
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
