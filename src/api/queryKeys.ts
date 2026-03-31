// Centralised query key factory — keeps cache invalidation consistent.
// When you add mutations, pass these to queryClient.invalidateQueries().

export const queryKeys = {
    networks            : ['networks'] as const,
    network             : (id: string) => ['networks', id] as const,
    machines            : ['guests', 'all'] as const,
    machinesByNetwork   : (id: string) => ['networks', id, 'guests'] as const,
    machinesOlderThan   : (ms: number) => ['guests', 'older-than', ms] as const,
    guestsAll           : ['guests', 'all'] as const,
    guestsOn            : ['guests', 'on'] as const,
    guestsTree          : ['guests', 'tree'] as const,
    guestsByGroup       : (group: string) => ['guests', 'group', group] as const,
    guestsBySubGroup    : (group: string, subGroup: string) => ['guests', 'group', group, 'sub_group', subGroup] as const,
    statsOverview       : ['stats', 'overview'] as const,
    statsResources      : ['stats', 'resources'] as const,
    statsOwner          : ['stats', 'owner'] as const,
    statsAge            : ['stats', 'age'] as const,
    statsNetworks       : ['stats', 'networks'] as const,
};