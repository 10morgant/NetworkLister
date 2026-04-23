import type {
    Guest,
    GuestTreeResponse,
    NetworkGuests,
    ReviewGuestsResponse,
} from '@/types';
import { API_BASE } from '@/api/base';

const DAY_MS = 1000 * 60 * 60 * 24;

function isArchivedGuest(guest: Guest) {
    if (guest.folder?.includes('ArchivedProjects')) return true;

    const archivedField = Object.entries(guest.custom_fields ?? {}).find(([key]) =>
        key.toLowerCase() === 'archived'
    )?.[1];

    return archivedField?.toLowerCase() === 'true';
}

/**
 * Review-page data contract.
 *
 * Today this is composed client-side from `/guests/all` so the UI can ship
 * immediately. If/when the backend exposes `GET /guests/review`, this function
 * can switch implementations without changing the page.
 */
export async function fetchGuestsReview({
    minAgeDays,
    includeArchived = false,
}: {
    minAgeDays: number;
    includeArchived?: boolean;
}): Promise<ReviewGuestsResponse> {
    const guests = await fetchGuestsAll();
    const minAgeMs = minAgeDays * DAY_MS;

    const agedGuests = guests.filter((guest) => {
        if (!guest.created) return false;
        return Date.now() - new Date(guest.created).getTime() >= minAgeMs;
    });

    const items = agedGuests
        .filter((guest) => includeArchived || !isArchivedGuest(guest))
        .sort((a, b) => new Date(a.created ?? 0).getTime() - new Date(b.created ?? 0).getTime());

    return {
        items,
        summary: {
            total    : items.length,
            on       : items.filter((guest) => guest.power === 'on').length,
            off      : items.filter((guest) => guest.power === 'off').length,
            suspended: items.filter((guest) => guest.power === 'suspended').length,
            archived : agedGuests.filter(isArchivedGuest).length,
        },
    };
}

export async function fetchMachinesByNetwork(networkId: string): Promise<NetworkGuests> {
    const res = await fetch(`${API_BASE}/networks/${networkId}`);
    if (!res.ok) throw new Error('Network error');
    return res.json();
}

/** GET /guests/tree — nested group → sub_group → guests tree */
export async function fetchGuestsTree(): Promise<GuestTreeResponse> {
    const res = await fetch(`${API_BASE}/guests/tree`);
    if (!res.ok) throw new Error('Failed to fetch guests tree');
    return res.json();
}

/** GET /guests/group/{group}/sub_group/{subGroup} — guests for a specific sub-group */
export async function fetchGuestsBySubGroup(group: string, subGroup: string): Promise<Guest[]> {
    const res = await fetch(`${API_BASE}/guests/group/${encodeURIComponent(group)}/sub_group/${encodeURIComponent(subGroup)}`);
    if (!res.ok) throw new Error(`Failed to fetch guests for ${group}/${subGroup}`);
    return res.json();
}

/** GET /guests/group/{group} — all guests for a group across all sub-groups */
export async function fetchGuestsByGroup(group: string): Promise<Guest[]> {
    const res = await fetch(`${API_BASE}/guests/group/${encodeURIComponent(group)}`);
    if (!res.ok) throw new Error(`Failed to fetch guests for group ${group}`);
    return res.json();
}
export async function fetchGuestsOn(): Promise<Guest[]> {
    const res = await fetch(`${API_BASE}/guests/on`);
    if (!res.ok) throw new Error('Failed to fetch powered-on guests');
    return res.json();
}

/** GET /guests/all — every guest regardless of power state */
export async function fetchGuestsAll(): Promise<Guest[]> {
    const res = await fetch(`${API_BASE}/guests/all`);
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