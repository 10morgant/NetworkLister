export type PowerState = 'on' | 'off' | 'suspended';

export interface Network {
    id: string;
    name: string;
    cidr?: string;
    core: boolean;
}

export interface NetworksResponse {
    networks: Network[];
}

export interface Machine {
    id: string;
    name: string;
    description?: string;
    folder: string;
    group: string;
    sub_group: string;
    os?: string;
    ip: string;
    power: PowerState;
    power_on_time: string | null;
    power_off_time: string | null;
    created: string;
    owner: string;
    cpu: number;
    ram: number;
    custom_fields?: Record<string, string>;
}

/** One IP → one guest (normal, non-clashing row from the API) */
export interface IPGuest {
    ip: string;
    guest: Machine;
}

/** One IP → multiple guests (clash: same IP assigned to more than one machine) */
export interface IPGuests {
    ip: string;
    guests: Machine[];
}

/** Full response from GET /networks/:id */
export interface NetworkGuests {
    network: Network;
    guests: IPGuest[];
    clashes: IPGuests[];
}