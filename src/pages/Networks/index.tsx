import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
    Group, Stack, Badge, Text, ActionIcon, Box,
    Center, Loader, Alert,
} from '@mantine/core';
import { IconStar, IconStarFilled, IconAlertCircle } from '@tabler/icons-react';
import { fetchNetworks } from '@/api/networks';
import { fetchMachinesByNetwork } from '@/api/machines';
import { fetchMachines } from '@/api/machines';
import { queryKeys } from '@/api/queryKeys';
import { StatCard } from '@/components/shared/StatCard';
import { useStarred } from '@/context/starred';
import { NetworkSidebar } from './NetworkSidebar';
import { NetworkTable } from './NetworkTable';
import { buildIpRows, networkStats } from './utils';
import type { Network } from '@/types';

export default function NetworksPage() {
    const { starred, toggleStar } = useStarred();

    // Read selected network from URL
    const { networkId } = useParams({ from:'/networks/{-$networkId}' });
    const navigate = useNavigate();

    // When the sidebar selects a network, push to the new URL
    const handleSelect = (id: string) => {
        navigate({ to: '/networks/{-$networkId}', params: { networkId: id } });
    };

    // ── Queries ────────────────────────────────────────────────────────────────

    const {
        data: networks = [],
        isLoading: networksLoading,
        isError: networksError,
    } = useQuery({
        queryKey: queryKeys.networks,
        queryFn: fetchNetworks,
    });

    const {
        data: machines = [],
        isLoading: machinesLoading,
        isError: machinesError,
    } = useQuery({
        queryKey: queryKeys.machinesByNetwork(networkId),
        queryFn: () => fetchMachinesByNetwork(networkId),
        enabled: !!networkId,
    });

    // ── Derived state ──────────────────────────────────────────────────────────

    const net = networks.find((n: Network) => n.id === networkId);
    const isCore = net?.type === 'core';
    const accent = isCore ? 'blue' : 'cyan';

    const rows = useMemo(() => buildIpRows(networkId, net, machines), [networkId, net, machines]);
    const stats = useMemo(() => networkStats(rows), [rows]);

    // ── Loading / error states ─────────────────────────────────────────────────

    if (networksLoading) {
        return (
            <Center style={{ flex: 1 }}>
                <Loader size="sm" />
            </Center>
        );
    }

    if (networksError) {
        return (
            <Center style={{ flex: 1, padding: 24 }}>
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Failed to load networks">
                    Could not fetch network list. Check your connection and try again.
                </Alert>
            </Center>
        );
    }

    return (
        <Group gap={0} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} align="stretch">

            {/* ── Sidebar ── */}
            <NetworkSidebar
                networks={networks}
                selected={networkId}
                onSelect={handleSelect}
            />

            {/* ── Main panel ── */}
            <Stack gap={0} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>

                {/* Header */}
                <Box p="md" style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                    <Group justify="space-between" wrap="wrap" gap="sm">
                        <Group gap="sm">
                            <ActionIcon
                                variant="subtle" size="sm"
                                color={starred.has(networkId) ? 'yellow' : 'gray'}
                                onClick={() => toggleStar(networkId)}
                            >
                                {starred.has(networkId)
                                    ? <IconStarFilled size={16} />
                                    : <IconStar size={16} />}
                            </ActionIcon>
                            <Stack gap={2}>
                                <Group gap="xs">
                                    <Badge color={accent} variant="light" tt="uppercase" size="sm">
                                        {net?.type ?? '—'}
                                    </Badge>
                                    <Text fw={700} size="md">{net?.name ?? '—'}</Text>
                                </Group>
                                <Text size="xs" c="dimmed" ff="monospace">
                                    {net?.cidr}
                                    {isCore && (
                                        <Text component="span" c="dark.3" ml="xs">
                                            — full address space enumerated
                                        </Text>
                                    )}
                                </Text>
                            </Stack>
                        </Group>

                        {machinesLoading
                            ? <Loader size="xs" />
                            : (
                                <Group gap="xs">
                                    <StatCard label="Total" value={stats.total} />
                                    <StatCard label="Allocated" value={stats.allocated} color="var(--mantine-color-blue-5)" />
                                    <StatCard label="Online" value={stats.on} color="var(--mantine-color-teal-5)" />
                                    <StatCard label="Offline" value={stats.off} color="var(--mantine-color-red-5)" />
                                </Group>
                            )}
                    </Group>
                </Box>

                {/* Table */}
                {machinesError
                    ? (
                        <Center style={{ flex: 1, padding: 24 }}>
                            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Failed to load machines">
                                Could not fetch machines for this network.
                            </Alert>
                        </Center>
                    )
                    : (
                        <NetworkTable
                            rows={rows}
                            isCore={isCore}
                            isLoading={machinesLoading}
                        />
                    )}
            </Stack>
        </Group>
    );
}