// src/pages/Dashboard/index.tsx
import { useMemo }      from 'react';
import {
    Box,
    Center,
    Divider,
    Flex,
    Group,
    Loader,
    Paper,
    Progress,
    RingProgress,
    SimpleGrid,
    Stack,
    Text,
}                       from '@mantine/core';
import { useQuery }     from '@tanstack/react-query';
import { StatCard }     from '@/components/shared/StatCard';
import { fmtAge, machineAgeMs } from '@/utils/common';
import { queryKeys }    from '@/api/queryKeys';
import {
    fetchStatsOverview,
    fetchStatsResources,
    fetchStatsOwner,
    fetchStatsAge,
    fetchStatsNetworks,
}                       from '@/api/stats';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({title, children}: { title: string; children: React.ReactNode }) {
    return (
        <Stack gap="sm">
            <Text
                size="xs" fw={700} tt="uppercase"
                style={{letterSpacing: '0.1em', color: 'var(--mantine-color-dark-3)'}}
            >
                {title}
            </Text>
            {children}
        </Stack>
    );
}

// ─── Bar row ──────────────────────────────────────────────────────────────────

function BarRow({label, value, max, color = 'blue', right}: {
    label: string;
    value: number;
    max: number;
    color?: string;
    right?: React.ReactNode;
}) {
    return (
        <Group gap="sm" wrap="nowrap">
            <Text
                size="xs" c="dimmed"
                style={{width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
            >
                {label}
            </Text>
            <Progress value={max > 0 ? (value / max) * 100 : 0} color={color} size="sm" style={{flex: 1}}/>
            <Box style={{width: 44, textAlign: 'right', flexShrink: 0}}>
                {right ?? <Text size="xs" ff="monospace" c="dimmed">{value}</Text>}
            </Box>
        </Group>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {

    // ── API queries
    const {data: overview,  isLoading: l1} = useQuery({queryKey: queryKeys.statsOverview,  queryFn: fetchStatsOverview});
    const {data: resources, isLoading: l2} = useQuery({queryKey: queryKeys.statsResources, queryFn: fetchStatsResources});
    const {data: ownerData, isLoading: l3} = useQuery({queryKey: queryKeys.statsOwner,     queryFn: fetchStatsOwner});
    const {data: ageData,   isLoading: l4} = useQuery({queryKey: queryKeys.statsAge,       queryFn: fetchStatsAge});
    const {data: netsData,  isLoading: l5} = useQuery({queryKey: queryKeys.statsNetworks,  queryFn: fetchStatsNetworks});

    const isLoading = l1 || l2 || l3 || l4 || l5;

    // ── Memos (must precede any conditional return)
    const topOwners = useMemo(() =>
        [...(ownerData?.by_owner ?? [])].sort((a, b) => b.total - a.total).slice(0, 6),
    [ownerData]);

    const sortedNetworks = useMemo(() =>
        [...(netsData?.networks ?? [])].sort((a, b) => b.allocated - a.allocated),
    [netsData]);

    // ── Loading state
    if (isLoading) {
        return (
            <Center style={{flex: 1, height: '100%'}}>
                <Loader size="md"/>
            </Center>
        );
    }

    // ── Fleet basics
    const total     = overview?.total_guests    ?? 0;
    const online    = overview?.guests_on       ?? 0;
    const offline   = overview?.guests_off      ?? 0;
    const suspended = overview?.guests_suspended ?? 0;
    const totalNets = overview?.total_networks  ?? 0;
    const ipClashes = overview?.ip_clashes      ?? 0;
    const onlinePct = total > 0 ? Math.round(online / total * 100) : 0;

    // ── Ownership
    const distinctOwners = ownerData?.by_owner.length ?? 0;
    const unowned        = ownerData?.unowned ?? 0;

    // ── Resources
    const totalCPU = resources?.total_cpus            ?? 0;
    const totalRAM = resources?.total_ram_gib          ?? 0;
    const avgCPU   = resources?.avg_cpus_per_guest     ?? 0;
    const avgRAM   = resources?.avg_ram_gib_per_guest  ?? 0;
    const ramDist  = Object.entries(resources?.ram_distribution ?? {});
    const cpuDist  = Object.entries(resources?.cpu_distribution ?? {});
    const maxRam   = Math.max(...ramDist.map(([, v]) => v), 1);
    const maxCpu   = Math.max(...cpuDist.map(([, v]) => v), 1);

    // ── Age
    const buckets    = ageData?.buckets ?? {} as Record<string, number>;
    const bucketList = Object.entries(buckets);
    const maxBucket  = Math.max(...bucketList.map(([, v]) => v), 1);
    const newVMs30d  = buckets['<30d']  ?? 0;
    const olderThan1y = buckets['>1y']  ?? 0;

    // ── Networks
    const topNetworks   = sortedNetworks.slice(0, 6);
    const emptyNetworks = sortedNetworks.filter(n => n.allocated === 0).length;
    const avgVMsPerNet  = totalNets > 0 ? +(total / totalNets).toFixed(1) : 0;

    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <Box style={{flex: 1, overflowY: 'auto'}} p="md">

            <Stack mb="lg" gap={2}>
                <Text fw={700} size="md">Dashboard</Text>
                <Text size="xs" c="dimmed">{totalNets} networks · {total} guests</Text>
            </Stack>

            <Stack gap="xl">

                {/* ── Fleet health ─────────────────────────────────────────────── */}
                <Section title="Fleet Health">
                    <Paper p="md" radius="sm" style={{background: 'var(--surface-1)'}}>
                        <Group gap="xl" align="center" wrap="nowrap">

                            {/* Ring chart */}
                            <Box style={{flexShrink: 0}}>
                                <Group gap="lg" wrap="nowrap">
                                    <RingProgress
                                        size={110} thickness={10} roundCaps
                                        sections={[
                                            {value: total > 0 ? online    / total * 100 : 0, color: 'teal'},
                                            {value: total > 0 ? offline   / total * 100 : 0, color: 'red'},
                                            {value: total > 0 ? suspended / total * 100 : 0, color: 'yellow'},
                                        ]}
                                        label={
                                            <Center>
                                                <Stack gap={0} align="center">
                                                    <Text fw={800} size="lg" ff="monospace" lh={1}>{onlinePct}%</Text>
                                                    <Text size="xs" c="dimmed">online</Text>
                                                </Stack>
                                            </Center>
                                        }
                                    />
                                    <Stack gap="xs" justify="center">
                                        {[
                                            {label: 'Online',    value: online,    color: 'var(--mantine-color-teal-5)'},
                                            {label: 'Offline',   value: offline,   color: 'var(--mantine-color-red-5)'},
                                            {label: 'Suspended', value: suspended, color: 'var(--mantine-color-yellow-5)'},
                                        ].map(s => (
                                            <Group key={s.label} gap="xs">
                                                <Box w={8} h={8} style={{borderRadius: '50%', background: s.color, flexShrink: 0}}/>
                                                <Text size="xs" c="dimmed" w={70}>{s.label}</Text>
                                                <Text size="xs" fw={700} ff="monospace">{s.value}</Text>
                                            </Group>
                                        ))}
                                    </Stack>
                                </Group>
                            </Box>

                            <Divider orientation="vertical" style={{borderColor: 'var(--border)', alignSelf: 'stretch'}}/>

                            <Flex gap="xs" wrap="wrap" align="stretch" style={{flex: 1}}>
                                <StatCard label="Total VMs"       value={total}/>
                                <StatCard label="Online"          value={online}     color="var(--mantine-color-teal-5)"/>
                                <StatCard label="Offline"         value={offline}    color="var(--mantine-color-red-5)"/>
                                <StatCard label="Suspended"       value={suspended}  color="var(--mantine-color-yellow-5)"/>
                                <StatCard label="Distinct Owners" value={distinctOwners} color="var(--mantine-color-violet-5)"/>
                                {ipClashes > 0 && (
                                    <StatCard label="IP Clashes" value={ipClashes} color="var(--mantine-color-red-4)"/>
                                )}
                            </Flex>

                        </Group>
                    </Paper>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Resource utilisation ─────────────────────────────────────── */}
                <Section title="Resource Utilisation">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="Total vCPUs"  value={totalCPU}        color="var(--mantine-color-blue-5)"/>
                        <StatCard label="Total RAM"    value={`${totalRAM}G`}  color="var(--mantine-color-indigo-5)"/>
                        <StatCard label="Avg vCPU/VM"  value={avgCPU}          color="var(--mantine-color-blue-3)"/>
                        <StatCard label="Avg RAM/VM"   value={`${avgRAM}G`}    color="var(--mantine-color-indigo-3)"/>
                    </Flex>
                    <SimpleGrid cols={{base: 1, md: 2}} spacing="md">
                        <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>RAM Distribution</Text>
                            <Stack gap="xs">
                                {ramDist.map(([tier, count]) => (
                                    <BarRow key={tier} label={tier} value={count} max={maxRam} color="indigo"
                                            right={<Text size="xs" ff="monospace" c="dimmed">{count}</Text>}/>
                                ))}
                            </Stack>
                        </Paper>
                        <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>CPU Distribution</Text>
                            <Stack gap="xs">
                                {cpuDist.map(([tier, count]) => (
                                    <BarRow key={tier} label={`${tier} vCPUs`} value={count} max={maxCpu} color="blue"
                                            right={<Text size="xs" ff="monospace" c="dimmed">{count}</Text>}/>
                                ))}
                            </Stack>
                        </Paper>
                    </SimpleGrid>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Age & hygiene ─────────────────────────────────────────────── */}
                <Section title="Age & Hygiene">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="New (30d)"  value={newVMs30d}   color="var(--mantine-color-teal-5)"/>
                        <StatCard label="> 1 Year"   value={olderThan1y} color="var(--mantine-color-yellow-5)"/>
                        <StatCard
                            label="Oldest VM"
                            value={fmtAge(machineAgeMs(ageData?.oldest_created ?? new Date().toISOString()))}
                            sub={ageData?.oldest_guest}
                            color="var(--mantine-color-red-4)"
                        />
                        <StatCard
                            label="Newest VM"
                            value={fmtAge(machineAgeMs(ageData?.newest_created ?? new Date().toISOString()))}
                            sub={ageData?.newest_guest}
                            color="var(--mantine-color-teal-3)"
                        />
                    </Flex>
                    <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                              style={{letterSpacing: '0.1em'}}>Age Breakdown</Text>
                        <Stack gap="xs">
                            {bucketList.map(([bucket, count]) => (
                                <BarRow key={bucket} label={bucket} value={count} max={maxBucket} color="orange"
                                        right={<Text size="xs" ff="monospace" c="dimmed">{count}</Text>}/>
                            ))}
                        </Stack>
                    </Paper>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Ownership ─────────────────────────────────────────────────── */}
                <Section title="Ownership">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="Distinct Owners" value={distinctOwners} color="var(--mantine-color-violet-5)"/>
                        <StatCard label="Unowned"         value={unowned}
                                  color={unowned > 0 ? 'var(--mantine-color-orange-5)' : undefined}/>
                    </Flex>
                    <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                              style={{letterSpacing: '0.1em'}}>Top Owners</Text>
                        <Stack gap="xs">
                            {topOwners.map(o => (
                                <BarRow key={o.owner} label={o.owner} value={o.total}
                                        max={topOwners[0]?.total ?? 1} color="violet"/>
                            ))}
                        </Stack>
                    </Paper>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Networks ─────────────────────────────────────────────────── */}
                <Section title="Networks">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="Total"    value={totalNets}/>
                        <StatCard label="Core"     value={overview?.core_networks ?? 0} color="var(--mantine-color-blue-5)"/>
                        <StatCard label="User"     value={overview?.user_networks ?? 0} color="var(--mantine-color-cyan-5)"/>
                        <StatCard label="Avg VMs"  value={avgVMsPerNet}               color="var(--mantine-color-blue-3)"/>
                        <StatCard label="Empty"    value={emptyNetworks}
                                  color={emptyNetworks > 0 ? 'var(--mantine-color-orange-5)' : undefined}/>
                    </Flex>
                    <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                              style={{letterSpacing: '0.1em'}}>Top Networks by VM Count</Text>
                        <Stack gap="xs">
                            {topNetworks.map(n => (
                                <BarRow
                                    key={n.network_id}
                                    label={n.network_name}
                                    value={n.allocated}
                                    max={topNetworks[0]?.allocated ?? 1}
                                    color={n.type === 'core' ? 'blue' : 'cyan'}
                                    right={
                                        <Group gap={4} justify="flex-end" wrap="nowrap">
                                            <Text size="xs" ff="monospace" c="dimmed">{n.allocated}</Text>
                                        </Group>
                                    }
                                />
                            ))}
                        </Stack>
                    </Paper>
                </Section>

            </Stack>
        </Box>
    );
}