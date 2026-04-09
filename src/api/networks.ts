import {
    Network,
    NetworksResponse
} from '@/types';
import {API_BASE} from '@/api/base';

export async function fetchNetworks(): Promise<NetworksResponse> {
    const res = await fetch(`${API_BASE}/networks`);
    if (!res.ok) throw new Error("Network error");
    return res.json();
}

export async function createNetwork(
    payload: Omit<Network, 'id'>,
    _credentials: { username: string; password: string },
): Promise<Network> {
    // await fetch(`${API_BASE}/networks`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Basic ' + btoa(`${_credentials.username}:${_credentials.password}`),
    //   },
    //   body: JSON.stringify(payload),
    // });
    return {...payload, id: Date.now()};
}
