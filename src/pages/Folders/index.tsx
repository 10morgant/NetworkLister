// src/pages/Folders/index.tsx
import {useMemo, useState}  from 'react';
import {useQuery}           from '@tanstack/react-query';
import {
    Alert,
    Box,
    Center,
    Collapse,
    Group,
    SegmentedControl,
    SimpleGrid,
    Skeleton,
    Stack,
    Table,
    Text,
    TextInput,
}                           from '@mantine/core';
import {
    IconAlertCircle,
    IconChevronRight,
    IconSearch,
}                           from '@tabler/icons-react';
import {PowerBadge}         from '@/components/shared/PowerBadge';
import {StatCard}           from '@/components/shared/StatCard';
import {fmtDate, fmtUptime} from '@/pages/Networks/utils';
import {
    fetchGuestsAll,
    fetchGuestsByGroup,
    fetchGuestsBySubGroup,
}                           from '@/api/machines';
import {queryKeys}          from '@/api/queryKeys';
import type {Guest}         from '@/types';
import {
    FoldersSidebar,
    type FolderSelection,
}                           from './FoldersSidebar';

// ── SelectionHeader ───────────────────────────────────────────────────────────

interface SelectionHeaderProps {
    sel: FolderSelection;
    guests: Guest[];
    isLoading: boolean;
}

function SelectionHeader({sel, guests, isLoading}: SelectionHeaderProps) {
    const networkCount = new Set(guests.flatMap(m => m.networks.map(n => n.name))).size;
    const title = sel.group === null
        ? 'All Guests'
        : sel.subGroup
            ? sel.subGroup
            : sel.group;

    return (
        <Box p="md" style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}}>
            <Group justify="space-between" wrap="wrap" gap="sm">
                <Stack gap={2}>
                    <Group gap="xs">
                        {sel.group !== null && sel.subGroup && (
                            <Text size="xs" c="dimmed">{sel.group} /</Text>
                        )}
                        <Text fw={700} size="md">{title}</Text>
                    </Group>
                    {isLoading
                        ? <Skeleton height={10} width={180} radius="sm"/>
                        : <Text size="xs" c="dimmed">
                            {guests.length} guests across {networkCount} network{networkCount !== 1 ? 's' : ''}
                          </Text>
                    }
                </Stack>
                {isLoading
                    ? <Group gap="xs">{Array.from({length: 3}).map((_, i) => <Skeleton key={i} height={52} width={120} radius="sm"/>)}</Group>
                    : <Group gap="xs">
                        <StatCard label="Total"   value={guests.length}/>
                        <StatCard label="Online"  value={guests.filter(m => m.power === 'on').length}  color="var(--mantine-color-teal-5)"/>
                        <StatCard label="Offline" value={guests.filter(m => m.power === 'off').length} color="var(--mantine-color-red-5)"/>
                      </Group>
                }
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

// ── GuestRow ──────────────────────────────────────────────────────────────────

interface GuestRowProps {
    guest: Guest;
    isExpanded: boolean;
    colSpan?: number;
    onToggle: (id: string) => void;
}

