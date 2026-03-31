import type {
    StatOverview,
    StatResources,
    StatOwner,
    StatAge,
    StatNetworks
} from '@/types';

const BASE = 'http://localhost:8000';

export async function fetchStatsOverview(): Promise<StatOverview> {
    const res = await fetch(`${BASE}/stats/overview`);
    if (!res.ok) throw new Error('Network error');
    return res.json();
}

export async function fetchStatsResources(): Promise<StatResources> {
    const res = await fetch(`${BASE}/stats/resources`);
    if (!res.ok) throw new Error('Network error');
    return res.json();
}

export async function fetchStatsOwner(): Promise<StatOwner> {
    const res = await fetch(`${BASE}/stats/owners`);
    if (!res.ok) throw new Error('Network error');
    return res.json();
}

export async function fetchStatsAge(): Promise<StatAge> {
    const res = await fetch(`${BASE}/stats/age`);
    if (!res.ok) throw new Error('Network error');
    return res.json();
}

export async function fetchStatsNetworks(): Promise<StatNetworks> {
    const res = await fetch(`${BASE}/stats/network`);
    if (!res.ok) throw new Error('Network error');
    return res.json();
}
