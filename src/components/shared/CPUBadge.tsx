import {Badge} from '@mantine/core';

const CPU_BADGE_COLORS = ['gray', 'blue', 'cyan', 'teal', 'lime', 'yellow', 'orange', 'red', 'grape'] as const;

export interface CpuBadgeConfig {
    label: string;
    color: (typeof CPU_BADGE_COLORS)[number];
}

export function getCpuBadgeConfig(cores: number): CpuBadgeConfig {
    if (!Number.isFinite(cores) || cores <= 0) {
        return {label: '—', color: 'gray'};
    }

    const normalized = Math.max(1, Math.round(cores));
    const colorIndex = Math.min(CPU_BADGE_COLORS.length - 1, Math.floor(Math.log2(normalized)) + 1);

    return {
        label: `${normalized} vCPU${normalized === 1 ? '' : 's'}`,
        color: CPU_BADGE_COLORS[colorIndex],
    };
}

export function CPUBadge({cores}: { cores: number }) {
    const {label, color} = getCpuBadgeConfig(cores);

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