// Centralised query key factory — keeps cache invalidation consistent.
// When you add mutations, pass these to queryClient.invalidateQueries().

export const queryKeys = {
    networks: ['networks'] as const,
    network: (id: string) => ['networks', id] as const,
    machines: ['machines'] as const,
    machinesByNetwork: (id: string) => ['machines', 'network', id] as const,
    machinesOlderThan: (ms: number) => ['machines', 'older-than', ms] as const,
};