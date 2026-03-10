import {useEffect}       from 'react';
import {useQuery}        from '@tanstack/react-query';
import {
    useNavigate,
    useParams
}                        from '@tanstack/react-router';
import {
    Alert,
    Center,
    Group,
    Loader,
}                        from '@mantine/core';
import {IconAlertCircle} from '@tabler/icons-react';
import {fetchNetworks}   from '@/api/networks';
import {queryKeys}       from '@/api/queryKeys';
import {NetworkSidebar}  from './NetworkSidebar';
import {NetworkView}     from "@/pages/Networks/NetworkView";

export default function NetworksPage() {

    // Read selected network from URL
    const params    = useParams({strict: false});
    const networkId = params?.networkId ?? '';
    const navigate  = useNavigate();

    // When the sidebar selects a network, push to the new URL
    const handleSelect = (id: string) => {
        navigate({to: '/networks/{-$networkId}', params: {networkId: id}});
    };


    const {
              data     : networks,
              isLoading: networksLoading,
              isError  : networksError,
          } = useQuery({
        queryKey: queryKeys.networks,
        queryFn : fetchNetworks,
    });


    // ── Auto-select first core network ────────────────────────────────────────

    useEffect(() => {
        if (!networkId && networks?.networks && networks?.networks.length > 0) {
            const firstCore = networks.networks.filter((net) => net.core)[0]
            console.log(firstCore)
            if (firstCore) {
                navigate({to: '/networks/{-$networkId}', params: {networkId: firstCore.name}, replace: true});
            }
        }
    }, [networkId, networks, navigate]);


    if (networksLoading) {
        return (
            <Center style={{flex: 1}}>
                <Loader size="sm"/>
            </Center>
        );
    }

    if (networksError) {
        return (
            <Center style={{flex: 1, padding: 24}}>
                <Alert icon={<IconAlertCircle size={16}/>} color="red" title="Failed to load networks">
                    Could not fetch network list. Check your connection and try again.
                </Alert>
            </Center>
        );
    }

    return (
        <Group gap={0} style={{flex: 1, height: '100%', minHeight: 0, overflow: 'hidden'}} align="stretch">

            <NetworkSidebar
                networksResponse={networks ?? {networks: []}}
                selected={networkId}
                onSelect={handleSelect}
                isLoading={networksLoading}
            />
            <NetworkView networkId={networkId}/>

        </Group>
    );
}