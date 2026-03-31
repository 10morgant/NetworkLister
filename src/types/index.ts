export type PowerState = 'on' | 'off' | 'suspended';

export interface Network {
    id: number;
    name: string;
    description?: string;
    core: boolean;
}

export interface NetworksResponse {
    networks: Network[];
}

export interface GuestNetworkEntry {
    name: string;
    ips: string[];
}

export interface Guest {
    id: string;
    name: string;
    description?: string;
    folder?: string;
    group?: string;
    sub_group?: string;
    os?: string;
    ip?: string;
    power: PowerState;
    power_on_time?: string | null;
    power_off_time?: string | null;
    created?: string;
    owner?: string;
    cpu: number;
    ram: number;
    custom_fields?: Record<string, string>;
    networks: Network[];
    network_objs: GuestNetworkEntry[];
}

/** Backwards-compat alias */
export type Machine = Guest;

/** One IP → one guest (normal, non-clashing row from the API) */
export interface IPGuest {
    ip: string;
    guest: Guest;
}

/** One IP → multiple guests (clash: same IP assigned to more than one machine) */
export interface IPGuests {
    ip: string;
    guests: Guest[];
}

/** Full response from GET /networks/:id */
export interface NetworkGuests {
    network: Network;
    guests: IPGuest[];
    clashes: IPGuests[];
}

/** One sub-group entry inside a tree group */
export interface GuestTreeSubGroup {
    name: string;
    guests: Guest[];
}

/** One group entry from GET /guests/tree */
export interface GuestTreeGroup {
    name: string;
    sub_groups: GuestTreeSubGroup[];
}

/** Full response from GET /guests/tree */
export interface GuestTreeResponse {
    groups: GuestTreeGroup[];
}

export interface StatOverview {
    total_guests: number
    guests_on: number
    guests_off: number
    guests_suspended: number
    total_networks: number
    core_networks: number
    user_networks: number
    ip_clashes: number
}

export interface StatResources {
    total_cpus: number,
    total_ram_gib: number,
    avg_cpus_per_guest: number,
    avg_ram_gib_per_guest: number,
    cpu_distribution: CpuDistribution
    ram_distribution: RamDistribution
}

export type CpuDistribution = Record<string, number>;
export type RamDistribution = Record<string, number>;

export interface StatAge {
    buckets: Buckets
    oldest_guest: string
    oldest_created: string
    newest_guest: string
    newest_created: string
}

export interface Buckets {
    "<30d": number
    "30–90d": number
    "90–180d": number
    "180d–1y": number
    ">1y": number
    unknown: number
}

export interface StatOwner {
    by_owner: ByOwner[]
    unowned: number
}

export interface ByOwner {
    owner: string
    total: number
    on: number
    off: number
    suspended: number
}

export interface StatNetwork {
    network_id: string
    network_name: string
    type: string
    total_ips: number
    allocated: number
    on: number
    off: number
    suspended: number
    clashes: number
}

export interface StatNetworks {
    networks: StatNetwork[]
}

