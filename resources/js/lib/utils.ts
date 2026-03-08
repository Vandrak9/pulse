// Shared utility functions for PULSE frontend

/** Return up to 2 uppercase initials from a full name */
export function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

/** Format seconds as M:SS (e.g. 90 → "1:30") */
export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format a date string as "Dnes" / "Včera" / "7. marca 2026" (Slovak locale).
 * Used in chat date separators.
 */
export function formatChatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (msgDate.getTime() === today.getTime()) return 'Dnes';
    if (msgDate.getTime() === yesterday.getTime()) return 'Včera';
    return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'long' }).format(date);
}

/** Format a date string as "7. marca 2026" (Slovak locale, with year). */
export function formatFullDate(dateStr: string): string {
    return new Intl.DateTimeFormat('sk-SK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(dateStr));
}

/** Format a date as a relative time string in Slovak ("pred 5 min", "Včera", etc.) */
export function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return 'práve teraz';
    if (mins < 60) return `pred ${mins} min`;
    if (hrs < 24) return `pred ${hrs} ${hrs === 1 ? 'hodinou' : 'hodinami'}`;
    if (days === 1) return 'Včera';
    if (days < 7) return `pred ${days} ${days === 1 ? 'dnom' : 'dnami'}`;
    return new Intl.DateTimeFormat('sk-SK', { day: 'numeric', month: 'short' }).format(new Date(iso));
}

/** Format HH:MM in Slovak locale */
export function formatTime(dateStr: string): string {
    return new Intl.DateTimeFormat('sk-SK', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

/** True if two date strings fall on the same calendar day */
export function isSameDay(a: string, b: string): boolean {
    const da = new Date(a); const db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
           da.getMonth()    === db.getMonth() &&
           da.getDate()     === db.getDate();
}
