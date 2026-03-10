import {
    useMemo,
    useState
}                      from 'react';
import {
    ActionIcon,
    Box,
    Group,
    ScrollArea,
    SegmentedControl,
    Skeleton,
    Stack,
    Text,
    TextInput,
}                      from '@mantine/core';
import {
    IconSearch,
    IconStar,
    IconStarFilled
}                      from '@tabler/icons-react';
import {
    Network,
    NetworksResponse
}                      from '@/types';
import {useStarred}    from '@/context/starred';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    networksResponse: NetworksResponse;
    selected: string;
    onSelect: (id: string) => void;
    isLoading?: boolean;
}

// ─── NetItem ──────────────────────────────────────────────────────────────────

interface NetItemProps {
    net: Network;
    selected: string;
    starred: boolean;
    cnt: number;
    on: number;
    onSelect: (id: string) => void;
    onStar: (id: string) => void;
}

function NetItem({net, selected, starred, cnt, on, onSelect, onStar}: NetItemProps) {
    const active = selected === net.name;
    const accent = net.core ? 'blue' : 'cyan';

    return (
        <Box
            px="sm" py={6}
            onClick={() => onSelect(net.name)}
            style={{
                borderRadius: 'var(--mantine-radius-sm)',
                borderLeft  : `2px solid ${active
                    ? `var(--mantine-color-${accent}-5)`
                    : 'transparent'}`,
                background  : active
                    ? `var(--mantine-color-${accent}-light)`
                    : 'transparent',
                cursor      : 'pointer',
                transition  : 'background 0.12s',
            }}
            onMouseEnter={e => {
                if (!active)
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)';
            }}
            onMouseLeave={e => {
                if (!active)
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
        >
            <Group justify="space-between" wrap="nowrap" gap="xs">
                <Stack gap={0} style={{minWidth: 0}}>
                    <Text
                        size="xs" fw={600} truncate
                        c={active ? `${accent}.3` : 'dimmed'}
                    >
                        {net.name}
                    </Text>
                    <Text size="xs" ff="monospace" c="dark.3">{net.description}</Text>
                </Stack>
                <Group gap={4} wrap="nowrap">
                    {cnt > 0 && (
                        <Text size="xs" ff="monospace" c="dark.3">
                            {on}/{cnt}
                        </Text>
                    )}
                    <ActionIcon
                        size="xs" variant="subtle"
                        color={starred ? 'yellow' : 'dark'}
                        onClick={e => {
                            e.stopPropagation();
                            onStar(net.name);
                        }}
                    >
                        {starred ? <IconStarFilled size={12}/> : <IconStar size={12}/>}
                    </ActionIcon>
                </Group>
            </Group>
        </Box>
    );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({color, children}: { color: string; children: React.ReactNode }) {
    return (
        <Text
            size="xs" fw={700} tt="uppercase"
            mb={4} px="xs"
            style={{letterSpacing: '0.1em', color}}
        >
            {children}
        </Text>
    );
}

export function NetworkSidebar({networksResponse, selected, onSelect, isLoading}: Props) {
    const networks = networksResponse.networks;
    const {starred, toggleStar: onStar} = useStarred();
    const [search, setSearch]           = useState('');
    const [tab, setTab]                 = useState('all');


    // Filter networks based on search + tab
    const filtered = useMemo(() => {
        let nets = networks;
        if (tab === 'core') nets = nets.filter(n => n.core);
        if (tab === 'user') nets = nets.filter(n => !n.core);

        if (search) {
            const q = search.toLowerCase();
            nets    = nets.filter(n =>
                n.name.toLowerCase().includes(q)
            );
        }
        return nets;
    }, [networks, tab, search]);

    const starredNets = useMemo(
        () => networks.filter(n => starred?.has(n.name)),
        [networks, starred]
    );

    const coreNets = filtered.filter(n => n.core);
    const userNets = filtered.filter(n => !n.core);

    const renderNet = (net: Network) => (
        <NetItem
            key={net.name}
            net={net}
            selected={selected}
            starred={starred?.has(net.name)}
            cnt={0}
            on={0}
            onSelect={onSelect}
            onStar={onStar}
        />
    );

    return (
        <Box
            w={280}
            style={{
                borderRight  : '1px solid var(--border)',
                display      : 'flex',
                flexDirection: 'column',
                background   : 'var(--surface-1)',
                height       : '100%',
                minHeight    : 0,
                overflow     : 'hidden',
            }}
        >
            {/* Search */}
            <Box p="xs">
                <TextInput
                    placeholder="Search networks…"
                    leftSection={<IconSearch size={14}/>}
                    value={search}
                    onChange={e => setSearch(e.currentTarget.value)}
                    size="xs"
                    mb="xs"
                />
                <SegmentedControl
                    fullWidth size="xs"
                    data={['all', 'core', 'user']}
                    value={tab}
                    onChange={setTab}
                />
            </Box>

            {/* List */}
            <ScrollArea flex={1} px="xs" pb="xs">

                {isLoading ? (
                    <Stack gap={6} pt={4}>
                        {Array.from({length: 8}).map((_, i) => (
                            <Box key={i} px="sm" py={6}>
                                <Group justify="space-between" wrap="nowrap" gap="xs">
                                    <Stack gap={4} style={{flex: 1, minWidth: 0}}>
                                        <Skeleton height={10} width={`${55 + (i % 4) * 10}%`} radius="sm"/>
                                        <Skeleton height={8}  width={`${35 + (i % 3) * 8}%`}  radius="sm"/>
                                    </Stack>
                                    <Skeleton height={14} width={14} radius="sm"/>
                                </Group>
                            </Box>
                        ))}
                    </Stack>
                ) : (
                    <>
                        {/* Favourites */}
                        {!search && tab === 'all' && starredNets.length > 0 && (
                            <Box mb="sm">
                                <SectionLabel color="var(--mantine-color-yellow-5)">
                                    ★ Favourites
                                </SectionLabel>
                                {starredNets.map(renderNet)}
                            </Box>
                        )}

                        {/* Core */}
                        {(tab === 'all' || tab === 'core') && coreNets.length > 0 && (
                            <Box mb="sm">
                                {tab === 'all' && (
                                    <SectionLabel color="var(--mantine-color-blue-4)">
                                        Core
                                    </SectionLabel>
                                )}
                                {coreNets.map(renderNet)}
                            </Box>
                        )}

                        {/* User */}
                        {(tab === 'all' || tab === 'user') && userNets.length > 0 && (
                            <Box>
                                {tab === 'all' && (
                                    <SectionLabel color="var(--mantine-color-cyan-4)">
                                        User
                                    </SectionLabel>
                                )}
                                {userNets.map(renderNet)}
                            </Box>
                        )}

                        {!isLoading && filtered.length === 0 && (
                            <Text size="xs" c="dimmed" ta="center" py="md">
                                No networks match
                            </Text>
                        )}
                    </>
                )}

            </ScrollArea>

            {/* Footer */}
            <Box
                px="md" py="xs"
                style={{borderTop: '1px solid var(--border)'}}
            >
                <Group justify="space-between">
                    <Text size="xs" c="dimmed">{networks.length} networks</Text>
                    <Text size="xs" c="dimmed">{starred.size} starred</Text>
                </Group>
            </Box>
        </Box>
    );
}