// src/pages/Review/index.tsx
import {
    useMemo,
    useState
}                      from 'react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Checkbox,
    Collapse,
    Group,
    Menu,
    Modal,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Tooltip,
}                      from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {
    IconAlertTriangle,
    IconArchive,
    IconChevronRight,
    IconDownload,
    IconFileTypeCsv,
    IconJson,
    IconTrash,
}                      from '@tabler/icons-react';
import {PowerBadge}    from '@/components/shared/PowerBadge';
import {StatCard}      from '@/components/shared/StatCard';
import {
    fmtDate,
    fmtUptime
}                      from '@/pages/Networks/utils';
import {
    exportCsv,
    exportJson
}                      from '@/utils/export';
import type {Machine}  from '@/types';
import {
    fmtAge,
    machineAgeMs
}                      from "@/utils/common";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS = [
    {label: '3 months', value: '3m', ms: 1000 * 60 * 60 * 24 * 90},
    {label: '6 months', value: '6m', ms: 1000 * 60 * 60 * 24 * 180},
    {label: '1 year', value: '1y', ms: 1000 * 60 * 60 * 24 * 365},
    {label: '2 years', value: '2y', ms: 1000 * 60 * 60 * 24 * 730},
];

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({opened, onClose, action, count, onConfirm}: {
    opened: boolean; onClose: () => void;
    action: 'archive' | 'delete'; count: number; onConfirm: () => void;
}) {
    const isDelete = action === 'delete';
    return (
        <Modal opened={opened} onClose={onClose} title={
            <Group gap="xs">
                <IconAlertTriangle size={18}
                                   color={isDelete ? 'var(--mantine-color-red-5)' : 'var(--mantine-color-yellow-5)'}/>
                <Text fw={700}>{isDelete ? 'Delete' : 'Archive'} {count} machine{count !== 1 ? 's' : ''}?</Text>
            </Group>
        } centered size="sm">
            <Text size="sm" c="dimmed" mb="lg">
                {isDelete
                    ? `This will permanently delete ${count} machine${count !== 1 ? 's' : ''}. This cannot be undone.`
                    : `This will archive ${count} machine${count !== 1 ? 's' : ''} and remove them from active views.`}
            </Text>
            <Group justify="flex-end" gap="sm">
                <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
                <Button color={isDelete ? 'red' : 'yellow'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}>
                    Confirm {isDelete ? 'Delete' : 'Archive'}
                </Button>
            </Group>
        </Modal>
    );
}


