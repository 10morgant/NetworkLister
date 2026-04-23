export function machineAgeMs(created: string) {
    return Date.now() - new Date(created).getTime();
}

/** Returns age in ms for a machine, or 0 if no created date. */
export function getMachineAge(machine: {created?: string | null}) {
    return machine.created ? machineAgeMs(machine.created) : 0;
}

export function fmtAge(ms: number) {
    const days = Math.floor(ms / 86400000);
    if (days >= 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
    if (days >= 30) return `${Math.floor(days / 30)}m ${days % 30}d`;
    return `${days}d`;
}

export function fmtDate(d: string | null) {
    return d ? new Date(d).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : '—';
}

export function fmtUptime(d: string | null) {
    if (!d) return '—';
    const diff = Date.now() - new Date(d).getTime();
    const day  = Math.floor(diff / 86400000);
    const h    = Math.floor((diff % 86400000) / 3600000);
    return day > 365 ? `${Math.floor(day / 365)}y ${day % 365}d` : day > 0 ? `${day}d ${h}h` : `${h}h`;
}

export function isWithinDays(dateStr: string, days: number) {
    return Date.now() - new Date(dateStr).getTime() < days * 86400000;
}