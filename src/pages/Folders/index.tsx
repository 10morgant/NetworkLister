// src/pages/Folders/index.tsx
import {
    useMemo,
    useState
}                     from 'react';
import {
    Box,
    Collapse,
    Group,
    ScrollArea,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    UnstyledButton,
}                     from '@mantine/core';
import {
    IconChevronRight,
    IconSearch
}                     from '@tabler/icons-react';
import {
    MACHINES,
    NETWORKS
}                     from '@/data/mock';
import {PowerBadge}   from '@/components/shared/PowerBadge';
import {StatCard}     from '@/components/shared/StatCard';
import {
    fmtDate,
    fmtUptime
}                     from '@/pages/Networks/utils';
import type {Machine} from '@/types';

interface Selection {
    group: string;
    subgroup: string | null;
}

// ── GroupSidebarItem ──────────────────────────────────────────────────────────

interface GroupSidebarItemProps {
    group: string;
    subgroups: string[];
    isOpen: boolean;
    sel: Selection;
    countFor: (group: string, subgroup?: string) => number;
    onGroupClick: (group: string) => void;
    onSubgroupClick: (group: string, subgroup: string) => void;
}

function GroupSidebarItem({
                              group,
                              subgroups,
                              isOpen,
                              sel,
                              countFor,
                              onGroupClick,
                              onSubgroupClick
                          }: GroupSidebarItemProps) {
    const isSelGrp = sel.group === group && sel.subgroup === null;
    return (
        <Box mb={0}>
            <UnstyledButton w="100%" h={36} onClick={() => onGroupClick(group)}>
                <Group
                    px="sm" py={6} gap="xs" wrap="nowrap"
                    style={{
                        borderRadius: 'var(--mantine-radius-sm)',
                        borderLeft  : `2px solid ${isSelGrp ? 'var(--mantine-color-violet-5)' : 'transparent'}`,
                        background  : isSelGrp ? 'var(--mantine-color-violet-light)' : 'transparent',
                    }}
                >
                    <IconChevronRight
                        size={12}
                        color="var(--mantine-color-dark-3)"
                        style={{
                            transform : isOpen ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.2s',
                            flexShrink: 0
                        }}
                    />
                    <Text size="sm" fw={600} c={isSelGrp ? 'violet.3' : 'dimmed'} style={{flex: 1}} truncate>
                        {group}
                    </Text>
                    <Text size="sm" ff="monospace" c="dark.3">{countFor(group)}</Text>
                </Group>
            </UnstyledButton>

            <Collapse in={isOpen}>
                <Stack gap={0} pl="md" pt={2}>
                    {subgroups.map(sub => {
                        const isSelSub = sel.group === group && sel.subgroup === sub;
                        return (
                            <UnstyledButton key={sub} w="100%" h={36} onClick={() => onSubgroupClick(group, sub)}>
                                <Group
                                    px="sm" py={5} gap="xs" wrap="nowrap"
                                    style={{
                                        borderRadius: 'var(--mantine-radius-sm)',
                                        borderLeft  : `2px solid ${isSelSub ? 'var(--mantine-color-violet-4)' : 'transparent'}`,
                                        background  : isSelSub ? 'var(--mantine-color-violet-light)' : 'transparent',
                                    }}
                                >
                                    <Text size="sm" c={isSelSub ? 'violet.3' : 'dimmed'} style={{flex: 1}} truncate>
                                        {sub}
                                    </Text>
                                    <Text size="sm" ff="monospace" c="dark.4">{countFor(group, sub)}</Text>
                                </Group>
                            </UnstyledButton>
                        );
                    })}
                </Stack>
            </Collapse>
        </Box>
    );
}

// ── SelectionHeader ───────────────────────────────────────────────────────────

interface SelectionHeaderProps {
    sel: Selection;
    inSelection: Machine[];
}

function SelectionHeader({sel, inSelection}: SelectionHeaderProps) {
    const networkCount = [...new Set(inSelection.map(m => m.network))].length;
    return (
        <Box p="md" style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}}>
            <Group justify="space-between" wrap="wrap" gap="sm">
                <Stack gap={2}>
                    <Group gap="xs">
                        {/*<Badge color="violet" variant="light" tt="uppercase" size="sm">
                            {sel.subgroup ? 'Subgroup' : 'Group'}
                        </Badge>*/}
                        {sel.subgroup && <Text size="xs" c="dimmed">{sel.group} / </Text>}
                        <Text fw={700} size="md">{sel.subgroup ?? sel.group}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                        {inSelection.length} guests across {networkCount} networks
                    </Text>
                </Stack>
                <Group gap="xs">
                    <StatCard label="Total" value={inSelection.length}/>
                    <StatCard label="Online" value={inSelection.filter(m => m.power === 'on').length}
                              color="var(--mantine-color-teal-5)"/>
                    <StatCard label="Offline" value={inSelection.filter(m => m.power === 'off').length}
                              color="var(--mantine-color-red-5)"/>
                </Group>
            </Group>
        </Box>
    );
}

// ── FolderToolbar ─────────────────────────────────────────────────────────────

interface FolderToolbarProps {
    search: string;
    onSearch: (v: string) => void;
    powerF: string;
    onPowerF: (v: string) => void;
    count: number;
}

function FolderToolbar({search, onSearch, powerF, onPowerF, count}: FolderToolbarProps) {
    return (
        <Group px="md" py="xs" gap="sm"
               style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}} wrap="wrap">
            <TextInput
                placeholder="Search name, IP, owner…" leftSection={<IconSearch size={14}/>}
                size="xs" value={search} onChange={e => onSearch(e.currentTarget.value)}
                style={{flex: '1 1 180px', maxWidth: 280}}
            />
            <SegmentedControl size="xs" data={['all', 'on', 'off', 'suspended']} value={powerF} onChange={onPowerF}/>
            <Text size="xs" c="dimmed" ml="auto" ff="monospace">{count} guests</Text>
        </Group>
    );
}

