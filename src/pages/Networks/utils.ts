import type {
    IpRow,
    Machine,
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

export function buildIpRows(
    netId: string,
    net: Network | undefined,
    machines: Machine[],
): IpRow[] {
    if (!net) return [];
    if (net.type !== 'core') return machines.map(m => ({ip: m.ip, machine: m}));

    const {start, end}  = cidrRange(net.cidr);
    const map           = Object.fromEntries(machines.map(m => [m.ip, m]));
    const rows: IpRow[] = [];
    for (let i = start; i <= end; i++) {
        const ip = intToIp(i);
        rows.push({ip, machine: map[ip] ?? null});
    }
    return rows;
}

export function networkStats(rows: IpRow[]) {
    const ms = rows.filter(r => r.machine);
    return {
        total    : rows.length,
        allocated: ms.length,
        on       : ms.filter(r => r.machine!.power === 'on').length,
        off      : ms.filter(r => r.machine!.power === 'off').length,
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