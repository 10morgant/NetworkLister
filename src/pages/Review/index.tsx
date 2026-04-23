// src/pages/Review/index.tsx
import {
    Fragment,
    useMemo,
    useState,
} from 'react';
import type {ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Center,
    Checkbox,
    Collapse,
    Group,
    Loader,
    Menu,
    Modal,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Tooltip,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {
    IconAlertCircle,
    IconAlertTriangle,
    IconArchive,
    IconChevronRight,
    IconDownload,
    IconFileTypeCsv,
    IconJson,
    IconTrash,
} from '@tabler/icons-react';
import {fetchGuestsReview} from '@/api/machines';
import {queryKeys} from '@/api/queryKeys';
import {PowerBadge} from '@/components/shared/PowerBadge';
import {StatCard} from '@/components/shared/StatCard';
import {fmtDate, fmtUptime} from '@/pages/Networks/utils';
import type {Machine} from '@/types';
import {exportCsv, exportJson} from '@/utils/export';
import {fmtAge, getMachineAge} from '@/utils/common';

const DAY_MS = 1000 * 60 * 60 * 24;
type ThresholdValue = '3m' | '6m' | '1y' | '2y' | '3y' | '4y' | '5y';

const PRESETS = [
    {label: '3 months', value: '3m', days: 90},
    {label: '6 months', value: '6m', days: 180},
    {label: '1 year',   value: '1y', days: 365},
    {label: '2 years',  value: '2y', days: 2*365},
    {label: '3 years',  value: '3y', days: 3*365},
    {label: '4 years',  value: '4y', days: 4*365},
    {label: '5 years',  value: '5y', days: 5*365},
].map((p) => ({...p, ms: p.days * DAY_MS})) as unknown as readonly {
    label: string;
    value: ThresholdValue;
    days: number;
    ms: number;
}[];


const NOTES_FIELD_ALIASES = ['notes'];
const VCENTER_FIELD_ALIASES = ['vcenter_url', 'vcenterurl', 'vcenter', 'vcenter_link', 'vcenter link'];

function getCustomField(machine: Machine, aliases: readonly string[]) {
    const fields = machine.custom_fields;
    if (!fields) return undefined;

    const loweredAliases = aliases.map((alias) => alias.toLowerCase());

    for (const [key, value] of Object.entries(fields)) {
        const normalizedKey = key.toLowerCase();
        const matches = loweredAliases.some((alias) => normalizedKey === alias || normalizedKey.includes(alias));
        if (matches && value.trim()) return value.trim();
    }

    return undefined;
}

function getMachineNotes(machine: Machine) {
    return getCustomField(machine, NOTES_FIELD_ALIASES);
}

function getMachineVcenterUrl(machine: Machine) {
    return getCustomField(machine, VCENTER_FIELD_ALIASES);
}


function getAgeColor(ageMs: number) {
    if (ageMs >= PRESETS[3].ms) return 'var(--mantine-color-red-5)';
    if (ageMs >= PRESETS[2].ms) return 'var(--mantine-color-yellow-5)';
    return 'var(--mantine-color-dark-2)';
}

function ConfirmModal({opened, onClose, action, count, onConfirm}: {
    opened: boolean;
    onClose: () => void;
    action: 'archive' | 'delete';
    count: number;
    onConfirm: () => void;
}) {
    const isDelete = action === 'delete';

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconAlertTriangle
                        size={18}
                        color={isDelete ? 'var(--mantine-color-red-5)' : 'var(--mantine-color-yellow-5)'}
                    />
                    <Text fw={700}>
                        {isDelete ? 'Delete' : 'Archive'} {count} machine{count !== 1 ? 's' : ''}?
                    </Text>
                </Group>
            }
            centered
            size="sm"
        >
            <Text size="sm" c="dimmed" mb="lg">
                {isDelete
                    ? `This will permanently delete ${count} machine${count !== 1 ? 's' : ''}. This cannot be undone.`
                    : `This will archive ${count} machine${count !== 1 ? 's' : ''} and remove them from active views.`}
            </Text>
            <Group justify="flex-end" gap="sm">
                <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
                <Button
                    color={isDelete ? 'red' : 'yellow'}
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    Confirm {isDelete ? 'Delete' : 'Archive'}
                </Button>
            </Group>
        </Modal>
    );
}

