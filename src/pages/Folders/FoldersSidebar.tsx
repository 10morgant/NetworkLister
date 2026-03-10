// src/pages/Folders/FoldersSidebar.tsx
import {useState}      from 'react';
import {useQuery}      from '@tanstack/react-query';
import {
    Box,
    Collapse,
    Group,
    ScrollArea,
    Skeleton,
    Stack,
    Text,
    UnstyledButton,
}                      from '@mantine/core';
import {
    IconChevronRight,
    IconList,
}                      from '@tabler/icons-react';
import {fetchGuestsTree} from '@/api/machines';
import {queryKeys}     from '@/api/queryKeys';
import type {GuestTreeGroup} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

/** null group = "All Guests" view */
export interface FolderSelection {
    group: string | null;
    subGroup: string | null;
}

interface Props {
    selected: FolderSelection;
    onSelect: (sel: FolderSelection) => void;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SidebarSkeleton() {
    return (
        <Stack gap={4} p="xs">
            {Array.from({length: 9}).map((_, i) => (
                <Box key={i} px="sm" py={6}>
                    <Group gap="xs" wrap="nowrap">
                        <Skeleton height={10} width={10} radius="sm" style={{flexShrink: 0}}/>
                        <Skeleton height={10} width={`${45 + (i % 5) * 10}%`} radius="sm"/>
                        <Skeleton height={10} width={18} radius="sm" style={{marginLeft: 'auto'}}/>
                    </Group>
                </Box>
            ))}
        </Stack>
    );
}

// ── GroupItem ─────────────────────────────────────────────────────────────────

interface GroupItemProps {
    group: GuestTreeGroup;
    selected: FolderSelection;
    isOpen: boolean;
    onGroupClick: (name: string) => void;
    onSubGroupClick: (group: string, subGroup: string) => void;
}

function GroupItem({group, selected, isOpen, onGroupClick, onSubGroupClick}: GroupItemProps) {
    const isSelGrp = selected.group === group.name && selected.subGroup === null;
    const totalGuests = group.sub_groups.reduce((n, s) => n + s.guests.length, 0);

    return (
        <Box>
            <UnstyledButton w="100%" onClick={() => onGroupClick(group.name)}>
                <Group
                    px="sm" py={6} gap="xs" wrap="nowrap"
                    style={{
                        borderRadius: 'var(--mantine-radius-sm)',
                        borderLeft  : `2px solid ${isSelGrp ? 'var(--mantine-color-blue-5)' : 'transparent'}`,
                        background  : isSelGrp ? 'var(--mantine-color-blue-light)' : 'transparent',
                    }}
                >
                    <IconChevronRight
                        size={12}
                        color="var(--mantine-color-dark-3)"
                        style={{transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0}}
                    />
                    <Text size="sm" fw={600} c={isSelGrp ? 'blue.3' : 'dimmed'} style={{flex: 1}} truncate>
                        {group.name}
                    </Text>
                    <Text size="xs" ff="monospace" c="dark.3">{totalGuests}</Text>
                </Group>
            </UnstyledButton>

            <Collapse in={isOpen}>
                <Stack gap={0} pl="md" pt={2}>
                    {[...group.sub_groups].sort((a, b) => a.name.localeCompare(b.name)).map(sub => {
                        const isSel = selected.group === group.name && selected.subGroup === sub.name;
                        return (
                            <UnstyledButton key={sub.name} w="100%" onClick={() => onSubGroupClick(group.name, sub.name)}>
                                <Group
                                    px="sm" py={5} gap="xs" wrap="nowrap"
                                    style={{
                                        borderRadius: 'var(--mantine-radius-sm)',
                                        borderLeft  : `2px solid ${isSel ? 'var(--mantine-color-blue-4)' : 'transparent'}`,
                                        background  : isSel ? 'var(--mantine-color-blue-light)' : 'transparent',
                                    }}
                                >
                                    <Text size="sm" c={isSel ? 'blue.3' : 'dimmed'} style={{flex: 1}} truncate>
                                        {sub.name}
                                    </Text>
                                    <Text size="xs" ff="monospace" c="dark.4">{sub.guests.length}</Text>
                                </Group>
                            </UnstyledButton>
                        );
                    })}
                </Stack>
            </Collapse>
        </Box>
    );
}

// ── FoldersSidebar ────────────────────────────────────────────────────────────

export function FoldersSidebar({selected, onSelect}: Props) {
    const {data, isLoading} = useQuery({
        queryKey: queryKeys.guestsTree,
        queryFn : fetchGuestsTree,
    });

    const groups = data?.groups ?? [];

    // Track which groups are expanded — default to first group open
    const firstGroupName = groups[0]?.name ?? '';
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

    const effectiveOpen = openGroups.size > 0
        ? openGroups
        : firstGroupName ? new Set([firstGroupName]) : new Set<string>();

    const toggleOpen = (name: string) =>
        setOpenGroups(prev => {
            const n = new Set(prev);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });

    const handleGroupClick = (name: string) => {
        toggleOpen(name);
        onSelect({group: name, subGroup: null});
    };

    const handleSubGroupClick = (group: string, subGroup: string) => {
        onSelect({group, subGroup});
    };

    const isAllSelected = selected.group === null;

    return (
        <Box
            w={230}
            style={{
                borderRight  : '1px solid var(--mantine-color-dark-5)',
                display      : 'flex',
                flexDirection: 'column',
                height       : '100%',
                minHeight    : 0,
                overflow     : 'hidden',
            }}
        >
            {/* Header */}
            <Box p="xs" style={{borderBottom: '1px solid var(--mantine-color-dark-5)', flexShrink: 0}}>
                <Text size="xs" fw={700} tt="uppercase" c="blue.4" style={{letterSpacing: '0.1em'}}>Groups</Text>
            </Box>

            <ScrollArea flex={1}>
                {isLoading ? <SidebarSkeleton/> : (
                    <Box p="xs">
                        {/* All Guests item */}
                        <UnstyledButton w="100%" mb={4} onClick={() => onSelect({group: null, subGroup: null})}>
                            <Group
                                px="sm" py={6} gap="xs" wrap="nowrap"
                                style={{
                                    borderRadius: 'var(--mantine-radius-sm)',
                                    borderLeft  : `2px solid ${isAllSelected ? 'var(--mantine-color-blue-5)' : 'transparent'}`,
                                    background  : isAllSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
                                }}
                            >
                                <IconList size={12} color={isAllSelected ? 'var(--mantine-color-blue-3)' : 'var(--mantine-color-dark-3)'} style={{flexShrink: 0}}/>
                                <Text size="sm" fw={600} c={isAllSelected ? 'blue.3' : 'dimmed'} style={{flex: 1}}>
                                    All Guests
                                </Text>
                            </Group>
                        </UnstyledButton>

                        {/* Divider */}
                        <Box style={{borderBottom: '1px solid var(--mantine-color-dark-6)', marginBottom: 4}}/>

                        {/* Groups */}
                        {[...groups].sort((a, b) => a.name.localeCompare(b.name)).map(group => (
                            <GroupItem
                                key={group.name}
                                group={group}
                                selected={selected}
                                isOpen={effectiveOpen.has(group.name)}
                                onGroupClick={handleGroupClick}
                                onSubGroupClick={handleSubGroupClick}
                            />
                        ))}
                    </Box>
                )}
            </ScrollArea>
        </Box>
    );
}

