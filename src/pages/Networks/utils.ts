import {
    IPGuest,
    IPGuests,
    Network
} from '@/types';

const ipToInt = (ip: string) => ip.split('.').reduce((a, o) => (a << 8) + parseInt(o, 10), 0) >>> 0;
const intToIp = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

function cidrRange(cidr: string) {
    const [base, bits] = cidr.split('/');
    const mask         = ~((1 << (32 - +bits)) - 1) >>> 0;
    const start        = (ipToInt(base) & mask) >>> 0;
    return {start, end: (start | ~mask) >>> 0};
}

/**
 * For core networks, pad `guests` to include every IP in the CIDR as a
 * nullable entry (guest: null) so the table shows the full address space.
 * Clash IPs are excluded from padding (they have their own rows).
 */
export function buildIpRows(
    net: Network | undefined,
    guests: IPGuest[],
    clashes: IPGuests[],
    pad: boolean = false
): Array<IPGuest | { ip: string; guest: null }> {
    if (!net) return guests;
    if (!pad || !net.cidr) return guests;

    const clashIps  = new Set(clashes.map(c => c.ip));
    const guestMap  = Object.fromEntries(guests.map(g => [g.ip, g]));
    const {start, end} = cidrRange(net.cidr);
    const rows: Array<IPGuest | { ip: string; guest: null }> = [];

    for (let i = start; i <= end; i++) {
        const ip = intToIp(i);
        if (clashIps.has(ip)) continue; // clash rows are rendered separately
        rows.push(guestMap[ip] ?? {ip, guest: null});
    }
    return rows;
}

export function networkStats(guests: IPGuest[], clashes: IPGuests[]) {
    const normalMachines = guests.map(g => g.guest);
    const clashMachines  = clashes.flatMap(c => c.guests);
    const all            = [...normalMachines, ...clashMachines];
    return {
        total    : guests.length + clashes.length,
        allocated: all.length,
        on       : all.filter(m => m.power === 'on').length,
        off      : all.filter(m => m.power === 'off').length,
    };
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