function ExportMenu({machines, label, filename, disabled}: {
    machines: Machine[];
    label: string;
    filename: string;
    disabled?: boolean;
}) {
    return (
        <Menu shadow="md" width={160} disabled={disabled}>
            <Menu.Target>
                <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    leftSection={<IconDownload size={13}/>}
                    disabled={disabled}
                >
                    {label}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>Export as</Menu.Label>
                <Menu.Item leftSection={<IconJson size={14}/>} onClick={() => exportJson(machines, filename)}>
                    JSON
                </Menu.Item>
                <Menu.Item leftSection={<IconFileTypeCsv size={14}/>} onClick={() => exportCsv(machines, filename)}>
                    CSV
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}

function DetailField({label, children}: { label: string; children: ReactNode }) {
    return (
        <Stack gap={3}>
            <Text
                size="xs"
                tt="uppercase"
                fw={600}
                style={{letterSpacing: '0.07em', color: 'var(--mantine-color-dark-3)'}}
            >
                {label}
            </Text>
            {children}
        </Stack>
    );
}

function ExpandedDetail({machine}: { machine: Machine }) {
    const notes = getMachineNotes(machine);
    const vcenterUrl = getMachineVcenterUrl(machine);
    const visibleNetworks = machine.networks.slice(0, 3);
    const remainingNetworkCount = Math.max(machine.networks.length - visibleNetworks.length, 0);

    return (
        <Box px="xl" py="md" style={{background: 'var(--surface-1)', borderBottom: '1px solid var(--border)'}}>
            <SimpleGrid cols={6} mb="md">
                <DetailField label="Folder">
                    <Text size="xs" c="dimmed">{machine.folder ?? '—'}</Text>
                </DetailField>

                <DetailField label="Sub-group">
                    <Text size="xs" c="dimmed">{machine.sub_group ?? '—'}</Text>
                </DetailField>

                <DetailField label="CPUs">
                    <Text size="xs" ff="monospace">{machine.cpu} vCPU</Text>
                </DetailField>

                <DetailField label="RAM">
                    <Text size="xs" ff="monospace">{machine.ram} GB</Text>
                </DetailField>

                <DetailField label="Uptime">
                    <Text size="xs" ff="monospace" c="dimmed">
                        {machine.power === 'on' ? fmtUptime(machine.power_on_time ?? null) : '—'}
                    </Text>
                </DetailField>

                <DetailField label="Networks">
                    <Stack gap={4}>
                        {visibleNetworks.length > 0 ? visibleNetworks.map((network) => (
                            <Group key={network.id} gap="xs" wrap="nowrap">
                                <Text size="xs" ff="monospace">{network.name}</Text>
                                <Badge size="xs" variant="light" color={network.core ? 'blue' : 'cyan'}>
                                    {network.core ? 'core' : 'user'}
                                </Badge>
                            </Group>
                        )) : <Text size="xs" c="dimmed">—</Text>}
                        {remainingNetworkCount > 0 && (
                            <Text size="xs" c="dimmed">+{remainingNetworkCount} more</Text>
                        )}
                    </Stack>
                </DetailField>
            </SimpleGrid>

            <SimpleGrid cols={3}>
                <DetailField label="Description">
                    <Text size="xs" c="dimmed">{machine.description || '—'}</Text>
                </DetailField>

                <DetailField label="Notes">
                    <Text size="xs" c="dimmed" style={{whiteSpace: 'pre-wrap'}}>
                        {notes ?? '—'}
                    </Text>
                </DetailField>

                <DetailField label="vCenter">
                    {vcenterUrl ? (
                        <Text
                            size="xs"
                            ff="monospace"
                            component="a"
                            href={vcenterUrl}
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
                            title={vcenterUrl}
                        >
                            {vcenterUrl}
                        </Text>
                    ) : (
                        <Text size="xs" c="dimmed">—</Text>
                    )}
                </DetailField>
            </SimpleGrid>
        </Box>
    );
}

function MachineRow({
    machine,
    isSelected,
    isExpanded,
    onToggleSelect,
    onToggleExpand,
    onAction,
}: {
    machine: Machine;
    isSelected: boolean;
    isExpanded: boolean;
    onToggleSelect: () => void;
    onToggleExpand: () => void;
    onAction: (action: 'archive' | 'delete') => void;
}) {
    const ageMs = getMachineAge(machine);

    return (
        <Fragment key={machine.id}>
            <Table.Tr
                style={{
                    background: isSelected
                        ? 'var(--surface-3)'
                        : isExpanded
                            ? 'var(--surface-2)'
                            : undefined,
                }}
            >
                <Table.Td>
                    <Checkbox size="xs" checked={isSelected} onChange={onToggleSelect}/>
                </Table.Td>

                <Table.Td>
                    <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="gray"
                        onClick={onToggleExpand}
                    >
                        <IconChevronRight
                            size={13}
                            style={{
                                transform : isExpanded ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s',
                            }}
                        />
                    </ActionIcon>
                </Table.Td>

                <Table.Td fw={500} ff="monospace">{machine.name}</Table.Td>
                <Table.Td ff="monospace" c="dimmed">{machine.folder ?? '—'}</Table.Td>
                <Table.Td><PowerBadge state={machine.power}/></Table.Td>
                <Table.Td>
                    <Text size="xs" ff="monospace" fw={700} style={{color: getAgeColor(ageMs)}}>
                        {fmtAge(ageMs)}
                    </Text>
                </Table.Td>
                <Table.Td ff="monospace" c="dimmed">{fmtDate(machine.created ?? null)}</Table.Td>
                <Table.Td ff="monospace" c="dimmed">{machine.owner ?? '—'}</Table.Td>

                <Table.Td>
                    <Group gap={4}>
                        <Tooltip label="Archive" withArrow>
                            <ActionIcon size="xs" variant="light" color="yellow"
                                        onClick={() => onAction('archive')}>
                                <IconArchive size={12}/>
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete" withArrow>
                            <ActionIcon size="xs" variant="light" color="red"
                                        onClick={() => onAction('delete')}>
                                <IconTrash size={12}/>
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>

            <Table.Tr>
                <Table.Td colSpan={9} p={0}>
                    <Collapse expanded={isExpanded}>
                        <ExpandedDetail machine={machine}/>
                    </Collapse>
                </Table.Td>
            </Table.Tr>
        </Fragment>
    );
}


export default function ReviewPage() {
    const [threshold, setThreshold] = useState<ThresholdValue>('2y');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [archivedLocally, setArchivedLocally] = useState<Set<string>>(new Set());
    const [confirmAction, setConfirmAction] = useState<'archive' | 'delete'>('delete');
    const [modalOpened, {open: openModal, close: closeModal}] = useDisclosure(false);

    const thresholdPreset = PRESETS.find((preset) => preset.value === threshold) ?? PRESETS[3];

    const reviewQuery = useQuery({
        queryKey: queryKeys.machinesOlderThan(thresholdPreset.ms),
        queryFn: () => fetchGuestsReview({minAgeDays: thresholdPreset.days}),
    });

    const fetchedMachines = reviewQuery.data?.items ?? [];
    const oldMachines = fetchedMachines.filter((machine) => !dismissed.has(machine.id));

    const allSelected = oldMachines.length > 0 && oldMachines.every((machine) => selected.has(machine.id));
    const someSelected = oldMachines.some((machine) => selected.has(machine.id));

    const toggleOne = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const toggleAll = () =>
        setSelected(allSelected ? new Set() : new Set(oldMachines.map((machine) => machine.id)));

    const toggleExpand = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const selectedMachines = useMemo(
        () => oldMachines.filter((machine) => selected.has(machine.id)),
        [oldMachines, selected],
    );

    const handleConfirm = () => {
        if (selected.size === 0) return;

        if (confirmAction === 'archive') {
            setArchivedLocally((prev) => {
                const next = new Set(prev);
                selected.forEach((id) => next.add(id));
                return next;
            });
        }

        setDismissed((prev) => {
            const next = new Set(prev);
            selected.forEach((id) => next.add(id));
            return next;
        });
        setSelected(new Set());
        setExpanded((prev) => new Set([...prev].filter((id) => !selected.has(id))));
    };

    const triggerAction = (action: 'archive' | 'delete') => {
        setConfirmAction(action);
        openModal();
    };

    const triggerSingleAction = (id: string, action: 'archive' | 'delete') => {
        setSelected(new Set([id]));
        triggerAction(action);
    };

    const stats = useMemo(() => ({
        total   : oldMachines.length,
        on      : oldMachines.filter((machine) => machine.power === 'on').length,
        off     : oldMachines.filter((machine) => machine.power === 'off').length,
        archived: (reviewQuery.data?.summary.archived ?? 0) + archivedLocally.size,
    }), [archivedLocally.size, oldMachines, reviewQuery.data?.summary.archived]);

    return (
        <Stack gap={0} style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
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

            <Group
                px="md"
                py="xs"
                gap="sm"
                style={{borderBottom: '1px solid var(--border)', flexShrink: 0}}
                wrap="wrap"
            >
                <Group gap="xs">
                    <Text size="xs" c="dimmed">Older than:</Text>
                    <SegmentedControl
                        size="xs"
                        value={threshold}
                        onChange={(value) => {
                            setThreshold(value as ThresholdValue);
                            setSelected(new Set());
                            setExpanded(new Set());
                        }}
                        data={PRESETS.map((preset) => ({label: preset.label, value: preset.value}))}
                    />
                </Group>
                <Group gap="xs" ml="auto">
                    {someSelected && (
                        <>
                            <ExportMenu
                                machines={selectedMachines}
                                label={`Export selected (${selectedMachines.length})`}
                                filename={`vms-selected-older-than-${threshold}`}
                            />
                            <Button
                                size="xs"
                                variant="light"
                                color="yellow"
                                leftSection={<IconArchive size={13}/>}
                                onClick={() => triggerAction('archive')}
                            >
                                Archive
                            </Button>
                            <Button
                                size="xs"
                                variant="light"
                                color="red"
                                leftSection={<IconTrash size={13}/>}
                                onClick={() => triggerAction('delete')}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                    <ExportMenu
                        machines={oldMachines}
                        label="Export all"
                        filename={`vms-older-than-${threshold}`}
                        disabled={oldMachines.length === 0}
                    />
                    <Text size="xs" c="dimmed" ff="monospace" style={{alignSelf: 'center'}}>
                        {oldMachines.length} machines
                    </Text>
                </Group>
            </Group>

            <Box style={{flex: 1, overflowY: 'auto'}}>
                {reviewQuery.isLoading && (
                    <Center style={{padding: 24}}>
                        <Loader size="sm"/>
                    </Center>
                )}

                {reviewQuery.isError && (
                    <Center style={{padding: 24}}>
                        <Alert icon={<IconAlertCircle size={16}/>} color="red" title="Failed to load guests">
                            Could not fetch review candidates. Check your connection and try again.
                        </Alert>
                    </Center>
                )}

                {!reviewQuery.isLoading && !reviewQuery.isError && (
                    <>
                        <Table highlightOnHover stickyHeader verticalSpacing="xs" fz="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th w={36}>
                                        <Checkbox
                                            size="xs"
                                            checked={allSelected}
                                            indeterminate={someSelected && !allSelected}
                                            onChange={toggleAll}
                                        />
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
                                {oldMachines.map((machine) => (
                                    <MachineRow
                                        key={machine.id}
                                        machine={machine}
                                        isSelected={selected.has(machine.id)}
                                        isExpanded={expanded.has(machine.id)}
                                        onToggleSelect={() => toggleOne(machine.id)}
                                        onToggleExpand={() => toggleExpand(machine.id)}
                                        onAction={(action) => triggerSingleAction(machine.id, action)}
                                    />
                                ))}
                            </Table.Tbody>
                        </Table>

                        {oldMachines.length === 0 && (
                            <Stack align="center" py="xl" gap="xs">
                                <Text c="dimmed">No machines older than {thresholdPreset.label}</Text>
                            </Stack>
                        )}
                    </>
                )}
            </Box>

            <ConfirmModal
                opened={modalOpened}
                onClose={closeModal}
                action={confirmAction}
                count={selectedMachines.length}
                onConfirm={handleConfirm}
            />
        </Stack>
    );
}