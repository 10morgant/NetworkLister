import { Box, Text } from '@mantine/core';

interface StatCardProps {
    label: string;
    value: string | number;
    color?: string;
    sub?: string;
    minWidth?: number;
}

export function StatCard({ label, value, color, sub, minWidth = 100 }: StatCardProps) {
    return (
        <Box
            px="sm" py="xs"
            style={{
                borderRadius: 'var(--mantine-radius-sm)',
                background: 'var(--surface-2)',
                borderLeft: `3px solid ${color ?? 'var(--mantine-color-dark-4)'}`,
                minWidth,
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 58,
            }}
        >
            <Text
                size="xl"
                fw={700}
                ff="monospace"
                lh={1}
                style={{ color: color ?? 'var(--mantine-color-dark-0)' }}
            >
                {value}
            </Text>
            <Text
                size="xs"
                fw={600}
                tt="uppercase"
                style={{
                    letterSpacing: '0.06em',
                    color: 'var(--mantine-color-dark-2)',
                    marginTop: 3,
                }}
            >
                {label}
            </Text>
            {sub && (
                <Text size="xs" style={{ color: 'var(--mantine-color-dark-3)', marginTop: 1 }}>
                    {sub}
                </Text>
            )}
        </Box>
    );
}