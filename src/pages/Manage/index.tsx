// src/pages/Manage/index.tsx
import {
    useMemo,
    useState
}                            from 'react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Collapse,
    Divider,
    Group,
    Modal,
    Paper,
    PasswordInput,
    SegmentedControl,
    Select,
    Stack,
    Switch,
    Table,
    Text,
    Textarea,
    TextInput,
    Tooltip,
    UnstyledButton,
}                            from '@mantine/core';
import {useForm}             from '@mantine/form';
import {useDisclosure}       from '@mantine/hooks';
import {
    IconCheck,
    IconChevronDown,
    IconEdit,
    IconLock,
    IconPlus,
    IconSearch,
    IconTrash,
    IconX,
}                            from '@tabler/icons-react';
import {NETWORKS as INITIAL} from '@/data/mock';
import type {Network}        from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Credentials {
    username: string;
    password: string;
}

interface NetworkFormValues {
    name: string;
    cidr: string;
    type: 'user' | 'core';
    // advanced
    description: string;
    dhcp: boolean;
    notes: string;
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateNetworkModal({
                                opened, onClose, onSubmit, sessionCreds, onSaveCreds,
                            }: {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: NetworkFormValues) => void;
    sessionCreds: Credentials | null;
    onSaveCreds: (c: Credentials) => void;
}) {
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const credForm = useForm<Credentials>({
        initialValues: {username: '', password: ''},
        validate     : {
            username: v => v.trim() ? null : 'Required',
            password: v => v.trim() ? null : 'Required',
        },
    });

    const netForm = useForm<NetworkFormValues>({
        initialValues: {
            name       : '', cidr: '', type: 'user',
            description: '', dhcp: true, notes: '',
        },
        validate     : {
            name: v => v.trim() ? null : 'Network name is required',
            cidr: v => /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(v.trim())
                ? null : 'Enter a valid CIDR (e.g. 192.168.10.0/24)',
        },
    });

    const handleClose = () => {
        netForm.reset();
        credForm.reset();
        setAdvancedOpen(false);
        onClose();
    };

    const handleSubmit = () => {
        // Validate credentials if not yet stored
        if (!sessionCreds && credForm.validate().hasErrors) return;
        if (netForm.validate().hasErrors) return;

        if (!sessionCreds) onSaveCreds(credForm.values);
        onSubmit(netForm.values);
        handleClose();
    };

    const needsCreds = !sessionCreds;

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={<Text fw={700} size="sm">Add Network</Text>}
            size="sm"
            centered
        >
            <Stack gap="md">

                {/* ── Credentials (first time only) ── */}
                {needsCreds && (
                    <>
                        <Paper withBorder p="sm" radius="sm"
                               style={{background: 'var(--mantine-color-dark-7)'}}>
                            <Group gap="xs" mb="sm">
                                <IconLock size={13} color="var(--mantine-color-dimmed)"/>
                                <Text size="xs" c="dimmed">
                                    Enter your credentials once — they'll be reused for this session.
                                </Text>
                            </Group>
                            <Stack gap="xs">
                                <TextInput
                                    label="Username" placeholder="your.username"
                                    size="xs" required
                                    {...credForm.getInputProps('username')}
                                />
                                <PasswordInput
                                    label="Password" placeholder="••••••••"
                                    size="xs" required
                                    {...credForm.getInputProps('password')}
                                />
                            </Stack>
                        </Paper>
                        <Divider/>
                    </>
                )}

                {/* Already authenticated indicator */}
                {!needsCreds && (
                    <Group gap="xs">
                        <IconLock size={13} color="var(--mantine-color-teal-5)"/>
                        <Text size="xs" c="teal.4">
                            Authenticated as <strong>{sessionCreds.username}</strong>
                        </Text>
                    </Group>
                )}

                {/* ── Required fields ── */}
                <TextInput
                    label="Network name" placeholder="e.g. my-team-network"
                    size="xs" required
                    {...netForm.getInputProps('name')}
                />
                <TextInput
                    label="CIDR" placeholder="e.g. 192.168.200.0/24"
                    size="xs" required
                    {...netForm.getInputProps('cidr')}
                />
                <Select
                    label="Type" size="xs"
                    data={[{value: 'user', label: 'User'}, {value: 'core', label: 'Core'}]}
                    {...netForm.getInputProps('type')}
                />

                {/* ── Advanced (collapsible) ── */}
                <Box>
                    <UnstyledButton
                        onClick={() => setAdvancedOpen(v => !v)}
                        style={{width: '100%'}}
                    >
                        <Group justify="space-between" py={4}>
                            <Text size="xs" c="dimmed" fw={600} tt="uppercase"
                                  style={{letterSpacing: '0.08em'}}>
                                Advanced options
                            </Text>
                            <IconChevronDown size={14}
                                             color="var(--mantine-color-dimmed)"
                                             style={{
                                                 transform : advancedOpen ? 'rotate(180deg)' : 'none',
                                                 transition: 'transform 0.2s',
                                             }}
                            />
                        </Group>
                    </UnstyledButton>
                    <Divider mb="xs"/>
                    <Collapse in={advancedOpen}>
                        <Stack gap="sm" pt="xs">
                            <Switch
                                label="DHCP enabled"
                                description="Automatically assign IPs to guests on this network."
                                size="xs"
                                checked={netForm.values.dhcp}
                                onChange={e => netForm.setFieldValue('dhcp', e.currentTarget.checked)}
                            />
                            <TextInput
                                label="Description"
                                placeholder="Short description of this network's purpose"
                                size="xs"
                                {...netForm.getInputProps('description')}
                            />
                            <Textarea
                                label="Notes"
                                placeholder="Any additional notes…"
                                size="xs"
                                autosize minRows={2} maxRows={5}
                                {...netForm.getInputProps('notes')}
                            />
                        </Stack>
                    </Collapse>
                </Box>

                {/* ── Actions ── */}
                <Group justify="flex-end" gap="sm" mt="xs">
                    <Button variant="subtle" color="gray" size="xs" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button size="xs" onClick={handleSubmit}>
                        Create Network
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManagePage() {
    const [nets, setNets]                 = useState<Network[]>(INITIAL);
    const [search, setSearch]             = useState('');
    const [typeF, setTypeF]               = useState('all');
    const [editing, setEditing]           = useState<string | null>(null);
    const [editVal, setEditVal]           = useState('');
    const [modalOpen, {open, close}]      = useDisclosure(false);
    const [sessionCreds, setSessionCreds] = useState<Credentials | null>(null);

    const filtered = useMemo(() => {
        let n = nets;
        if (typeF !== 'all') n = n.filter(x => x.type === typeF);
        if (search) {
            const q = search.toLowerCase();
            n       = n.filter(x => x.name.toLowerCase().includes(q) || x.cidr.includes(q));
        }
        return n;
    }, [nets, search, typeF]);

    const save = () => {
        setNets(p => p.map(n => n.id === editing ? {...n, name: editVal} : n));
        setEditing(null);
    };
    const del  = (id: string) => setNets(p => p.filter(n => n.id !== id));

    const handleCreate = (values: NetworkFormValues) => {
        // TODO: replace mock with real API call:
        // const creds = sessionCreds!;
        // await fetch('/api/networks', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': 'Basic ' + btoa(`${creds.username}:${creds.password}`),
        //   },
        //   body: JSON.stringify(values),
        // });
        setNets(p => [...p, {
            id  : `u-${Date.now()}`,
            cidr: values.cidr,
            name: values.name,
            type: values.type,
        }]);
    };

    return (
        <Stack gap={0} style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>

            {/* Header */}
            <Box p="md" style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}}>
                <Group justify="space-between">
                    <Stack gap={2}>
                        <Group gap="xs">
                            <Text fw={700} size="md">Manage Networks</Text>
                            {sessionCreds && (
                                <Tooltip
                                    label="Credentials stored for this session — cleared on page reload."
                                    withArrow
                                >
                                    <Badge color="teal" variant="light" size="sm" style={{cursor: 'default'}}>
                                        <Group gap={4}>
                                            <IconLock size={10}/>
                                            {sessionCreds.username}
                                        </Group>
                                    </Badge>
                                </Tooltip>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed">
                            {nets.length} networks — {nets.filter(n => n.type === 'core').length} core,{' '}
                            {nets.filter(n => n.type === 'user').length} user
                        </Text>
                    </Stack>
                    <Button size="xs" leftSection={<IconPlus size={14}/>} onClick={open}>
                        Add Network
                    </Button>
                </Group>
            </Box>

            {/* Toolbar */}
            <Group px="md" py="xs" gap="sm"
                   style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}}>
                <TextInput
                    placeholder="Filter networks…" leftSection={<IconSearch size={14}/>} size="xs"
                    value={search} onChange={e => setSearch(e.currentTarget.value)}
                    style={{flex: '1 1 180px', maxWidth: 280}}
                />
                <SegmentedControl size="xs" data={['all', 'core', 'user']}
                                  value={typeF} onChange={setTypeF}/>
                <Text size="xs" c="dimmed" ml="auto" ff="monospace">{filtered.length} networks</Text>
            </Group>

            {/* Table */}
            <Box style={{flex: 1, overflowY: 'auto'}}>
                <Table highlightOnHover stickyHeader verticalSpacing="xs" fz="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>CIDR</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Guests</Table.Th>
                            <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map(net => {
                            const isEdit = editing === net.id;
                            const cnt    = 0;
                            return (
                                <Table.Tr key={net.id}>
                                    <Table.Td>
                                        {isEdit
                                            ? <TextInput size="xs" value={editVal}
                                                         onChange={e => setEditVal(e.currentTarget.value)}
                                                         onKeyDown={e => e.key === 'Enter' && save()}
                                                         autoFocus style={{maxWidth: 240}}/>
                                            : <Text size="xs" fw={600}>{net.name}</Text>}
                                    </Table.Td>
                                    <Table.Td ff="monospace" c="dimmed">{net.cidr}</Table.Td>
                                    <Table.Td>
                                        <Badge color={net.type === 'core' ? 'blue' : 'cyan'}
                                               variant="light" size="sm" tt="uppercase">{net.type}</Badge>
                                    </Table.Td>
                                    <Table.Td c={cnt > 0 ? undefined : 'dark.4'} ff="monospace">
                                        {cnt > 0 ? `${cnt} guests` : 'empty'}
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {isEdit ? <>
                                                <ActionIcon size="xs" color="blue" variant="light"
                                                            onClick={save}><IconCheck size={12}/></ActionIcon>
                                                <ActionIcon size="xs" color="gray" variant="light"
                                                            onClick={() => setEditing(null)}><IconX
                                                    size={12}/></ActionIcon>
                                            </> : <>
                                                <ActionIcon size="xs" color="gray" variant="light"
                                                            onClick={() => {
                                                                setEditing(net.id);
                                                                setEditVal(net.name);
                                                            }}>
                                                    <IconEdit size={12}/></ActionIcon>
                                                <ActionIcon size="xs" color="red" variant="light"
                                                            onClick={() => del(net.id)}><IconTrash
                                                    size={12}/></ActionIcon>
                                            </>}
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Box>

            {/* Modal */}
            <CreateNetworkModal
                opened={modalOpen}
                onClose={close}
                onSubmit={handleCreate}
                sessionCreds={sessionCreds}
                onSaveCreds={setSessionCreds}
            />
        </Stack>
    );
}