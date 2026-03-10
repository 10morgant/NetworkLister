import {
    Network,
    NetworksResponse
} from '@/types';

export async function fetchNetworks(): Promise<NetworksResponse> {
    const res = await fetch(`http://localhost:8000/networks`);
    if (!res.ok) throw new Error("Network error");
    return res.json();
}

export async function createNetwork(
    payload: Omit<Network, 'id'>,
    _credentials: { username: string; password: string },
): Promise<Network> {
    // await fetch('/api/networks', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Basic ' + btoa(`${_credentials.username}:${_credentials.password}`),
    //   },
    //   body: JSON.stringify(payload),
    // });
    return {...payload, id: `u-${Date.now()}`};
}

export async function updateNetwork(id: string, patch: Partial<Network>): Promise<Network> {
    // await fetch(`/api/networks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    const existing = NETWORKS.find(n => n.id === id)!;
    return {...existing, ...patch};
}

export async function deleteNetwork(id: string): Promise<void> {
    // await fetch(`/api/networks/${id}`, { method: 'DELETE' });
    console.log('DELETE network', id);
}