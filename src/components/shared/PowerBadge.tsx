import {Badge}           from '@mantine/core';
import type {PowerState} from '@/types';

export interface PowerStateMapping {
    name: string
    label: string;
    color: string
}

export const CFG: Record<PowerState, PowerStateMapping> = {
    on       : {name: 'on',        label: 'ON',        color: 'teal'},
    off      : {name: 'off',       label: 'OFF',       color: 'red'},
    suspended: {name: 'suspended', label: 'SUSPENDED', color: 'yellow'},
};

export function PowerBadge({state}: { state: PowerState }) {
    const {label, color} = CFG[state] ?? {label: state.toUpperCase(), color: 'gray'};
    return (
        <Badge color={color} variant="light" size="sm" radius="sm" tt="uppercase"
               style={{fontFamily: 'var(--mantine-font-family-monospace)', letterSpacing: '0.06em'}}>
            {label}
        </Badge>
    );
}