function GuestRow({guest: m, isExpanded, colSpan = 8, onToggle}: GuestRowProps) {
    const networkNames = m.networks.map(n => n.name).join(', ') || '—';
    return (
        <>
            <Table.Tr onClick={() => onToggle(m.id)} style={{cursor: 'pointer'}}>
                <Table.Td>
                    <IconChevronRight size={12} color="var(--mantine-color-dark-3)"
                                      style={{transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s'}}/>
                </Table.Td>
                <Table.Td fw={500} ff="monospace">{m.name}</Table.Td>
                <Table.Td ff="monospace" c="dimmed">{m.ip ?? '—'}</Table.Td>
                <Table.Td><PowerBadge state={m.power}/></Table.Td>
                <Table.Td ff="monospace">{m.cpu}</Table.Td>
                <Table.Td ff="monospace">{m.ram}G</Table.Td>
                <Table.Td c="dimmed"
                          style={{maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {networkNames}
                </Table.Td>
                <Table.Td ff="monospace" c="dimmed">{m.owner ?? '—'}</Table.Td>
            </Table.Tr>
            <Table.Tr style={{background: 'var(--mantine-color-dark-8)'}}>
                <Table.Td colSpan={colSpan} p={0}>
                    <Collapse in={isExpanded}>
                        <SimpleGrid cols={6} px="xl" py="sm">
                            {([
                                ['Folder',    m.folder],
                                ['Group',     m.group],
                                ['Sub-Group', m.sub_group],
                                ['Owner',     m.owner],
                                ['Created',   fmtDate(m.created ?? null)],
                                ['Uptime',    m.power === 'on' ? fmtUptime(m.power_on_time ?? null) + ' ago' : '—'],
                            ] as [string, string | undefined][]).map(([l, v]) => (
                                <Stack key={l} gap={2}>
                                    <Text size="xs" tt="uppercase" c="dimmed" style={{letterSpacing: '0.08em'}}>{l}</Text>
                                    <Text size="xs">{v ?? '—'}</Text>
                                </Stack>
                            ))}
                        </SimpleGrid>
                    </Collapse>
                </Table.Td>
            </Table.Tr>
        </>
    );
}

// ── Table skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <Table fz="xs" verticalSpacing="xs">
            <Table.Thead>
                <Table.Tr>
                    <Table.Th w={24}/><Table.Th>Guest</Table.Th><Table.Th>IP</Table.Th>
                    <Table.Th>Power</Table.Th><Table.Th>CPUs</Table.Th><Table.Th>RAM</Table.Th>
                    <Table.Th>Network</Table.Th><Table.Th>Owner</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {Array.from({length: 10}).map((_, i) => (
                    <Table.Tr key={i}>
                        <Table.Td/>
                        <Table.Td><Skeleton height={10} width={`${50 + (i % 5) * 10}%`} radius="sm"/></Table.Td>
                        <Table.Td><Skeleton height={10} width={90}  radius="sm"/></Table.Td>
                        <Table.Td><Skeleton height={16} width={52}  radius="xl"/></Table.Td>
                        <Table.Td><Skeleton height={10} width={20}  radius="sm"/></Table.Td>
                        <Table.Td><Skeleton height={10} width={28}  radius="sm"/></Table.Td>
                        <Table.Td><Skeleton height={10} width={`${40 + (i % 4) * 12}%`} radius="sm"/></Table.Td>
                        <Table.Td><Skeleton height={10} width={60}  radius="sm"/></Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}

// ── Shared table header ───────────────────────────────────────────────────────

function GuestTableHead() {
    return (
        <Table.Thead>
            <Table.Tr>
                <Table.Th w={24}/><Table.Th>Guest</Table.Th><Table.Th>IP</Table.Th>
                <Table.Th>Power</Table.Th><Table.Th>CPUs</Table.Th><Table.Th>RAM</Table.Th>
                <Table.Th>Network</Table.Th><Table.Th>Owner</Table.Th>
            </Table.Tr>
        </Table.Thead>
    );
}

// ── Sub-group stat pill ───────────────────────────────────────────────────────

function StatPill({label, value, color = 'dark.3', valueWidth = 32}: {
    label: string;
    value: string | number;
    color?: string;
    valueWidth?: number;
}) {
    return (
        <Group gap={4} wrap="nowrap">
            <Text size="xs" c="dark.4" style={{flexShrink: 0}}>{label}</Text>
            <Text size="xs" fw={600} ff="monospace" c={color}
                  style={{minWidth: valueWidth, textAlign: 'right'}}>
                {value}
            </Text>
        </Group>
    );
}

function guestStats(guests: Guest[]) {
    const total    = guests.length;
    const on       = guests.filter(g => g.power === 'on').length;
    const off      = guests.filter(g => g.power === 'off').length;
    const suspended = guests.filter(g => g.power === 'suspended').length;
    const totalCpu = guests.reduce((n, g) => n + g.cpu, 0);
    const totalRam = guests.reduce((n, g) => n + g.ram, 0);
    const ramLabel = totalRam >= 1024 ? `${(totalRam / 1024).toFixed(1)}T` : `${totalRam}G`;
    return {total, on, off, suspended, totalCpu, ramLabel};
}

/** Compact inline stats used in sub-group card headers */
function SubGroupStats({guests}: {guests: Guest[]}) {
    const {total, on, off, totalCpu, ramLabel} = guestStats(guests);
    return (
        <Group gap={6} wrap="nowrap" style={{flexShrink: 0, width: 360}}>
            <StatPill label="total" value={total}    valueWidth={28}/>
            <Text size="xs" c="dark.6" style={{flexShrink: 0}}>·</Text>
            <StatPill label="on"    value={on}       valueWidth={28} color="teal.4"/>
            <StatPill label="off"   value={off}      valueWidth={28} color="red.5"/>
            <Text size="xs" c="dark.6" style={{flexShrink: 0}}>·</Text>
            <StatPill label="vCPU"  value={totalCpu} valueWidth={44}/>
            <StatPill label="RAM"   value={ramLabel} valueWidth={56}/>
        </Group>
    );
}

/** Full-width stats bar shown beneath the toolbar in group / sub-group views */
function GuestStatsBar({guests}: {guests: Guest[]}) {
    const {total, on, off, suspended, totalCpu, ramLabel} = guestStats(guests);
    return (
        <Group
            px="md" py={6} gap="lg" wrap="nowrap"
            style={{
                borderBottom: '1px solid var(--mantine-color-dark-5)',
                background  : 'var(--mantine-color-dark-8)',
                flexShrink  : 0,
            }}
        >
            <StatPill label="total"     value={total}     valueWidth={36}/>
            <Text size="xs" c="dark.6">·</Text>
            <StatPill label="on"        value={on}        valueWidth={36} color="teal.4"/>
            <StatPill label="off"       value={off}       valueWidth={36} color="red.5"/>
            <StatPill label="suspended" value={suspended} valueWidth={36} color="yellow.6"/>
            <Text size="xs" c="dark.6">·</Text>
            <StatPill label="vCPU"      value={totalCpu}  valueWidth={48}/>
            <StatPill label="RAM"       value={ramLabel}  valueWidth={56}/>
        </Group>
    );
}

// ── AllGuestsView — grouped by group / sub_group ──────────────────────────────

interface AllGuestsViewProps {
    guests: Guest[];
    expanded: Set<string>;
    onToggle: (id: string) => void;
}

function AllGuestsView({guests, expanded, onToggle}: AllGuestsViewProps) {
    const grouped = useMemo(() => {
        const map = new Map<string, Map<string, Guest[]>>();
        guests.forEach(g => {
            const grp = g.group ?? '(No Group)';
            const sub = g.sub_group ?? '(No Sub-Group)';
            if (!map.has(grp)) map.set(grp, new Map());
            const subMap = map.get(grp)!;
            if (!subMap.has(sub)) subMap.set(sub, []);
            subMap.get(sub)!.push(g);
        });
        return [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([grp, subMap]) => ({
                group    : grp,
                subGroups: [...subMap.entries()]
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([sub, gs]) => ({sub, guests: gs})),
            }));
    }, [guests]);

    // Track which sub-groups are open — default ALL open.
    // Initialise lazily so the first render already has all keys.
    const [openSubs, setOpenSubs] = useState<Set<string>>(new Set());

    // Derive the full set of keys from grouped so we can treat "empty set = all open"
    const allKeys = useMemo(
        () => new Set(grouped.flatMap(({group, subGroups}) => subGroups.map(s => `${group}::${s.sub}`))),
        [grouped]
    );
    // Empty openSubs means "nothing has been touched yet" → treat as all open
    const effectiveOpen = openSubs.size === 0 ? allKeys : openSubs;

    const toggleSub = (key: string) =>
        setOpenSubs(prev => {
            // If we were in "all open" state, materialise the full set first then toggle
            const base = prev.size === 0 ? new Set(allKeys) : new Set(prev);
            base.has(key) ? base.delete(key) : base.add(key);
            return base;
        });

    const expandGroup = (group: string, subGroups: {sub: string}[]) =>
        setOpenSubs(prev => {
            const n = prev.size === 0 ? new Set(allKeys) : new Set(prev);
            subGroups.forEach(s => n.add(`${group}::${s.sub}`));
            return n;
        });

    const collapseGroup = (group: string, subGroups: {sub: string}[]) =>
        setOpenSubs(prev => {
            const n = prev.size === 0 ? new Set(allKeys) : new Set(prev);
            subGroups.forEach(s => n.delete(`${group}::${s.sub}`));
            return n;
        });

    if (grouped.length === 0) {
        return <Text ta="center" c="dimmed" py="xl">No guests found</Text>;
    }

    return (
        <Stack gap={0} px="md" pt="sm" pb="md">
            {grouped.map(({group, subGroups}, gi) => {
                const totalGuests = subGroups.reduce((n, s) => n + s.guests.length, 0);
                const allOpen     = subGroups.every(s => effectiveOpen.has(`${group}::${s.sub}`));

                return (
                    <Box key={group} mb="md">
                        {/* ── Group title / divider ── */}
                        <Group gap="md" mb={6} align="center">
                            {gi > 0 && <Box style={{height: 1, background: 'var(--mantine-color-dark-5)', flex: 0, width: 12}}/>}
                            <Text size="xs" fw={700} tt="uppercase" c="blue.4" style={{letterSpacing: '0.12em', flexShrink: 0}}>
                                {group}
                            </Text>
                            <Box style={{height: 1, background: 'var(--mantine-color-dark-5)', flex: 1}}/>
                            <Text size="xs" ff="monospace" c="dark.4" style={{flexShrink: 0}}>
                                {subGroups.length} sub-groups · {totalGuests} guests
                            </Text>
                            <Text
                                size="xs" c="blue.6"
                                style={{cursor: 'pointer', userSelect: 'none', flexShrink: 0}}
                                onClick={() => allOpen ? collapseGroup(group, subGroups) : expandGroup(group, subGroups)}
                            >
                                {allOpen ? 'Collapse all' : 'Expand all'}
                            </Text>
                        </Group>

                        {/* ── Sub-group cards ── */}
                        <Stack gap={6}>
                            {subGroups.map(({sub, guests: sg}) => {
                                const key    = `${group}::${sub}`;
                                const isOpen = effectiveOpen.has(key);
                                return (
                                    <Box
                                        key={sub}
                                        style={{
                                            border      : `1px solid ${isOpen ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-dark-6)'}`,
                                            borderRadius: 'var(--mantine-radius-md)',
                                            overflow    : 'hidden',
                                            transition  : 'border-color 0.15s',
                                        }}
                                    >
                                        {/* Sub-group header */}
                                        <Group
                                            px="md" py={7} gap="sm"
                                            style={{
                                                background : isOpen ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-dark-8)',
                                                borderLeft : `4px solid ${isOpen ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-dark-5)'}`,
                                                cursor     : 'pointer',
                                                userSelect : 'none',
                                                transition : 'background 0.15s, border-color 0.15s',
                                                flexWrap   : 'nowrap',
                                                minWidth   : 0,
                                            }}
                                            onClick={() => toggleSub(key)}
                                        >
                                            <IconChevronRight
                                                size={13}
                                                color={isOpen ? 'var(--mantine-color-blue-4)' : 'var(--mantine-color-dark-3)'}
                                                style={{transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0}}
                                            />
                                            <Text size="sm" fw={600} c={isOpen ? 'blue.3' : 'dimmed'}
                                                  style={{flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                                {sub}
                                            </Text>
                                            {/* Stats — visible even when collapsed so you can triage without opening */}
                                            <SubGroupStats guests={sg}/>
                                        </Group>

                                        <Collapse in={isOpen}>
                                            <Table highlightOnHover verticalSpacing="xs" fz="xs">
                                                <GuestTableHead/>
                                                <Table.Tbody>
                                                    {sg.map(m => (
                                                        <GuestRow
                                                            key={m.id}
                                                            guest={m}
                                                            isExpanded={expanded.has(m.id)}
                                                            onToggle={onToggle}
                                                        />
                                                    ))}
                                                </Table.Tbody>
                                            </Table>
                                        </Collapse>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                );
            })}
        </Stack>
    );
}

// ── FoldersPage ───────────────────────────────────────────────────────────────

export default function FoldersPage() {
    const [sel, setSel] = useState<FolderSelection>({group: null, subGroup: null});
    const [search, setSearch] = useState('');
    const [powerF, setPowerF] = useState('all');
    const [expanded, setExp]  = useState<Set<string>>(new Set());

    const isAll      = sel.group === null;
    const isGroup    = sel.group !== null && sel.subGroup === null;
    const isSubGroup = sel.group !== null && sel.subGroup !== null;

    // All guests
    const allQuery = useQuery({
        queryKey: queryKeys.guestsAll,
        queryFn : fetchGuestsAll,
        enabled : isAll,
    });

    // Guests for a whole group
    const groupQuery = useQuery({
        queryKey: queryKeys.guestsByGroup(sel.group ?? ''),
        queryFn : () => fetchGuestsByGroup(sel.group!),
        enabled : isGroup,
    });

    // Guests for a specific sub-group
    const subGroupQuery = useQuery({
        queryKey: queryKeys.guestsBySubGroup(sel.group ?? '', sel.subGroup ?? ''),
        queryFn : () => fetchGuestsBySubGroup(sel.group!, sel.subGroup!),
        enabled : isSubGroup,
    });

    const activeQuery = isAll ? allQuery : isGroup ? groupQuery : subGroupQuery;
    const rawGuests   = activeQuery.data ?? [];
    const isLoading   = activeQuery.isLoading;
    const isError     = activeQuery.isError;

    // Apply filters
    const filtered = useMemo(() => rawGuests.filter(m => {
        if (powerF !== 'all' && m.power !== powerF) return false;
        if (search) {
            const q = search.toLowerCase();
            return m.name.toLowerCase().includes(q) ||
                   (m.ip ?? '').includes(q) ||
                   (m.owner ?? '').toLowerCase().includes(q);
        }
        return true;
    }), [rawGuests, powerF, search]);

    const toggleRow = (id: string) =>
        setExp(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });

    // Reset expanded rows when selection changes
    const handleSelect = (next: FolderSelection) => {
        setSel(next);
        setExp(new Set());
        setSearch('');
        setPowerF('all');
    };

    return (
        <Group gap={0} style={{flex: 1, minHeight: 0, overflow: 'hidden'}} align="stretch">

            <FoldersSidebar selected={sel} onSelect={handleSelect}/>

            {/* ── Main panel ── */}
            <Stack gap={0} style={{flex: 1, minWidth: 0, minHeight: 0, height: '100%', overflow: 'hidden'}}>

                <SelectionHeader sel={sel} guests={isLoading ? [] : filtered} isLoading={isLoading}/>

                <FolderToolbar
                    search={search} onSearch={setSearch}
                    powerF={powerF} onPowerF={setPowerF}
                    count={filtered.length}
                />

                <Box style={{flex: 1, minHeight: 0, overflowY: 'auto'}}>
                    {isError && (
                        <Center style={{padding: 24}}>
                            <Alert icon={<IconAlertCircle size={16}/>} color="red" title="Failed to load guests">
                                Could not fetch guests. Check your connection and try again.
                            </Alert>
                        </Center>
                    )}

                    {isLoading && <TableSkeleton/>}

                    {!isLoading && !isError && isAll && (
                        <AllGuestsView guests={filtered} expanded={expanded} onToggle={toggleRow}/>
                    )}

                    {!isLoading && !isError && !isAll && (
                        <>
                            <GuestStatsBar guests={filtered}/>
                            <Table highlightOnHover stickyHeader verticalSpacing="xs" fz="xs">
                                <GuestTableHead/>
                                <Table.Tbody>
                                    {filtered.map(m => (
                                        <GuestRow
                                            key={m.id}
                                            guest={m}
                                            isExpanded={expanded.has(m.id)}
                                            onToggle={toggleRow}
                                        />
                                    ))}
                                </Table.Tbody>
                            </Table>
                            {filtered.length === 0 && (
                                <Text ta="center" c="dimmed" py="xl">No guests in this selection</Text>
                            )}
                        </>
                    )}
                </Box>
            </Stack>
        </Group>
    );
}