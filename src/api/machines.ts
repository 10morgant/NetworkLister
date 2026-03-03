import type { Machine } from '@/types';
import { MACHINES } from '@/data/mock';

// Swap these functions for real fetch calls when ready.
// e.g. return fetch('/api/machines').then(r => r.json())

export async function fetchMachines(): Promise<Machine[]> {
    return MACHINES;
}

export async function fetchMachinesByNetwork(networkId: string): Promise<Machine[]> {
    return MACHINES.filter(m => m.network === networkId);
}

export async function fetchMachinesOlderThan(ms: number): Promise<Machine[]> {
    const cutoff = Date.now() - ms;
    return MACHINES.filter(m => new Date(m.created).getTime() < cutoff);
}

export async function deleteMachine(ip: string): Promise<void> {
    // await fetch(`/api/machines/${ip}`, { method: 'DELETE' });
    console.log('DELETE machine', ip);
}

export async function archiveMachine(ip: string): Promise<void> {
    // await fetch(`/api/machines/${ip}/archive`, { method: 'POST' });
    console.log('ARCHIVE machine', ip);
}