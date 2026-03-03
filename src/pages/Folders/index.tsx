// src/pages/Folders/index.tsx
import { useState, useMemo } from 'react';
import {
    Box, Group, Stack, Text, ScrollArea, Badge,
    TextInput, SegmentedControl, Table, Collapse, SimpleGrid,
    UnstyledButton,
} from '@mantine/core';
import { IconSearch, IconChevronRight } from '@tabler/icons-react';
import { MACHINES, NETWORKS } from '@/data/mock';
import { PowerBadge } from '@/components/shared/PowerBadge';
import { StatCard } from '@/components/shared/StatCard';
import { fmtDate, fmtUptime } from '@/pages/Networks/utils';

interface Selection {
    group: string;
    subgroup: string | null; // null = entire group selected
}

export default function FoldersPage() {
    // Build group -> subgroup tree from machines
    const tree = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        MACHINES.forEach(m => {
            if (!map[m.group]) map[m.group] = new Set();
            map[m.group].add(m.subgroup);
        });
        return Object.entries(map)
            .map(([group, subs]) => ({ group, subgroups: [...subs].sort() }))
            .sort((a, b) => a.group.localeCompare(b.group));
    }, []);

    const firstGroup = tree[0];
    const [sel, setSel] = useState<Selection>({
        group: firstGroup.group,
        subgroup: null,
    });
    const [openGroups, setOpenGroups] = useState<Set<string>>(
        new Set([firstGroup.group])
    );
    const [search, setSearch] = useState('');
    const [powerF, setPowerF] = useState('all');
    const [expanded, setExp] = useState<Set<string>>(new Set());

    const toggleGroup = (group: string) =>
        setOpenGroups(prev => {
            const n = new Set(prev);
            n.has(group) ? n.delete(group) : n.add(group);
            return n;
        });

    const toggleRow = (n: string) =>
        setExp(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });

    // Machines matching the current sidebar selection
    const inSelection = useMemo(() =>
        MACHINES.filter(m =>
            m.group === sel.group &&
            (sel.subgroup === null || m.subgroup === sel.subgroup)
        ), [sel]);

    const filtered = useMemo(() => inSelection.filter(m => {
        if (powerF !== 'all' && m.power !== powerF) return false;
        if (search) {
            const q = search.toLowerCase();
            return m.name.toLowerCase().includes(q) || m.ip.includes(q) || m.owner.toLowerCase().includes(q);
        }
        return true;
    }), [inSelection, powerF, search]);

    const netName = (id: string) => NETWORKS.find(n => n.id === id)?.name ?? id;

    const countFor = (group: string, subgroup?: string) =>
        MACHINES.filter(m => m.group === group && (subgroup === undefined || m.subgroup === subgroup)).length;

    return (
        <Group gap={0} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} align="stretch">

            {/* ── Sidebar tree ── */}
            <Box w={220} style={{ borderRight: '1px solid var(--mantine-color-dark-5)', display: 'flex', flexDirection: 'column' }}>
                <Box p="xs" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}>
                    <Text size="xs" fw={700} tt="uppercase" c="violet.4" style={{ letterSpacing: '0.1em' }}>Groups</Text>
                </Box>
                <ScrollArea flex={1} p="xs">
                    {tree.map(({ group, subgroups }) => {
                        const isOpen = openGroups.has(group);
                        const isSelGrp = sel.group === group && sel.subgroup === null;
                        return (
                            <Box key={group} mb={4}>
                                {/* Group row */}
                                <UnstyledButton w="100%" onClick={() => {
                                    toggleGroup(group);
                                    setSel({ group, subgroup: null });
                                }}>
                                    <Group
                                        px="sm" py={6} gap="xs" wrap="nowrap"
                                        style={{
                                            borderRadius: 'var(--mantine-radius-sm)',
                                            borderLeft: `2px solid ${isSelGrp ? 'var(--mantine-color-violet-5)' : 'transparent'}`,
                                            background: isSelGrp ? 'var(--mantine-color-violet-light)' : 'transparent',
                                        }}
                                    >
                                        <IconChevronRight
                                            size={12}
                                            color="var(--mantine-color-dark-3)"
                                            style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                                        />
                                        <Text size="xs" fw={600} c={isSelGrp ? 'violet.3' : 'dimmed'} style={{ flex: 1 }} truncate>
                                            {group}
                                        </Text>
                                        <Text size="xs" ff="monospace" c="dark.3">{countFor(group)}</Text>
                                    </Group>
                                </UnstyledButton>

                                {/* Subgroup rows */}
                                <Collapse in={isOpen}>
                                    <Stack gap={0} pl="md" pt={2}>
                                        {subgroups.map(sub => {
                                            const isSelSub = sel.group === group && sel.subgroup === sub;
                                            return (
                                                <UnstyledButton key={sub} w="100%" onClick={() => setSel({ group, subgroup: sub })}>
                                                    <Group
                                                        px="sm" py={5} gap="xs" wrap="nowrap"
                                                        style={{
                                                            borderRadius: 'var(--mantine-radius-sm)',
                                                            borderLeft: `2px solid ${isSelSub ? 'var(--mantine-color-violet-4)' : 'transparent'}`,
                                                            background: isSelSub ? 'var(--mantine-color-violet-light)' : 'transparent',
                                                        }}
                                                    >
                                                        <Text size="xs" c={isSelSub ? 'violet.3' : 'dimmed'} style={{ flex: 1 }} truncate>
                                                            {sub}
                                                        </Text>
                                                        <Text size="xs" ff="monospace" c="dark.4">{countFor(group, sub)}</Text>
                                                    </Group>
                                                </UnstyledButton>
                                            );
                                        })}
                                    </Stack>
                                </Collapse>
                            </Box>
                        );
                    })}
                </ScrollArea>
            </Box>

            {/* ── Main panel ── */}
            <Stack gap={0} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0 }}>
                    <Group justify="space-between" wrap="wrap" gap="sm">
                        <Stack gap={2}>
                            <Group gap="xs">
                                <Badge color="violet" variant="light" tt="uppercase" size="sm">
                                    {sel.subgroup ? 'Subgroup' : 'Group'}
                                </Badge>
                                <Text fw={700} size="md">{sel.subgroup ?? sel.group}</Text>
                                {sel.subgroup && (
                                    <Text size="xs" c="dimmed">in {sel.group}</Text>
                                )}
                            </Group>
                            <Text size="xs" c="dimmed">
                                {inSelection.length} guests across {[...new Set(inSelection.map(m => m.network))].length} networks
                            </Text>
                        </Stack>
                        <Group gap="xs">
                            <StatCard label="Total" value={inSelection.length} />
                            <StatCard label="Online" value={inSelection.filter(m => m.power === 'on').length} color="var(--mantine-color-teal-5)" />
                            <StatCard label="Offline" value={inSelection.filter(m => m.power === 'off').length} color="var(--mantine-color-red-5)" />
                        </Group>
                    </Group>
                </Box>

                {/* Toolbar */}
                <Group px="md" py="xs" gap="sm" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0 }} wrap="wrap">
                    <TextInput
                        placeholder="Search name, IP, owner…" leftSection={<IconSearch size={14} />}
                        size="xs" value={search} onChange={e => setSearch(e.currentTarget.value)}
                        style={{ flex: '1 1 180px', maxWidth: 280 }}
                    />
                    <SegmentedControl size="xs" data={['all', 'on', 'off', 'suspended']} value={powerF} onChange={setPowerF} />
                    <Text size="xs" c="dimmed" ml="auto" ff="monospace">{filtered.length} guests</Text>
                </Group>

                {/* Table */}
                <Box style={{ flex: 1, overflowY: 'auto' }}>
                    <Table highlightOnHover stickyHeader verticalSpacing="xs" fz="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={24} /><Table.Th>Machine</Table.Th><Table.Th>IP</Table.Th>
                                <Table.Th>Power</Table.Th><Table.Th>CPUs</Table.Th><Table.Th>RAM</Table.Th>
                                <Table.Th>Network</Table.Th><Table.Th>Owner</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map(m => {
                                const isExp = expanded.has(m.name);
                                return (
                                    <>
                                        <Table.Tr key={m.name} onClick={() => toggleRow(m.name)} style={{ cursor: 'pointer' }}>
                                            <Table.Td>
                                                <IconChevronRight size={12} color="var(--mantine-color-dark-3)"
                                                    style={{ transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                                            </Table.Td>
                                            <Table.Td fw={500} ff="monospace">{m.name}</Table.Td>
                                            <Table.Td ff="monospace" c="dimmed">{m.ip}</Table.Td>
                                            <Table.Td><PowerBadge state={m.power} /></Table.Td>
                                            <Table.Td ff="monospace">{m.cpus}</Table.Td>
                                            <Table.Td ff="monospace">{m.ram}G</Table.Td>
                                            <Table.Td c="dimmed" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {netName(m.network)}
                                            </Table.Td>
                                            <Table.Td ff="monospace" c="dimmed">{m.owner}</Table.Td>
                                        </Table.Tr>
                                        <Table.Tr key={`${m.name}-exp`} style={{ background: 'var(--mantine-color-dark-8)' }}>
                                            <Table.Td colSpan={8} p={0}>
                                                <Collapse in={isExp}>
                                                    <SimpleGrid cols={6} px="xl" py="sm">
                                                        {[
                                                            ['Folder', m.folder],
                                                            ['Group', m.group],
                                                            ['Sub-Group', m.subgroup],
                                                            ['Owner', m.owner],
                                                            ['Created', fmtDate(m.created)],
                                                            ['Uptime', m.power === 'on' ? fmtUptime(m.uptime) + ' ago' : '—'],
                                                        ].map(([l, v]) => (
                                                            <Stack key={l} gap={2}>
                                                                <Text size="xs" tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>{l}</Text>
                                                                <Text size="xs">{v}</Text>
                                                            </Stack>
                                                        ))}
                                                    </SimpleGrid>
                                                </Collapse>
                                            </Table.Td>
                                        </Table.Tr>
                                    </>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                    {filtered.length === 0 && (
                        <Text ta="center" c="dimmed" py="xl">No guests in this selection</Text>
                    )}
                </Box>
            </Stack>
        </Group>
    );
}