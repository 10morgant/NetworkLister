import {
    IPGuest,
    IPGuests,
    Network
} from '@/types';

const ipToInt = (ip: string) => ip.split('.').reduce((a, o) => (a << 8) + parseInt(o, 10), 0) >>> 0;
const intToIp = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

/**
 * Infer a subnet range from a collection of IP addresses by finding the
 * longest common prefix (in bits) shared across all IPs, then deriving the
 * network/broadcast addresses from that prefix.
 *
 * e.g. ["10.0.0.1","10.0.0.5","10.0.0.20"] → { start: 10.0.0.0, end: 10.0.0.255 }
 */
function inferRange(ips: string[]): { start: number; end: number } | null {
    if (ips.length === 0) return null;

    const ints = ips.map(ipToInt);
    let commonBits = 32;

    for (let i = 1; i < ints.length; i++) {
        const xor = (ints[0] ^ ints[i]) >>> 0;
        // number of leading zeros in xor = length of shared prefix
        const leading = xor === 0 ? 32 : 32 - Math.floor(Math.log2(xor)) - 1;
        if (leading < commonBits) commonBits = leading;
    }

    const mask  = commonBits === 0 ? 0 : (~((1 << (32 - commonBits)) - 1)) >>> 0;
    const start = (ints[0] & mask) >>> 0;
    const end   = (start | (~mask >>> 0)) >>> 0;
    return {start, end};
}

/**
 * For core networks, pad `guests` to include every IP in the inferred subnet
 * as a nullable entry (guest: null) so the table shows the full address space.
 * The subnet is derived from the common prefix of all known IPs (guests +
 * clashes). Clash IPs are excluded from padding (they have their own rows).
 */
export function buildIpRows(
    net: Network | undefined,
    guests: IPGuest[],
    clashes: IPGuests[],
    pad: boolean = false
): Array<IPGuest | { ip: string; guest: null }> {
    if (!net) return guests;
    if (!pad) return guests;

    const allIps = [...guests.map(g => g.ip), ...clashes.map(c => c.ip)];
    const range  = inferRange(allIps);
    if (!range) return guests;

    const clashIps = new Set(clashes.map(c => c.ip));
    const guestMap = Object.fromEntries(guests.map(g => [g.ip, g]));
    const rows: Array<IPGuest | { ip: string; guest: null }> = [];

    for (let i = range.start; i <= range.end; i++) {
        const ip = intToIp(i);
        if (clashIps.has(ip)) continue; // clash rows rendered separately
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