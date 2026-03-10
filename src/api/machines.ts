import type {
    Guest,
    GuestTreeResponse,
    NetworkGuests,
} from '@/types';

const BASE = 'http://localhost:8000';

export async function fetchMachinesByNetwork(networkId: string): Promise<NetworkGuests> {
    const res = await fetch(`${BASE}/networks/${networkId}`);
    if (!res.ok) throw new Error('Network error');
    return res.json();
}

/** GET /guests/tree — nested group → sub_group → guests tree */
export async function fetchGuestsTree(): Promise<GuestTreeResponse> {
    const res = await fetch(`${BASE}/guests/tree`);
    if (!res.ok) throw new Error('Failed to fetch guests tree');
    return res.json();
}

/** GET /guests/group/{group}/sub_group/{subGroup} — guests for a specific sub-group */
export async function fetchGuestsBySubGroup(group: string, subGroup: string): Promise<Guest[]> {
    const res = await fetch(`${BASE}/guests/group/${encodeURIComponent(group)}/sub_group/${encodeURIComponent(subGroup)}`);
    if (!res.ok) throw new Error(`Failed to fetch guests for ${group}/${subGroup}`);
    return res.json();
}

/** GET /guests/group/{group} — all guests for a group across all sub-groups */
export async function fetchGuestsByGroup(group: string): Promise<Guest[]> {
    const res = await fetch(`${BASE}/guests/group/${encodeURIComponent(group)}`);
    if (!res.ok) throw new Error(`Failed to fetch guests for group ${group}`);
    return res.json();
}
export async function fetchGuestsOn(): Promise<Guest[]> {
    const res = await fetch(`${BASE}/guests/on`);
    if (!res.ok) throw new Error('Failed to fetch powered-on guests');
    return res.json();
}

/** GET /guests/all — every guest regardless of power state */
export async function fetchGuestsAll(): Promise<Guest[]> {
    const res = await fetch(`${BASE}/guests/all`);
    if (!res.ok) throw new Error('Failed to fetch all guests');
    return res.json();
}

// Legacy helpers kept for other pages that haven't been migrated yet
export async function fetchMachines(): Promise<Guest[]> {
    return fetchGuestsAll();
}

export async function deleteMachine(ip: string): Promise<void> {
    console.log('DELETE machine', ip);
}

export async function archiveMachine(ip: string): Promise<void> {
    console.log('ARCHIVE machine', ip);
}