// ── MachineRow ────────────────────────────────────────────────────────────────

interface MachineRowProps {
    machine: Machine;
    isExpanded: boolean;
    netName: (id: string) => string;
    onToggle: (name: string) => void;
}

function MachineRow({machine: m, isExpanded, netName, onToggle}: MachineRowProps) {
    return (
        <>
            <Table.Tr onClick={() => onToggle(m.name)} style={{cursor: 'pointer'}}>
                <Table.Td>
                    <IconChevronRight size={12} color="var(--mantine-color-dark-3)"
                                      style={{
                                          transform : isExpanded ? 'rotate(90deg)' : 'none',
                                          transition: 'transform 0.2s'
                                      }}/>
                </Table.Td>
                <Table.Td fw={500} ff="monospace">{m.name}</Table.Td>
                <Table.Td ff="monospace" c="dimmed">{m.ip}</Table.Td>
                <Table.Td><PowerBadge state={m.power}/></Table.Td>
                <Table.Td ff="monospace">{m.cpus}</Table.Td>
                <Table.Td ff="monospace">{m.ram}G</Table.Td>
                <Table.Td c="dimmed"
                          style={{maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {netName(m.network)}
                </Table.Td>
                <Table.Td ff="monospace" c="dimmed">{m.owner}</Table.Td>
            </Table.Tr>
            <Table.Tr style={{background: 'var(--mantine-color-dark-8)'}}>
                <Table.Td colSpan={8} p={0}>
                    <Collapse in={isExpanded}>
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
                                    <Text size="xs" tt="uppercase" c="dimmed"
                                          style={{letterSpacing: '0.08em'}}>{l}</Text>
                                    <Text size="xs">{v}</Text>
                                </Stack>
                            ))}
                        </SimpleGrid>
                    </Collapse>
                </Table.Td>
            </Table.Tr>
        </>
    );
}

// ── FoldersPage ───────────────────────────────────────────────────────────────

export default function FoldersPage() {
    const tree = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        MACHINES.forEach(m => {
            if (!map[m.group]) map[m.group] = new Set();
            map[m.group].add(m.subgroup);
        });
        return Object.entries(map)
                     .map(([group, subs]) => ({group, subgroups: [...subs].sort()}))
                     .sort((a, b) => a.group.localeCompare(b.group));
    }, []);

    const firstGroup                  = tree[0];
    const [sel, setSel]               = useState<Selection>({group: firstGroup.group, subgroup: null});
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set([firstGroup.group]));
    const [search, setSearch]         = useState('');
    const [powerF, setPowerF]         = useState('all');
    const [expanded, setExp]          = useState<Set<string>>(new Set());

    const toggleGroup = (group: string) => {
        setOpenGroups(prev => {
            const n = new Set(prev);
            n.has(group) ? n.delete(group) : n.add(group);
            return n;
        });
        setSel({group, subgroup: null});
    };

    const toggleRow = (name: string) =>
        setExp(prev => {
            const s = new Set(prev);
            s.has(name) ? s.delete(name) : s.add(name);
            return s;
        });

    const countFor = (group: string, subgroup?: string) =>
        MACHINES.filter(m => m.group === group && (subgroup === undefined || m.subgroup === subgroup)).length;

    const inSelection = useMemo(() =>
        MACHINES.filter(m =>
            m.group === sel.group && (sel.subgroup === null || m.subgroup === sel.subgroup)
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

    return (
        <Group gap={0} style={{flex: 1, minHeight: 0, overflow: 'hidden'}} align="stretch">

            {/* ── Sidebar ── */}
            <Box w={220} style={{
                borderRight  : '1px solid var(--mantine-color-dark-5)',
                display      : 'flex',
                flexDirection: 'column'
            }}>
                <Box p="xs" style={{borderBottom: '1px solid var(--mantine-color-dark-5)'}}>
                    <Text size="xs" fw={700} tt="uppercase" c="violet.4" style={{letterSpacing: '0.1em'}}>Groups</Text>
                </Box>
                <ScrollArea flex={1} p="xs">
                    {tree.map(({group, subgroups}) => (
                        <GroupSidebarItem
                            key={group}
                            group={group}
                            subgroups={subgroups}
                            isOpen={openGroups.has(group)}
                            sel={sel}
                            countFor={countFor}
                            onGroupClick={toggleGroup}
                            onSubgroupClick={(g, sub) => setSel({group: g, subgroup: sub})}
                        />
                    ))}
                </ScrollArea>
            </Box>

            {/* ── Main panel ── */}
            <Stack gap={0} style={{flex: 1, minWidth: 0, overflow: 'hidden'}}>
                <SelectionHeader sel={sel} inSelection={inSelection}/>
                <FolderToolbar
                    search={search} onSearch={setSearch}
                    powerF={powerF} onPowerF={setPowerF}
                    count={filtered.length}
                />

                <Box style={{flex: 1, overflowY: 'auto'}}>
                    <Table highlightOnHover stickyHeader verticalSpacing="xs" fz="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={24}/><Table.Th>Machine</Table.Th><Table.Th>IP</Table.Th>
                                <Table.Th>Power</Table.Th><Table.Th>CPUs</Table.Th><Table.Th>RAM</Table.Th>
                                <Table.Th>Network</Table.Th><Table.Th>Owner</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map(m => (
                                <MachineRow
                                    key={m.name}
                                    machine={m}
                                    isExpanded={expanded.has(m.name)}
                                    netName={netName}
                                    onToggle={toggleRow}
                                />
                            ))}
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