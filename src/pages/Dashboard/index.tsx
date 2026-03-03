// src/pages/Dashboard/index.tsx
import {useMemo}  from 'react';
import {
    Badge,
    Box,
    Center,
    Divider,
    Flex,
    Group,
    Paper,
    Progress,
    RingProgress,
    SimpleGrid,
    Stack,
    Text,
}                 from '@mantine/core';
import {
    MACHINES,
    NETWORKS
}                 from '@/data/mock';
import {StatCard} from '@/components/shared/StatCard';
import {
    fmtAge,
    isWithinDays,
    machineAgeMs
} from "@/utils/common";

// ─── Utils ────────────────────────────────────────────────────────────────────



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

    // ── Fleet basics
    const total     = MACHINES.length;
    const online    = MACHINES.filter(m => m.power === 'on').length;
    const offline   = MACHINES.filter(m => m.power === 'off').length;
    const suspended = MACHINES.filter(m => m.power === 'suspended').length;
    const onlinePct = total > 0 ? Math.round(online / total * 100) : 0;

    // ── Resource utilisation
    const totalCPU = MACHINES.reduce((a, m) => a + m.cpus, 0);
    const totalRAM = MACHINES.reduce((a, m) => a + m.ram, 0);
    const avgRAM   = total > 0 ? Math.round(totalRAM / total) : 0;
    const avgCPU   = total > 0 ? +(totalCPU / total).toFixed(1) : 0;

    const topByRAM = useMemo(() =>
        [...MACHINES].sort((a, b) => b.ram - a.ram).slice(0, 6), []);
    const topByCPU = useMemo(() =>
        [...MACHINES].sort((a, b) => b.cpus - a.cpus).slice(0, 6), []);

    // ── Age & hygiene
    const ONE_YEAR  = 365 * 86400000;
    const TWO_YEARS = 730 * 86400000;

    const olderThan1y = MACHINES.filter(m => machineAgeMs(m.created) >= ONE_YEAR).length;
    const olderThan2y = MACHINES.filter(m => machineAgeMs(m.created) >= TWO_YEARS).length;
    const avgAgeMs    = total > 0
        ? MACHINES.reduce((a, m) => a + machineAgeMs(m.created), 0) / total
        : 0;
    const newVMs30d   = MACHINES.filter(m => isWithinDays(m.created, 30)).length;
    const newVMs7d    = MACHINES.filter(m => isWithinDays(m.created, 7)).length;
    const oldestVM    = useMemo(() =>
        [...MACHINES].sort((a, b) =>
            new Date(a.created).getTime() - new Date(b.created).getTime()
        )[0], []);

    // ── Ownership
    const ownerMap       = useMemo(() => {
        const map: Record<string, number> = {};
        MACHINES.forEach(m => { map[m.owner] = (map[m.owner] ?? 0) + 1; });
        return map;
    }, []);
    const topOwners      = useMemo(() =>
        Object.entries(ownerMap).sort((a, b) => b[1] - a[1]).slice(0, 6), [ownerMap]);
    const distinctOwners = Object.keys(ownerMap).length;

    // ── Subgroups
    const subgroupMap  = useMemo(() => {
        const map: Record<string, number> = {};
        MACHINES.forEach(m => { map[m.subgroup] = (map[m.subgroup] ?? 0) + 1; });
        return map;
    }, []);
    const topSubgroups = useMemo(() =>
        Object.entries(subgroupMap).sort((a, b) => b[1] - a[1]).slice(0, 6), [subgroupMap]);

    // ── Networks
    const networkStats = useMemo(() =>
            NETWORKS.map(n => ({
                ...n,
                count: MACHINES.filter(m => m.network === n.id).length,
                isNew: isWithinDays(
                    MACHINES.filter(m => m.network === n.id)[0]?.created ?? '2020-01-01', 30
                ),
            })).sort((a, b) => b.count - a.count)
        , []);

    const topNetworks   = networkStats.slice(0, 6);
    const emptyNetworks = networkStats.filter(n => n.count === 0).length;
    const newNetworks   = networkStats.filter(n => n.isNew).length;
    const avgVMsPerNet  = total > 0 ? +(total / NETWORKS.length).toFixed(1) : 0;

    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <Box style={{flex: 1, overflowY: 'auto'}} p="md">

            <Stack mb="lg" gap={2}>
                <Text fw={700} size="md">Dashboard</Text>
                <Text size="xs" c="dimmed">{NETWORKS.length} networks · {total} guests</Text>
            </Stack>

            <Stack gap="xl">

                {/* ── Fleet health ─────────────────────────────────────────────── */}
                <Section title="Fleet Health">
                    <Paper p="md" radius="sm"
                           style={{background: 'var(--surface-1)'}}>
                        <Group gap="xl" align="center" wrap="nowrap">

                            {/* Ring chart */}
                            <Box style={{flexShrink: 0}}>
                                <Group gap="lg" wrap="nowrap">
                                    <RingProgress
                                        size={110} thickness={10} roundCaps
                                        sections={[
                                            {value: online / total * 100, color: 'teal'},
                                            {value: offline / total * 100, color: 'red'},
                                            {value: suspended / total * 100, color: 'yellow'},
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
                                            {label: 'Online', value: online, color: 'var(--mantine-color-teal-5)'},
                                            {label: 'Offline', value: offline, color: 'var(--mantine-color-red-5)'},
                                            {label   : 'Suspended',
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

                            {/* Divider */}
                            <Divider orientation="vertical"
                                     style={{borderColor: 'var(--border)', alignSelf: 'stretch'}}/>

                            {/* Stat cards — constrained, left-aligned, don't stretch */}
                            <Flex gap="xs" wrap="wrap" align="stretch" style={{flex: 1}}>
                                <StatCard label="Total VMs" value={total}/>
                                <StatCard label="Online" value={online} color="var(--mantine-color-teal-5)"/>
                                <StatCard label="Offline" value={offline} color="var(--mantine-color-red-5)"/>
                                <StatCard label="Suspended" value={suspended} color="var(--mantine-color-yellow-5)"/>
                                <StatCard label="Distinct Owners" value={distinctOwners}
                                          color="var(--mantine-color-violet-5)"/>

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
                        <Paper  p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>Top VMs by RAM</Text>
                            <Stack gap="xs">
                                {topByRAM.map(m => (
                                    <BarRow key={m.ip} label={m.name} value={m.ram}
                                            max={topByRAM[0].ram} color="indigo"
                                            right={<Text size="xs" ff="monospace" c="dimmed">{m.ram}G</Text>}/>
                                ))}
                            </Stack>
                        </Paper>
                        <Paper  p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>Top VMs by CPU</Text>
                            <Stack gap="xs">
                                {topByCPU.map(m => (
                                    <BarRow key={m.ip} label={m.name} value={m.cpus}
                                            max={topByCPU[0].cpus} color="blue"
                                            right={<Text size="xs" ff="monospace" c="dimmed">{m.cpus}×</Text>}/>
                                ))}
                            </Stack>
                        </Paper>
                    </SimpleGrid>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Age & hygiene ─────────────────────────────────────────────── */}
                <Section title="Age & Hygiene">
                    <Flex gap="xs" wrap="wrap" align="stretch">
                        <StatCard label="Avg Age" value={fmtAge(avgAgeMs)}/>
                        <StatCard label="> 1 Year" value={olderThan1y}
                                  color="var(--mantine-color-yellow-5)"/>
                        <StatCard label="> 2 Years" value={olderThan2y}
                                  color="var(--mantine-color-orange-5)"/>
                        <StatCard label="New (30d)" value={newVMs30d}
                                  color="var(--mantine-color-teal-5)"/>
                        <StatCard label="New (7d)" value={newVMs7d}
                                  color="var(--mantine-color-teal-3)"/>
                        <StatCard
                            label="Oldest VM"
                            value={fmtAge(machineAgeMs(oldestVM?.created ?? new Date().toISOString()))}
                            sub={oldestVM?.name}
                            color="var(--mantine-color-red-4)"
                        />
                    </Flex>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Ownership & subgroups ─────────────────────────────────────── */}
                <Section title="Ownership & Subgroups">
                    <SimpleGrid cols={{base: 1, md: 2}} spacing="md">
                        <Paper  p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>Top Owners</Text>
                            <Stack gap="xs">
                                {topOwners.map(([owner, count]) => (
                                    <BarRow key={owner} label={owner} value={count}
                                            max={topOwners[0][1]} color="violet"/>
                                ))}
                            </Stack>
                        </Paper>
                        <Paper withBorder p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                                  style={{letterSpacing: '0.1em'}}>VMs by Subgroup</Text>
                            <Stack gap="xs">
                                {topSubgroups.map(([sub, count]) => (
                                    <BarRow key={sub} label={sub} value={count}
                                            max={topSubgroups[0][1]} color="cyan"/>
                                ))}
                            </Stack>
                        </Paper>
                    </SimpleGrid>
                </Section>

                <Divider style={{borderColor: 'var(--border)'}}/>

                {/* ── Networks ─────────────────────────────────────────────────── */}
                <Section title="Networks">
                    <Flex gap="xs" wrap="wrap" align="stretch" mb="sm">
                        <StatCard label="Total" value={NETWORKS.length}/>
                        <StatCard label="Avg VMs" value={avgVMsPerNet}
                                  color="var(--mantine-color-blue-5)"/>
                        <StatCard label="Empty" value={emptyNetworks}
                                  color={emptyNetworks > 0 ? 'var(--mantine-color-orange-5)' : undefined}/>
                        <StatCard label="New (30d)" value={newNetworks}
                                  color="var(--mantine-color-teal-5)"/>
                    </Flex>
                    <Paper withBorder p="md" radius="sm" style={{background: 'var(--surface-2)'}}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm"
                              style={{letterSpacing: '0.1em'}}>Top Networks by VM Count</Text>
                        <Stack gap="xs">
                            {topNetworks.map(n => (
                                <BarRow
                                    key={n.id}
                                    label={n.name}
                                    value={n.count}
                                    max={topNetworks[0].count}
                                    color={n.type === 'core' ? 'blue' : 'cyan'}
                                    right={
                                        <Group gap={4} justify="flex-end" wrap="nowrap">
                                            <Text size="xs" ff="monospace" c="dimmed">{n.count}</Text>
                                            {n.isNew && (
                                                <Badge size="xs" color="teal" variant="light">new</Badge>
                                            )}
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