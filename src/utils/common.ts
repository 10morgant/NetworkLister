export function machineAgeMs(created: string) {
    return Date.now() - new Date(created).getTime();
}

export function fmtAge(ms: number) {
    const days = Math.floor(ms / 86400000);
    if (days >= 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
    if (days >= 30) return `${Math.floor(days / 30)}m ${days % 30}d`;
    return `${days}d`;
}

export function isWithinDays(dateStr: string, days: number) {
    return Date.now() - new Date(dateStr).getTime() < days * 86400000;
}