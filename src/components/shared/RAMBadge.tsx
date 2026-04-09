import {Badge} from '@mantine/core';

const RAM_BADGE_COLORS = ['gray', 'blue', 'cyan', 'teal', 'lime', 'yellow', 'orange', 'red', 'grape'] as const;

export interface RamBadgeConfig {
    label: string;
    color: (typeof RAM_BADGE_COLORS)[number];
}

function formatRamLabel(gib: number) {
    if (gib >= 1024) {
        const tib = gib / 1024;
        const formatted = Number.isInteger(tib) ? `${tib}` : tib.toFixed(1).replace(/\.0$/, '');
        return `${formatted} TiB`;
    }

    return `${gib} GiB`;
}

export function getRamBadgeConfig(ramGiB: number): RamBadgeConfig {
    if (!Number.isFinite(ramGiB) || ramGiB <= 0) {
        return {label: '—', color: 'gray'};
    }

    const normalized = Math.max(1, Math.round(ramGiB));
    const colorIndex = Math.min(RAM_BADGE_COLORS.length - 1, Math.floor(Math.log2(normalized)) + 1);

    return {
        label: formatRamLabel(normalized),
        color: RAM_BADGE_COLORS[colorIndex],
    };
}

export function RAMBadge({ramGiB}: { ramGiB: number }) {
    const {label, color} = getRamBadgeConfig(ramGiB);

    return (
        <Badge
            color={color}
            variant="light"
            size="sm"
            radius="sm"
            style={{fontFamily: 'var(--mantine-font-family-monospace)', letterSpacing: '0.06em'}}
        >
            {label}
        </Badge>
    );
}