function ExportMenu({machines, label, filename, disabled}: {
    machines: Machine[]; label: string; filename: string; disabled?: boolean;
}) {
    return (
        <Menu shadow="md" width={160} disabled={disabled}>
            <Menu.Target>
                <Button size="xs" variant="light" color="gray"
                        leftSection={<IconDownload size={13}/>} disabled={disabled}>
                    {label}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>Export as</Menu.Label>
                <Menu.Item leftSection={<IconJson size={14}/>}
                           onClick={() => exportJson(machines, filename)}>JSON</Menu.Item>
                <Menu.Item leftSection={<IconFileTypeCsv size={14}/>}
                           onClick={() => exportCsv(machines, filename)}>CSV</Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}


function DetailField({label, children}: { label: string; children: React.ReactNode }) {
    return (
        <Stack gap={3}>
            <Text size="xs" tt="uppercase" fw={600}
                  style={{letterSpacing: '0.07em', color: 'var(--mantine-color-dark-3)'}}>
                {label}
            </Text>
            {children}
        </Stack>
    );
}

function ExpandedDetail({machine}: { machine: Machine }) {
    const network = NETWORKS.find(n => n.id === machine.network);

    return (
        <Box
            px="xl" py="md"
            style={{background: 'var(--surface-1)', borderBottom: '1px solid var(--border)'}}
        >
            {/* Top grid — 6 columns */}
            <SimpleGrid cols={6} mb="md">

                <DetailField label="Folder">
                    <Text size="xs" c="dimmed">{machine.folder}</Text>
                </DetailField>

                <DetailField label="Sub-group">
                    <Text size="xs" c="dimmed">{machine.subgroup}</Text>
                </DetailField>

                <DetailField label="CPUs">
                    <Text size="xs" ff="monospace">{machine.cpus} vCPU</Text>
                </DetailField>

                <DetailField label="RAM">
                    <Text size="xs" ff="monospace">{machine.ram} GB</Text>
                </DetailField>

                <DetailField label="Uptime">
                    <Text size="xs" ff="monospace" c="dimmed">
                        {machine.power === 'on' && machine.uptime
                            ? fmtUptime(machine.uptime)
                            : '—'}
                    </Text>
                </DetailField>

                <DetailField label="Network">
                    <Group gap="xs">
                        <Text size="xs" ff="monospace">{network?.cidr ?? machine.network}</Text>
                        {network && (
                            <Badge size="xs" variant="light" color={network.type === 'core' ? 'blue' : 'cyan'}>
                                {network.type}
                            </Badge>
                        )}
                    </Group>
                </DetailField>

            </SimpleGrid>

            {/* Bottom row — description, notes, vcenter link */}
            <SimpleGrid cols={3}>

                <DetailField label="Description">
                    <Text size="xs" c="dimmed">{machine.description || '—'}</Text>
                </DetailField>

                <DetailField label="Notes">
                    <Text size="xs" c="dimmed" style={{whiteSpace: 'pre-wrap'}}>
                        {/* Notes aren't on Machine yet — placeholder until wired to API */}
                        —
                    </Text>
                </DetailField>

                <DetailField label="vCenter">
                    {machine.vcenterUrl ? (
                        <Text
                            size="xs"
                            ff="monospace"
                            component="a"
                            href={machine.vcenterUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                color         : 'var(--mantine-color-blue-4)',
                                textDecoration: 'none',
                                overflow      : 'hidden',
                                textOverflow  : 'ellipsis',
                                whiteSpace    : 'nowrap',
                                display       : 'block',
                            }}
                            title={machine.vcenterUrl}
                        >
                            {machine.vcenterUrl}
                        </Text>
                    ) : (
                        <Text size="xs" c="dimmed">—</Text>
                    )}
                </DetailField>

            </SimpleGrid>
        </Box>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
    const [machines, setMachines]                             = useState<Machine[]>(INITIAL_MACHINES);
    const [threshold, setThreshold]                           = useState('1y');
    const [selected, setSelected]                             = useState<Set<string>>(new Set());
    const [expanded, setExpanded]                             = useState<Set<string>>(new Set());
    const [confirmAction, setConfirmAction]                   = useState<'archive' | 'delete'>('delete');
    const [modalOpened, {open: openModal, close: closeModal}] = useDisclosure(false);
    const [archived, setArchived]                             = useState<Set<string>>(new Set());

    const thresholdMs    = PRESETS.find(p => p.value === threshold)!.ms;
    const thresholdLabel = PRESETS.find(p => p.value === threshold)!.label;

    const oldMachines = useMemo(() =>
            machines
                .filter(m => machineAgeMs(m.created) >= thresholdMs)
                .sort((a, b) => machineAgeMs(b.created) - machineAgeMs(a.created))
        , [machines, thresholdMs]);

    const allSelected  = oldMachines.length > 0 && oldMachines.every(m => selected.has(m.ip));
    const someSelected = oldMachines.some(m => selected.has(m.ip));

    const toggleOne = (ip: string) =>
        setSelected(prev => {
            const n = new Set(prev);
            n.has(ip) ? n.delete(ip) : n.add(ip);
            return n;
        });

    const toggleAll = () =>
        setSelected(allSelected ? new Set() : new Set(oldMachines.map(m => m.ip)));

    const toggleExpand = (ip: string) =>
        setExpanded(prev => {
            const n = new Set(prev);
            n.has(ip) ? n.delete(ip) : n.add(ip);
            return n;
        });

    const selectedMachines = useMemo(
        () => oldMachines.filter(m => selected.has(m.ip)),
        [oldMachines, selected],
    );

    const handleConfirm = () => {
        if (confirmAction === 'delete') {
            setMachines(prev => prev.filter(m => !selected.has(m.ip)));
        } else {
            setArchived(prev => {
                const n = new Set(prev);
                selected.forEach(ip => n.add(ip));
                return n;
            });
            setMachines(prev => prev.filter(m => !selected.has(m.ip)));
        }
        setSelected(new Set());
        setExpanded(new Set());
    };

    const triggerAction = (action: 'archive' | 'delete') => {
        setConfirmAction(action);
        openModal();
    };

    const stats = useMemo(() => ({
        total   : oldMachines.length,
        on      : oldMachines.filter(m => m.power === 'on').length,
        off     : oldMachines.filter(m => m.power === 'off').length,
        archived: archived.size,
    }), [oldMachines, archived]);

    return (
        <Stack gap={0} style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>

            {/* Header */}
            <Box p="md" style={{borderBottom: '1px solid var(--border)', flexShrink: 0}}>
                <Group justify="space-between" wrap="wrap" gap="sm">
                    <Stack gap={2}>
                        <Text fw={700} size="md">Review VMs</Text>
                        <Text size="xs" c="dimmed">Machines older than the selected threshold</Text>
                    </Stack>
                    <Group gap="xs">
                        <StatCard label="Matching" value={stats.total}/>
                        <StatCard label="Online" value={stats.on} color="var(--mantine-color-teal-5)"/>
                        <StatCard label="Offline" value={stats.off} color="var(--mantine-color-red-5)"/>
                        <StatCard label="Archived" value={stats.archived} color="var(--mantine-color-yellow-5)"/>
                    </Group>
                </Group>
            </Box>

            {/* Toolbar */}
            <Group px="md" py="xs" gap="sm"
                   style={{borderBottom: '1px solid var(--border)', flexShrink: 0}} wrap="wrap">
                <Group gap="xs">
                    <Text size="xs" c="dimmed">Older than:</Text>
                    <SegmentedControl size="xs" value={threshold}
                                      onChange={v => {
                                          setThreshold(v);
                                          setSelected(new Set());
                                          setExpanded(new Set());
                                      }}
                                      data={PRESETS.map(p => ({label: p.label, value: p.value}))}/>
                </Group>
                <Group gap="xs" ml="auto">
                    {someSelected && (
                        <>
                            <ExportMenu machines={selectedMachines}
                                        label={`Export selected (${selectedMachines.length})`}
                                        filename={`vms-selected-older-than-${threshold}`}/>
                            <Button size="xs" variant="light" color="yellow"
                                    leftSection={<IconArchive size={13}/>}
                                    onClick={() => triggerAction('archive')}>Archive</Button>
                            <Button size="xs" variant="light" color="red"
                                    leftSection={<IconTrash size={13}/>}
                                    onClick={() => triggerAction('delete')}>Delete</Button>
                        </>
                    )}
                    <ExportMenu machines={oldMachines} label="Export all"
                                filename={`vms-older-than-${threshold}`} disabled={oldMachines.length === 0}/>
                    <Text size="xs" c="dimmed" ff="monospace" style={{alignSelf: 'center'}}>
                        {oldMachines.length} machines
                    </Text>
                </Group>
            </Group>

            {/* Table */}
            <Box style={{flex: 1, overflowY: 'auto'}}>
                <Table highlightOnHover stickyHeader verticalSpacing="xs" fz="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={36}>
                                <Checkbox size="xs" checked={allSelected}
                                          indeterminate={someSelected && !allSelected} onChange={toggleAll}/>
                            </Table.Th>
                            <Table.Th w={28}/>
                            <Table.Th>Machine</Table.Th>
                            <Table.Th>Folder</Table.Th>
                            <Table.Th>Power</Table.Th>
                            <Table.Th>Age</Table.Th>
                            <Table.Th>Created</Table.Th>
                            <Table.Th>Owner</Table.Th>
                            <Table.Th w={80}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {oldMachines.map(m => {
                            const isSel    = selected.has(m.ip);
                            const isExp    = expanded.has(m.ip);
                            const ageMs    = machineAgeMs(m.created);
                            const ageColor = ageMs >= PRESETS[3].ms
                                ? 'var(--mantine-color-red-5)'
                                : ageMs >= PRESETS[2].ms
                                    ? 'var(--mantine-color-yellow-5)'
                                    : 'var(--mantine-color-dark-2)';

                            return (
                                <>
                                    <Table.Tr
                                        key={m.ip}
                                        style={{
                                            background: isSel
                                                ? 'var(--surface-3)'
                                                : isExp
                                                    ? 'var(--surface-2)'
                                                    : undefined,
                                        }}
                                    >
                                        {/* Checkbox */}
                                        <Table.Td>
                                            <Checkbox size="xs" checked={isSel} onChange={() => toggleOne(m.ip)}/>
                                        </Table.Td>

                                        {/* Expand chevron */}
                                        <Table.Td>
                                            <ActionIcon
                                                size="xs" variant="subtle" color="gray"
                                                onClick={() => toggleExpand(m.ip)}
                                            >
                                                <IconChevronRight size={13} style={{
                                                    transform : isExp ? 'rotate(90deg)' : 'none',
                                                    transition: 'transform 0.2s',
                                                }}/>
                                            </ActionIcon>
                                        </Table.Td>

                                        <Table.Td fw={500} ff="monospace">{m.name}</Table.Td>
                                        <Table.Td ff="monospace" c="dimmed">{m.folder}</Table.Td>
                                        <Table.Td><PowerBadge state={m.power}/></Table.Td>
                                        <Table.Td>
                                            <Text size="xs" ff="monospace" fw={700} style={{color: ageColor}}>
                                                {fmtAge(ageMs)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td ff="monospace" c="dimmed">{fmtDate(m.created)}</Table.Td>
                                        <Table.Td ff="monospace" c="dimmed">{m.owner}</Table.Td>

                                        <Table.Td>
                                            <Group gap={4}>
                                                <Tooltip label="Archive" withArrow>
                                                    <ActionIcon size="xs" variant="light" color="yellow"
                                                                onClick={() => {
                                                                    setSelected(new Set([m.ip]));
                                                                    triggerAction('archive');
                                                                }}>
                                                        <IconArchive size={12}/>
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Delete" withArrow>
                                                    <ActionIcon size="xs" variant="light" color="red"
                                                                onClick={() => {
                                                                    setSelected(new Set([m.ip]));
                                                                    triggerAction('delete');
                                                                }}>
                                                        <IconTrash size={12}/>
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>

                                    {/* Expanded detail */}
                                    <Table.Tr key={`${m.ip}-detail`}>
                                        <Table.Td colSpan={11} p={0}>
                                            <Collapse in={isExp}>
                                                <ExpandedDetail machine={m}/>
                                            </Collapse>
                                        </Table.Td>
                                    </Table.Tr>
                                </>
                            );
                        })}
                    </Table.Tbody>
                </Table>

                {oldMachines.length === 0 && (
                    <Stack align="center" py="xl" gap="xs">
                        <Text c="dimmed">No machines older than {thresholdLabel}</Text>
                    </Stack>
                )}
            </Box>

            <ConfirmModal
                opened={modalOpened} onClose={closeModal}
                action={confirmAction} count={selectedMachines.length}
                onConfirm={handleConfirm}/>
        </Stack>
    );
}