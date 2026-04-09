// src/pages/Dashboard/index.tsx
import {useMemo} from 'react';
import {
    Box,
    Center,
    Divider,
    Flex,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
} from '@mantine/core';
import {
    BarChart,
    DonutChart,
} from '@mantine/charts';
import {useQuery} from '@tanstack/react-query';
import {StatCard} from '@/components/shared/StatCard';
import {fmtAge, machineAgeMs} from '@/utils/common';
import {queryKeys} from '@/api/queryKeys';
import {
    fetchStatsOverview,
    fetchStatsResources,
    fetchStatsOwner,
    fetchStatsAge,
    fetchStatsNetworks,
} from '@/api/stats';
import {useNavigate} from "@tanstack/react-router";

const AGE_BUCKET_ORDER = ['<1y', "1y+", "2y+", "3y+", "4y+", "5y+", 'unknown'] as const;

function sortTierEntries([left]: [string, number], [right]: [string, number]) {
    const leftNumeric = Number.parseFloat(left.replace(/[^\d.]+/g, ''));
    const rightNumeric = Number.parseFloat(right.replace(/[^\d.]+/g, ''));

    if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric) && leftNumeric !== rightNumeric) {
        return leftNumeric - rightNumeric;
    }

    return left.localeCompare(right, undefined, {numeric: true, sensitivity: 'base'});
}

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {

    const navigate = useNavigate();
    // ── API queries
    const {data: overview, isLoading: l1} = useQuery({queryKey: queryKeys.statsOverview, queryFn: fetchStatsOverview});
    const {data: resources, isLoading: l2} = useQuery({
        queryKey: queryKeys.statsResources,
        queryFn: fetchStatsResources
    });
    const {data: ownerData, isLoading: l3} = useQuery({queryKey: queryKeys.statsOwner, queryFn: fetchStatsOwner});
    const {data: ageData, isLoading: l4} = useQuery({queryKey: queryKeys.statsAge, queryFn: fetchStatsAge});
    const {data: netsData, isLoading: l5} = useQuery({queryKey: queryKeys.statsNetworks, queryFn: fetchStatsNetworks});

    const isLoading = l1 || l2 || l3 || l4 || l5;

    // ── Fleet basics
    const total = overview?.total_guests ?? 0;
    const online = overview?.guests_on ?? 0;
    const offline = overview?.guests_off ?? 0;
    const suspended = overview?.guests_suspended ?? 0;
    const totalNets = overview?.total_networks ?? 0;
    const ipClashes = overview?.ip_clashes ?? 0;
    const onlinePct = total > 0 ? Math.round(online / total * 100) : 0;

    // ── Ownership
    const distinctOwners = ownerData?.by_owner.length ?? 0;
    const unowned = ownerData?.unowned ?? 0;

    // ── Resources
    const totalCPU = resources?.total_cpus ?? 0;
    const totalRAM = resources?.total_ram_gib ?? 0;
    const avgCPU = resources?.avg_cpus_per_guest ?? 0;
    const avgRAM = resources?.avg_ram_gib_per_guest ?? 0;

    // ── Age
    const buckets = ageData?.buckets ?? {} as Record<string, number>;
    const olderThan2y = (['2y+', '3y+', '4y+', '5y+'] as const).reduce((sum, bucket) => sum + (buckets[bucket] ?? 0), 0);

    // ── Memos (must precede any conditional return)
    const topOwners = useMemo(() =>
            [...(ownerData?.by_owner ?? [])].sort((a, b) => b.total - a.total).slice(0, 6),
        [ownerData]);

    const sortedNetworks = useMemo(() =>
            [...(netsData?.networks ?? [])].sort((a, b) => b.allocated - a.allocated),
        [netsData]);

    const fleetHealthChartData = useMemo(() => {
        if (total === 0) {
            return [{name: 'No guests', value: 1, color: 'gray.7'}];
        }

        return [
            {name: 'Online', value: online, color: 'teal.6'},
            {name: 'Offline', value: offline, color: 'red.6'},
            {name: 'Suspended', value: suspended, color: 'yellow.6'},
        ].filter((entry) => entry.value > 0);
    }, [offline, online, suspended, total]);

    const ramChartData = useMemo(() =>
            Object.entries(resources?.ram_distribution ?? {})
                .sort(sortTierEntries)
                .map(([tier, count]) => ({tier, count}))
                .filter((entry) => entry.count > 0),
        [resources]);

    const cpuChartData = useMemo(() =>
            Object.entries(resources?.cpu_distribution ?? {})
                .sort(sortTierEntries)
                .map(([tier, count]) => ({tier: `${tier} vCPUs`, count}))
                .filter((entry) => entry.count > 0),
        [resources]);

    const ageChartData = useMemo(() =>
            AGE_BUCKET_ORDER
                .map((bucket) => ({bucket, count: buckets[bucket] ?? 0}))
        // .filter((entry) => entry.count > 0),
        ,
        [buckets]);
    console.table(ageChartData);

    const ownerChartData = useMemo(() =>
            topOwners.map((owner) => ({
                owner: owner.owner,
                on: owner.on,
                off: owner.off,
                suspended: owner.suspended,
            })),
        [topOwners]);

    const networkChartData = useMemo(() =>
            sortedNetworks.slice(0, 6).map((network) => ({
                network: network.network_name,
                on: network.on,
                off: network.off,
                suspended: network.suspended,
            })),
        [sortedNetworks]);

    // ── Loading state
    if (isLoading) {
        return (
            <Center style={{flex: 1, height: '100%'}}>
                <Loader size="md"/>
            </Center>
        );
    }

    // ── Networks
    const emptyNetworks = sortedNetworks.filter(n => n.allocated === 0).length;
    const avgVMsPerNet = totalNets > 0 ? +(total / totalNets).toFixed(1) : 0;

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

                            <Box style={{flexShrink: 0, minWidth: 280}}>
                                <Group gap="lg" wrap="nowrap">
                                    <DonutChart
                                        size={160}
                                        thickness={22}
                                        chartLabel={`${onlinePct}%`}
                                        data={fleetHealthChartData}
                                        tooltipDataSource="segment"
                                        valueFormatter={(value) => `${value} guest${value === 1 ? '' : 's'}`}
                                    />
                                    <Stack gap="xs" justify="center">
                                        {[
                                            {label: 'Online', value: online, color: 'var(--mantine-color-teal-5)'},
                                            {label: 'Offline', value: offline, color: 'var(--mantine-color-red-5)'},
                                            {
                                                label: 'Suspended',
                                                value: suspended,
                                                color: 'var(--mantine-color-yellow-5)'
                                            },
                                        ].map(s => (
                                            <Group key={s.label} gap="xs">
                                                <Box w={8} h={8}
                                                     style={{borderRadius: '50%', background: s.color, flexShrink: 0}}/>
                                                <Text size="xs" c="dimmed" w={70}>{s.label}</Text>
                                                <Text size="xs" fw={700} ff="monospace">{s.value}</Text>
                                            </Group>
                                        ))}
                                    </Stack>
                                </Group>
                            </Box>

                            <Divider orientation="vertical"
                                     style={{borderColor: 'var(--border)', alignSelf: 'stretch'}}/>

                            <Flex gap="xs" wrap="wrap" align="stretch" style={{flex: 1}}>
                                <StatCard label="Total VMs" value={total}/>
                                <StatCard label="Online" value={online} color="var(--mantine-color-teal-5)"/>
                                <StatCard label="Offline" value={offline} color="var(--mantine-color-red-5)"/>
                                <StatCard label="Suspended" value={suspended} color="var(--mantine-color-yellow-5)"/>
                                <StatCard label="Distinct Owners" value={distinctOwners}
                                          color="var(--mantine-color-violet-5)"/>
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
                        <StatCard label="Total vCPUs" value={totalCPU} color="var(--mantine-color-blue-5)"/>
                        <StatCard label="Total RAM" value={`${totalRAM}G`} color="var(--mantine-color-indigo-5)"/>
                        <StatCard label="Avg vCPU/VM" value={avgCPU} color="var(--mantine-color-blue-3)"/>
                        <StatCard label="Avg RAM/VM" value={`${avgRAM}G`} color="var(--mantine-color-indigo-3)"/>
                    </Flex>
                    <SimpleGrid cols={{base: 1, md: 2}} spacing="md">
                        <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>RAM Distribution</Text>
                            {ramChartData.length > 0 ? (
                                <BarChart
                                    h={240}
                                    data={ramChartData}
                                    dataKey="tier"
                                    series={[{name: 'count', label: 'VMs', color: 'indigo.6'}]}
                                    orientation="vertical"
                                    withBarValueLabel
                                    gridAxis="none"
                                    xAxisProps={{allowDecimals: false}}
                                    yAxisProps={{width: 96}}
                                    valueFormatter={(value) => `${value}`}
                                />
                            ) : (
                                <Text size="sm" c="dimmed">No RAM distribution data available.</Text>
                            )}
                        </Paper>
                        <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>CPU Distribution</Text>
                            {cpuChartData.length > 0 ? (
                                <BarChart
                                    h={240}
                                    data={cpuChartData}
                                    dataKey="tier"
                                    series={[{name: 'count', label: 'VMs', color: 'blue.6'}]}
                                    orientation="vertical"
                                    withBarValueLabel
                                    tickLine="none"
                                    gridAxis="none"
                                    xAxisProps={{allowDecimals: false}}
                                    yAxisProps={{width: 96}}
                                    valueFormatter={(value) => `${value}`}
                                />
                            ) : (
                                <Text size="sm" c="dimmed">No CPU distribution data available.</Text>
                            )}
                        </Paper>
                    </SimpleGrid>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                <Section title="Age & Hygiene">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="> 2 Year" value={olderThan2y} color="var(--mantine-color-yellow-5)"/>
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
                        {ageChartData.length > 0 ? (
                            <BarChart
                                h={260}
                                data={ageChartData}
                                dataKey="bucket"
                                series={[{name: 'count', label: 'VMs', color: 'orange.6'}]}
                                orientation="vertical"
                                withBarValueLabel
                                tickLine="none"
                                gridAxis="none"
                                xAxisProps={{allowDecimals: false}}
                                yAxisProps={{width: 96}}
                                valueFormatter={(value) => `${value}`}
                                onClick={() => {
                                    navigate({to: "/review"})
                                }}
                            />
                        ) : (
                            <Text size="sm" c="dimmed">No age breakdown data available.</Text>
                        )}
                    </Paper>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Ownership ─────────────────────────────────────────────────── */}
                <Section title="Ownership">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="Distinct Owners" value={distinctOwners} color="var(--mantine-color-violet-5)"/>
                        <StatCard label="Unowned" value={unowned}
                                  color={unowned > 0 ? 'var(--mantine-color-orange-5)' : undefined}/>
                    </Flex>
                    <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                              style={{letterSpacing: '0.1em'}}>Top Owners</Text>
                        {ownerChartData.length > 0 ? (
                            <BarChart
                                h={300}
                                data={ownerChartData}
                                dataKey="owner"
                                type="stacked"
                                orientation="vertical"
                                withLegend
                                tickLine="none"
                                gridAxis="x"
                                xAxisProps={{allowDecimals: false}}
                                yAxisProps={{width: 120}}
                                valueFormatter={(value) => `${value} guest${value === 1 ? '' : 's'}`}
                                series={[
                                    {name: 'on', label: 'Online', color: 'teal.6'},
                                    {name: 'off', label: 'Offline', color: 'red.6'},
                                    {name: 'suspended', label: 'Suspended', color: 'yellow.6'},
                                ]}
                            />
                        ) : (
                            <Text size="sm" c="dimmed">No ownership data available.</Text>
                        )}
                    </Paper>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Networks ─────────────────────────────────────────────────── */}
                <Section title="Networks">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="Total" value={totalNets}/>
                        <StatCard label="Core" value={overview?.core_networks ?? 0}
                                  color="var(--mantine-color-blue-5)"/>
                        <StatCard label="User" value={overview?.user_networks ?? 0}
                                  color="var(--mantine-color-cyan-5)"/>
                        <StatCard label="Avg VMs" value={avgVMsPerNet} color="var(--mantine-color-blue-3)"/>
                        <StatCard label="Empty" value={emptyNetworks}
                                  color={emptyNetworks > 0 ? 'var(--mantine-color-orange-5)' : undefined}/>
                    </Flex>
                    <Paper p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                              style={{letterSpacing: '0.1em'}}>Top Networks by VM Count</Text>
                        {networkChartData.length > 0 ? (
                            <BarChart
                                h={320}
                                data={networkChartData}
                                dataKey="network"
                                type="stacked"
                                orientation="vertical"
                                withLegend
                                tickLine="none"
                                gridAxis="x"
                                xAxisProps={{allowDecimals: false}}
                                yAxisProps={{width: 120}}
                                valueFormatter={(value) => `${value} guest${value === 1 ? '' : 's'}`}
                                series={[
                                    {name: 'on', label: 'Online', color: 'teal.6'},
                                    {name: 'off', label: 'Offline', color: 'red.6'},
                                    {name: 'suspended', label: 'Suspended', color: 'yellow.6'},
                                ]}
                            />
                        ) : (
                            <Text size="sm" c="dimmed">No network allocation data available.</Text>
                        )}
                    </Paper>
                </Section>

            </Stack>
        </Box>
    );
}