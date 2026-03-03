// src/App.tsx
import { useState } from 'react';
import {
    AppShell, Box, Stack, Text, Tooltip,
    UnstyledButton, Group, Transition,
} from '@mantine/core';
import {
    IconLayoutDashboard, IconServer, IconFolder,
    IconSettings, IconHexagon, IconClock,
    IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

import NetworksPage from '@/pages/Networks';
import FoldersPage from '@/pages/Folders';
import ManagePage from '@/pages/Manage';
import Dashboard from '@/pages/Dashboard';
import ReviewPage from '@/pages/Review';

type Page = 'networks' | 'folders' | 'manage' | 'dashboard' | 'review';

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={18} /> },
    { id: 'networks', label: 'Networks', icon: <IconServer size={18} /> },
    { id: 'folders', label: 'Guests by Folder', icon: <IconFolder size={18} /> },
    { id: 'review', label: 'Review VMs', icon: <IconClock size={18} /> },
    { id: 'manage', label: 'Manage Networks', icon: <IconSettings size={18} /> },
];

const WIDE = 240;
const SLIM = 52;

interface NavItemProps {
    item: typeof NAV_ITEMS[number];
    active: boolean;
    collapsed: boolean;
    onClick: () => void;
}

function NavItem({ item, active, collapsed, onClick }: NavItemProps) {
    const btn = (
        <UnstyledButton onClick={onClick} style={{ width: '100%' }}>
            <Group
                gap="sm"
                px={collapsed ? 0 : 'sm'}
                py={8}
                justify={collapsed ? 'center' : 'flex-start'}
                style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    borderLeft: !collapsed
                        ? `2px solid ${active ? 'var(--mantine-color-blue-5)' : 'transparent'}`
                        : 'none',
                    background: active
                        ? 'var(--mantine-color-dark-5)'
                        : 'transparent',
                    color: active
                        ? 'var(--mantine-color-white)'
                        : 'var(--mantine-color-dark-2)',
                    transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => {
                    if (!active)
                        (e.currentTarget as HTMLElement).style.background = 'var(--mantine-color-dark-6)';
                }}
                onMouseLeave={e => {
                    if (!active)
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
            >
                <Box style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</Box>
                {!collapsed && (
                    <Text size="sm" fw={active ? 600 : 400} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {item.label}
                    </Text>
                )}
            </Group>
        </UnstyledButton>
    );

    if (collapsed) {
        return (
            <Tooltip label={item.label} position="right" withArrow offset={8}>
                {btn}
            </Tooltip>
        );
    }

    return btn;
}

export default function App() {
    const [page, setPage] = useState<Page>('networks');
    const [starred, setStarred] = useState<Set<string>>(new Set(['core-1', 'u-1', 'u-2']));
    const [collapsed, setCollapsed] = useState(false);

    const toggleStar = (id: string) =>
        setStarred(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const navWidth = collapsed ? SLIM : WIDE;

    return (
        <AppShell
            navbar={{ width: navWidth, breakpoint: 'sm' }}
            padding={0}
            styles={{
                navbar: { transition: 'width 0.2s ease' },
            }}
        >
            {/* ── Navbar ── */}
            <AppShell.Navbar
                p={0}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >

                {/* Logo */}
                <Box
                    px={collapsed ? 0 : 'md'}
                    py="sm"
                    style={{
                        borderBottom: '1px solid var(--mantine-color-dark-5)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: 10,
                        minHeight: 56,
                    }}
                >
                    <IconHexagon size={24} color="var(--mantine-color-blue-5)" stroke={1.5} style={{ flexShrink: 0 }} />
                    {!collapsed && (
                        <Box style={{ overflow: 'hidden' }}>
                            <Text fw={700} size="sm" lh={1.2} style={{ whiteSpace: 'nowrap' }}>VM Navigator</Text>
                            <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                                Guest Explorer
                            </Text>
                        </Box>
                    )}
                </Box>

                {/* Nav items */}
                <Box px={collapsed ? 6 : 8} py={8} style={{ flexShrink: 0 }}>
                    <Stack gap={2}>
                        {NAV_ITEMS.map(item => (
                            <NavItem
                                key={item.id}
                                item={item}
                                active={page === item.id}
                                collapsed={collapsed}
                                onClick={() => setPage(item.id)}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* Spacer — pushes collapse toggle to bottom */}
                <Box style={{ flex: 1 }} />

                {/* Collapse toggle */}
                <Box
                    px={collapsed ? 0 : 'sm'}
                    py="sm"
                    style={{
                        borderTop: '1px solid var(--mantine-color-dark-5)',
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: collapsed ? 'center' : 'flex-end',
                    }}
                >
                    <Tooltip
                        label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        position="right"
                        withArrow
                        offset={8}
                    >
                        <UnstyledButton
                            onClick={() => setCollapsed(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: 'var(--mantine-radius-sm)',
                                color: 'var(--mantine-color-dark-2)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--mantine-color-dark-5)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {collapsed
                                ? <IconChevronRight size={15} />
                                : <IconChevronLeft size={15} />}
                        </UnstyledButton>
                    </Tooltip>
                </Box>
            </AppShell.Navbar>

            {/* ── Main ── */}
            <AppShell.Main
                style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
            >
                {page === 'dashboard' && <Dashboard />}
                {page === 'networks' && <NetworksPage starred={starred} toggleStar={toggleStar} />}
                {page === 'folders' && <FoldersPage />}
                {page === 'review' && <ReviewPage />}
                {page === 'manage' && <ManagePage />}
            </AppShell.Main>
        </AppShell>
    );
}