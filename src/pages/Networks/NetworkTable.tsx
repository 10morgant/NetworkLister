import {
    useMemo,
    useState
}                   from 'react';
import {
    Box,
    Center,
    Collapse,
    Group,
    Loader,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
}                   from '@mantine/core';
import {
    IconChevronRight,
    IconSearch
}                   from '@tabler/icons-react';
import {PowerBadge} from '@/components/shared/PowerBadge';
import type {IpRow} from '@/types';
import {
    fmtDate,
    fmtUptime
}                   from './utils';

interface Props {
    rows: IpRow[];
    isCore: boolean;
    isLoading: boolean;
}

export function NetworkTable({rows, isCore, isLoading}: Props) {
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

    const filtered = useMemo(() => rows.filter(({ip, machine}) => {
        if (!showEmpty && !machine) return false;
        if (powerF !== 'all' && machine?.power !== powerF) return false;
        if (search) {
            const q = search.toLowerCase();
            return ip.includes(q) || machine?.name?.toLowerCase().includes(q) ||
                machine?.owner?.toLowerCase().includes(q) || machine?.group?.toLowerCase().includes(q);
        }
        return true;
    }), [rows, showEmpty, powerF, search]);

    if (isLoading) {
        return (
            <Center style={{flex: 1}}>
                <Loader size="sm"/>
            </Center>
        );
    }

    return (
        <Stack gap={0} style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
            {/* Toolbar */}
            <Group px="md" py="xs" gap="sm"
                   style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}} wrap="wrap">
                <TextInput placeholder="Search IP, name, owner…" leftSection={<IconSearch size={14}/>}
                           size="xs" value={search} onChange={e => setSearch(e.currentTarget.value)}
                           style={{flex: '1 1 180px', maxWidth: 280}}/>
                <SegmentedControl size="xs"
                                  data={['all', 'on', 'off', 'suspended']}
                                  value={powerF} onChange={setPowerF}/>
                {isCore && (
                    <Switch size="xs" label="Show empty IPs" checked={showEmpty}
                            onChange={e => setShowEmpty(e.currentTarget.checked)}/>
                )}
                <Text size="xs" c="dimmed" ml="auto" ff="monospace">{filtered.length} rows</Text>
            </Group>

            {/* Table */}
            <Box style={{flex: 1, overflowY: 'auto'}}>
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
                        {filtered.map(({ip, machine}) => {
                            const isExp = expanded.has(ip);
                            return (
                                <>
                                    <Table.Tr
                                        key={ip}
                                        onClick={() => machine && toggle(ip)}
                                        style={{cursor: machine ? 'pointer' : 'default', opacity: machine ? 1 : 0.3}}
                                    >
                                        <Table.Td>
                                            {machine && (
                                                <IconChevronRight size={12} color="var(--mantine-color-dark-3)"
                                                                  style={{
                                                                      transform : isExp ? 'rotate(90deg)' : 'none',
                                                                      transition: 'transform 0.2s'
                                                                  }}/>
                                            )}
                                        </Table.Td>
                                        <Table.Td ff="monospace" c="dimmed">{ip}</Table.Td>
                                        <Table.Td fw={machine ? 500 : 400} c={machine ? undefined : 'dark.5'}
                                                  ff="monospace">
                                            {machine?.name ?? 'unallocated'}
                                        </Table.Td>
                                        <Table.Td>{machine && <PowerBadge state={machine.power}/>}</Table.Td>
                                        <Table.Td ff="monospace">{machine?.cpus}</Table.Td>
                                        <Table.Td ff="monospace">{machine ? `${machine.ram}G` : ''}</Table.Td>
                                        <Table.Td c="dimmed">{machine?.group}</Table.Td>
                                        <Table.Td ff="monospace" c="dimmed">{machine?.owner}</Table.Td>
                                    </Table.Tr>

                                    {machine && (
                                        <Table.Tr key={`${ip}-exp`} style={{background: 'var(--mantine-color-dark-8)'}}>
                                            <Table.Td colSpan={8} p={0}>
                                                <Collapse in={isExp}>
                                                    <SimpleGrid cols={6} px="xl" py="sm">
                                                        {[
                                                            ['Folder', machine.folder],
                                                            ['Group', machine.group],
                                                            ['Sub-Group', machine.subgroup],
                                                            ['Owner', machine.owner],
                                                            ['Created', fmtDate(machine.created)],
                                                            ['Uptime', machine.power === 'on' ? fmtUptime(machine.uptime) + ' ago' : '—'],
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
                                    )}
                                </>
                            );
                        })}
                    </Table.Tbody>
                </Table>
                {filtered.length === 0 && (
                    <Text ta="center" c="dimmed" py="xl">No results match your filters</Text>
                )}
            </Box>
        </Stack>
    );
}