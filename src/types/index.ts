export type NetworkType = 'core' | 'user';
export type PowerState = 'on' | 'off' | 'suspended';

export interface Network {
    id: string;
    name: string;
    cidr: string;
    type: NetworkType;
}

export interface Machine {
    ip: string;
    name: string;
    power: PowerState;
    folder: string;
    group: string;
    subgroup: string;
    owner: string;
    cpus: number;
    ram: number;
    created: string;
    uptime: string | null;
    network: string; // Network.id
    description?: string;
    vcenterUrl?: string;
}

export interface IpRow {
    ip: string;
    machine: Machine | null;
}