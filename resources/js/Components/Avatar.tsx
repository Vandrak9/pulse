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
    /** Show green/gray online status dot */
    showOnlineStatus?: boolean;
    /** Whether user is currently online (< 5 min since last_seen_at) */
    isOnline?: boolean;
    /** Additional style overrides on the outer circle */
    style?: React.CSSProperties;
    className?: string;
}

/**
 * Consistent avatar component used across PULSE.
 * Shows the photo if available, otherwise a terracotta circle with initials.
 * Optionally renders a green/gray online status dot.
 */
export default function Avatar({
    src, name, size = 40,
    showRing = false,
    showOnlineStatus = false,
    isOnline = false,
    style, className,
}: AvatarProps) {
    const dotSize = size < 32 ? 8 : size < 48 ? 10 : 13;

    const inner = src ? (
        <img
            src={src}
            alt={name}
            className={showOnlineStatus ? undefined : className}
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
                ...(!showOnlineStatus ? style : {}),
            } as React.CSSProperties}
        />
    ) : (
        <div
            style={{
                width: size, height: size,
                borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#c4714a', color: 'white',
                fontSize: Math.round(size * 0.35), fontWeight: 700,
                ...(showRing ? { border: '4px solid white' } : {}),
                ...(!showOnlineStatus ? style : {}),
            }}
            className={showOnlineStatus ? undefined : className}
        >
            {getInitials(name)}
        </div>
    );

    if (!showOnlineStatus) return inner;

    return (
        <div
            className={className}
            style={{
                position: 'relative', display: 'inline-flex',
                flexShrink: 0, width: size, height: size,
                ...style,
            }}
        >
            {inner}
            <div style={{
                position: 'absolute',
                bottom: size < 32 ? 0 : 1,
                right: size < 32 ? 0 : 1,
                width: dotSize, height: dotSize,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#22c55e' : '#9ca3af',
                border: '2px solid white',
                zIndex: 10,
            }} />
        </div>
    );
}
