import {
    useMemo,
    useState
}                   from 'react';
import {
    Anchor,
    Box,
    Collapse,
    Group,
    ScrollArea,
    SegmentedControl,
    SimpleGrid,
    Skeleton,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
    ThemeIcon,
    Tooltip,
}                   from '@mantine/core';
import {
    IconAlertTriangle,
    IconChevronRight,
    IconSearch,
}               from '@tabler/icons-react';
import {
    CFG,
    PowerBadge
} from '@/components/shared/PowerBadge';
import type {
    IPGuest,
    IPGuests,
    Machine
}               from '@/types';
import {
    fmtDate,
    fmtUptime
}                   from './utils';

interface Props {
    /** Normal rows: one IP → one guest (or null for unallocated/padded IPs) */
    rows: Array<IPGuest | { ip: string; guest: null }>;
    /** Clash rows: one IP → multiple guests */
    clashes: IPGuests[];
    isCore: boolean;
    isLoading: boolean;
}

// ─── Clash Banner ─────────────────────────────────────────────────────────────

interface ClashBannerProps {
    clashes: IPGuests[];
    onJumpTo: (ip: string) => void;
}

function ClashBanner({clashes, onJumpTo}: ClashBannerProps) {
    const [open, setOpen] = useState(true);

    return (
        <Box
            style={{
                borderBottom: '1px solid var(--mantine-color-orange-8)',
                background  : 'color-mix(in srgb, var(--mantine-color-orange-9) 30%, transparent)',
                flexShrink  : 0,
            }}
        >
            <Group
                px="md" py="xs" gap="sm"
                style={{cursor: 'pointer', userSelect: 'none'}}
                onClick={() => setOpen(o => !o)}
            >
                <ThemeIcon size="xs" color="orange" variant="transparent">
                    <IconAlertTriangle size={14}/>
                </ThemeIcon>
                <Text size="xs" fw={700} c="orange.4">
                    {clashes.length} IP clash{clashes.length !== 1 ? 'es' : ''} detected
                </Text>
                <Text size="xs" c="dimmed">
                    — multiple guests share the same IP address
                </Text>
                <IconChevronRight
                    size={12}
                    color="var(--mantine-color-dimmed)"
                    style={{
                        marginLeft: 'auto',
                        transform : open ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                />
            </Group>

            <Collapse in={open}>
                <ScrollArea mah={180} px="md" pb="sm">
                    <Stack gap={4}>
                        {clashes.map(({ip, guests}) => (
                            <Group key={ip} gap="xs" align="flex-start" wrap="nowrap">
                                <Anchor
                                    size="xs" ff="monospace" fw={600} c="orange.3"
                                    style={{minWidth: 120, flexShrink: 0}}
                                    onClick={e => { e.preventDefault(); onJumpTo(ip); }}
                                >
                                    {ip}
                                </Anchor>
                                <Group gap={4} wrap="wrap">
                                    {guests.map(m => (
                                        <Group
                                            key={m.id ?? m.name}
                                            gap={4} px={6} py={2}
                                            style={{
                                                borderRadius: 'var(--mantine-radius-sm)',
                                                background  : 'var(--mantine-color-dark-6)',
                                                border      : '1px solid var(--mantine-color-dark-4)',
                                            }}
                                        >
                                            <PowerBadge state={m.power}/>
                                            <Text size="xs" ff="monospace" fw={500}>{m.name}</Text>
                                            {m.owner && <Text size="xs" c="dimmed">({m.owner})</Text>}
                                        </Group>
                                    ))}
                                </Group>
                            </Group>
                        ))}
                    </Stack>
                </ScrollArea>
            </Collapse>
        </Box>
    );
}

// ─── Clash Row ────────────────────────────────────────────────────────────────

interface ClashRowProps {
    ip: string;
    guests: Machine[];
    expanded: boolean;
    onToggle: () => void;
}

function ClashRow({ip, guests, expanded, onToggle}: ClashRowProps) {
    return (
        <>
            <Table.Tr
                data-ip={ip}
                onClick={onToggle}
                style={{
                    cursor       : 'pointer',
                    background   : 'color-mix(in srgb, var(--mantine-color-orange-9) 20%, transparent)',
                    outline      : '1px solid var(--mantine-color-orange-8)',
                    outlineOffset: '-1px',
                }}
            >
                <Table.Td>
                    <IconChevronRight
                        size={12}
                        color="var(--mantine-color-orange-4)"
                        style={{transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s'}}
                    />
                </Table.Td>
                <Table.Td ff="monospace" c="orange.4" fw={600}>{ip}</Table.Td>
                <Table.Td colSpan={6}>
                    <Group gap={6} wrap="wrap">
                        <Tooltip label="IP clash — multiple guests share this address" withArrow>
                            <ThemeIcon size={14} color="orange" variant="transparent" style={{marginRight: 4}}>
                                <IconAlertTriangle size={14}/>
                            </ThemeIcon>
                        </Tooltip>
                        {guests.map(m => (
                            <Group
                                key={m.id ?? m.name}
                                gap={4} px={6} py={2}
                                style={{
                                    borderRadius: 'var(--mantine-radius-sm)',
                                    background  : 'var(--mantine-color-dark-7)',
                                    border      : '1px solid var(--mantine-color-orange-9)',
                                }}
                            >
                                <PowerBadge state={m.power}/>
                                <Text size="xs" ff="monospace" fw={500}>{m.name}</Text>
                            </Group>
                        ))}
                        <Text size="xs" c="orange.6" ml={4}>{guests.length} guests — clash</Text>
                    </Group>
                </Table.Td>
            </Table.Tr>

            <Table.Tr style={{background: 'var(--mantine-color-dark-8)'}}>
                <Table.Td colSpan={8} p={0}>
                    <Collapse in={expanded}>
                        <Stack gap={0} px="xl" py="sm">
                            {guests.map((m, idx) => (
                                <Box
                                    key={m.id ?? m.name}
                                    py="xs"
                                    style={{borderTop: idx > 0 ? '1px solid var(--mantine-color-dark-6)' : 'none'}}
                                >
                                    <Group gap="xs" mb={6}>
                                        <PowerBadge state={m.power}/>
                                        <Text size="xs" ff="monospace" fw={600} c="orange.3">{m.name}</Text>
                                        <Text size="xs" c="dimmed">— Clash #{idx + 1}</Text>
                                    </Group>
                                    <MachineDetail machine={m}/>
                                </Box>
                            ))}
                        </Stack>
                    </Collapse>
                </Table.Td>
            </Table.Tr>
        </>
    );
}

// ─── Shared detail grid ───────────────────────────────────────────────────────

function MachineDetail({machine: m}: { machine: Machine }) {
    return (
        <SimpleGrid cols={6}>
            {([
                ['Folder',    m.folder],
                ['Group',     m.group],
                ['Sub-Group', m.sub_group],
                ['Owner',     m.owner],
                ['Created',   fmtDate(m.created)],
                ['Uptime',    m.power === 'on' ? fmtUptime(m.power_on_time) + ' ago' : '—'],
            ] as [string, string][]).map(([l, v]) => (
                <Stack key={l} gap={2}>
                    <Text size="xs" tt="uppercase" c="dimmed" style={{letterSpacing: '0.08em'}}>{l}</Text>
                    <Text size="xs">{v ?? '—'}</Text>
                </Stack>
            ))}
        </SimpleGrid>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NetworkTable({rows, clashes, isCore, isLoading}: Props) {
    const [search, setSearch]       = useState('');
    const [powerF, setPowerF]       = useState('all');
    const [showEmpty, setShowEmpty] = useState(true);
    const [expanded, setExpanded]   = useState<Set<string>>(new Set());

    const toggle = (ip: string) =>
        setExpanded(prev => {
            const n = new Set(prev);
            n.has(ip) ? n.delete(ip) : n.add(ip);
            return n;
        });

    const jumpTo = (ip: string) => {
        setExpanded(prev => new Set(prev).add(ip));
        setTimeout(() => {
            document.querySelector(`[data-ip="${ip}"]`)
                     ?.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 50);
    };

    // Filter clash rows
    const filteredClashes = useMemo(() => clashes.filter(({ip, guests}) => {
        if (powerF !== 'all' && !guests.some(m => CFG[m.power].name === powerF)) return false;
        if (search) {
            const q = search.toLowerCase();
            return ip.includes(q) || guests.some(m =>
                m.name?.toLowerCase().includes(q) ||
                m.owner?.toLowerCase().includes(q) ||
                m.group?.toLowerCase().includes(q)
            );
        }
        return true;
    }), [clashes, powerF, search]);

    // Filter normal / empty rows
    const filteredRows = useMemo(() => rows.filter(({ip, guest}) => {
        if (!showEmpty && !guest) return false;
        if (powerF !== 'all' && CFG[guest?.power ?? 'off'].name !== powerF) return false;
        if (search) {
            const q = search.toLowerCase();
            return ip.includes(q) ||
                guest?.name?.toLowerCase().includes(q) ||
                guest?.owner?.toLowerCase().includes(q) ||
                guest?.group?.toLowerCase().includes(q);
        }
        return true;
    }), [rows, showEmpty, powerF, search]);

    const totalVisible = filteredRows.length + filteredClashes.length;

    if (isLoading) {
        return (
            <Stack gap={0} style={{flex: 1, minHeight: 0, height: '100%', overflow: 'hidden'}}>
                {/* Skeleton toolbar */}
                <Group px="md" py="xs" gap="sm"
                       style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}} wrap="wrap">
                    <Skeleton height={28} width={220} radius="sm"/>
                    <Skeleton height={28} width={200} radius="sm"/>
                </Group>
                {/* Skeleton table */}
                <Box style={{flex: 1, minHeight: 0, overflowY: 'auto'}}>
                    <Table fz="xs" verticalSpacing="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th w={24}/>
                                <Table.Th>IP Address</Table.Th>
                                <Table.Th>Machine Name</Table.Th>
                                <Table.Th>Power</Table.Th>
                                <Table.Th>CPUs</Table.Th>
                                <Table.Th>RAM</Table.Th>
                                <Table.Th>Group</Table.Th>
                                <Table.Th>Owner</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {Array.from({length: 12}).map((_, i) => (
                                <Table.Tr key={i}>
                                    <Table.Td/>
                                    <Table.Td><Skeleton height={10} width={90} radius="sm"/></Table.Td>
                                    <Table.Td><Skeleton height={10} width={`${50 + (i % 5) * 10}%`} radius="sm"/></Table.Td>
                                    <Table.Td><Skeleton height={16} width={52} radius="xl"/></Table.Td>
                                    <Table.Td><Skeleton height={10} width={20} radius="sm"/></Table.Td>
                                    <Table.Td><Skeleton height={10} width={28} radius="sm"/></Table.Td>
                                    <Table.Td><Skeleton height={10} width={`${40 + (i % 4) * 12}%`} radius="sm"/></Table.Td>
                                    <Table.Td><Skeleton height={10} width={60} radius="sm"/></Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>
            </Stack>
        );
    }

    return (
        <Stack gap={0} style={{flex: 1, minHeight: 0, height: '100%', overflow: 'hidden'}}>

            {/* ── Clash Banner ── */}
            {clashes.length > 0 && (
                <ClashBanner clashes={clashes} onJumpTo={jumpTo}/>
            )}

            {/* ── Toolbar ── */}
            <Group px="md" py="xs" gap="sm"
                   style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}} wrap="wrap">
                <TextInput
                    placeholder="Search IP, name, owner…"
                    leftSection={<IconSearch size={14}/>}
                    size="xs"
                    value={search}
                    onChange={e => setSearch(e.currentTarget.value)}
                    style={{flex: '1 1 180px', maxWidth: 280}}
                />
                <SegmentedControl
                    size="xs"
                    data={['all', 'on', 'off', 'suspended']}
                    value={powerF}
                    onChange={setPowerF}
                />
                {isCore && (
                    <Switch
                        size="xs"
                        label="Show empty IPs"
                        checked={showEmpty}
                        onChange={e => setShowEmpty(e.currentTarget.checked)}
                    />
                )}
                <Text size="xs" c="dimmed" ml="auto" ff="monospace">{totalVisible} rows</Text>
            </Group>

            {/* ── Table ── */}
            <Box style={{flex: 1, minHeight: 0, overflowY: 'auto'}}>
                <Table highlightOnHover stickyHeader verticalSpacing="xs" fz="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={24}/>
                            <Table.Th>IP Address</Table.Th>
                            <Table.Th>Machine Name</Table.Th>
                            <Table.Th>Power</Table.Th>
                            <Table.Th>CPUs</Table.Th>
                            <Table.Th>RAM</Table.Th>
                            <Table.Th>Group</Table.Th>
                            <Table.Th>Owner</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>

                        {/* ── Clash rows first ── */}
                        {filteredClashes.map(({ip, guests}) => (
                            <ClashRow
                                key={ip}
                                ip={ip}
                                guests={guests}
                                expanded={expanded.has(ip)}
                                onToggle={() => toggle(ip)}
                            />
                        ))}

                        {/* ── Normal / empty rows ── */}
                        {filteredRows.map(({ip, guest}) => {
                            const isExp = expanded.has(ip);
                            return (
                                <>
                                    <Table.Tr
                                        key={ip}
                                        data-ip={ip}
                                        onClick={() => guest && toggle(ip)}
                                        style={{
                                            cursor : guest ? 'pointer' : 'default',
                                            opacity: guest ? 1 : 0.35,
                                        }}
                                    >
                                        <Table.Td>
                                            {guest && (
                                                <IconChevronRight
                                                    size={12}
                                                    color="var(--mantine-color-dark-3)"
                                                    style={{
                                                        transform : isExp ? 'rotate(90deg)' : 'none',
                                                        transition: 'transform 0.2s',
                                                    }}
                                                />
                                            )}
                                        </Table.Td>
                                        <Table.Td ff="monospace" c="dimmed">{ip}</Table.Td>
                                        <Table.Td fw={guest ? 500 : 400} c={guest ? undefined : 'dark.5'} ff="monospace">
                                            {guest?.name ?? 'unallocated'}
                                        </Table.Td>
                                        <Table.Td>{guest && <PowerBadge state={guest.power}/>}</Table.Td>
                                        <Table.Td ff="monospace">{guest?.cpu}</Table.Td>
                                        <Table.Td ff="monospace">{guest ? `${guest.ram}G` : ''}</Table.Td>
                                        <Table.Td c="dimmed">{guest?.group}</Table.Td>
                                        <Table.Td ff="monospace" c="dimmed">{guest?.owner}</Table.Td>
                                    </Table.Tr>

                                    {guest && (
                                        <Table.Tr key={`${ip}-detail`} style={{background: 'var(--mantine-color-dark-8)'}}>
                                            <Table.Td colSpan={8} p={0}>
                                                <Collapse in={isExp}>
                                                    <Box px="xl" py="sm">
                                                        <MachineDetail machine={guest}/>
                                                    </Box>
                                                </Collapse>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </>
                            );
                        })}

                    </Table.Tbody>
                </Table>

                {totalVisible === 0 && (
                    <Text ta="center" c="dimmed" py="xl">No results match your filters</Text>
                )}
            </Box>
        </Stack>
    );
}