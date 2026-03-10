import {useQuery}               from "@tanstack/react-query";
import {queryKeys}              from "@/api/queryKeys";
import {fetchMachinesByNetwork} from "@/api/machines";
import {useMemo}                from "react";
import {
    buildIpRows,
    networkStats
}                               from "@/pages/Networks/utils";
import {
    ActionIcon,
    Alert,
    Box,
    Center,
    Group,
    Loader,
    Stack,
    Text
}                               from "@mantine/core";
import {
    IconAlertCircle,
    IconStar,
    IconStarFilled
}                               from "@tabler/icons-react";
import {StatCard}               from "@/components/shared/StatCard";
import {NetworkTable}           from "@/pages/Networks/NetworkTable";
import {useStarred}             from "@/context/starred";

export interface NetworkViewProps {
    networkId: string
    isCore?: boolean;
}

export function NetworkView({networkId, isCore}: NetworkViewProps) {
    const {starred, toggleStar} = useStarred();
    const {
              data     : net,
              isLoading: machinesLoading,
              isError  : machinesError,
          }                     = useQuery({
        queryKey: queryKeys.machinesByNetwork(networkId),
        queryFn : () => fetchMachinesByNetwork(networkId),
        enabled : !!networkId,
    });

    const network  = net?.network;
    const guests   = net?.guests  ?? [];
    const clashes  = net?.clashes ?? [];

    const rows       = useMemo(() => buildIpRows(network, guests, clashes, net?.network.core), [network, guests, clashes, net?.network.core]);
    const stats      = useMemo(() => networkStats(guests, clashes), [guests, clashes]);
    const clashCount = clashes.length;

    return (
        <>
            <Stack gap={0} style={{flex: 1, minWidth: 0, minHeight: 0, height: '100%', overflow: 'hidden'}}>

                {/* Header */}
                <Box p="md" style={{borderBottom: '1px solid var(--border)', flexShrink: 0}}>
                    <Group justify="space-between" wrap="wrap" gap="sm">
                        <Group gap="sm">
                            <ActionIcon
                                variant="subtle" size="sm"
                                color={starred.has(networkId) ? 'yellow' : 'gray'}
                                onClick={() => toggleStar(networkId)}
                            >
                                {starred.has(networkId)
                                    ? <IconStarFilled size={16}/>
                                    : <IconStar size={16}/>}
                            </ActionIcon>
                            <Stack gap={2}>
                                <Group gap="xs">
                                    <Text fw={700} size="md">{network?.name ?? '-'}</Text>
                                </Group>
                                <Text size="xs" c="dimmed" ff="monospace">
                                    {network?.core && (
                                        <Text component="span" c="dark.3" ml="xs">
                                            {network?.description ? `(${network.description})` : ''}
                                        </Text>
                                    )}
                                </Text>
                            </Stack>
                        </Group>

                        {machinesLoading
                            ? <Loader size="xs"/>
                            : (
                                <Group gap="xs">
                                    <StatCard label="Total" value={stats.total} minWidth={150}/>
                                    <StatCard label="Allocated" value={stats.allocated}
                                              color="var(--mantine-color-blue-5)" minWidth={150}/>
                                    <StatCard label="Online" value={stats.on} color="var(--mantine-color-teal-5)"
                                              minWidth={150}/>
                                    <StatCard label="Offline" value={stats.off} color="var(--mantine-color-red-5)"
                                              minWidth={150}/>
                                    {clashCount > 0 && (
                                        <StatCard
                                            label="Clashes"
                                            value={clashCount}
                                            color="var(--mantine-color-orange-5)"
                                            // icon={<IconAlertTriangle size={14}/>}
                                            minWidth={150}
                                        />
                                    )}
                                </Group>
                            )}
                    </Group>
                </Box>

                {/* Table */}
                {machinesError
                    ? (
                        <Center style={{flex: 1, padding: 24}}>
                            <Alert icon={<IconAlertCircle size={16}/>} color="red" title="Failed to load machines">
                                Could not fetch machines for this network.
                            </Alert>
                        </Center>
                    )
                    : (
                        <NetworkTable
                            rows={rows}
                            clashes={clashes}
                            isCore={isCore ?? false}
                            isLoading={machinesLoading}
                        />
                    )}
            </Stack>
        </>
    );
}