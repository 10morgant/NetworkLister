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

