// src/components/layout/AppLayout.tsx
import { useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import {
    AppShell, Box, Stack, Text, Tooltip,
    UnstyledButton, Group, Flex,
} from '@mantine/core';
import {
    IconLayoutDashboard, IconServer, IconFolder,
    IconSettings, IconHexagon, IconClock,
    IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

type Page = 'dashboard' | 'networks' | 'folders' | 'review' | 'manage';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={18} />, path: '/', base: '/' },
    { id: 'networks', label: 'Networks', icon: <IconServer size={18} />, path: '/networks/core-1', base: '/networks' },
    { id: 'folders', label: 'Guests by Folder', icon: <IconFolder size={18} />, path: '/folders', base: '/folders' },
    { id: 'review', label: 'Review VMs', icon: <IconClock size={18} />, path: '/review', base: '/review' },
    { id: 'manage', label: 'Manage Networks', icon: <IconSettings size={18} />, path: '/manage', base: '/manage' },
];




const WIDE = 280;
const SLIM = 52;

function NavItem({ item, active, collapsed }: {
    item: typeof NAV_ITEMS[number];
    active: boolean;
    collapsed: boolean;
}) {
    const inner = (
        <Link to={item.path} style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
            <Group
                gap="sm"
                px={collapsed ? 0 : 'sm'} py={8}
                justify={collapsed ? 'center' : 'flex-start'}
                style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    borderLeft: !collapsed
                        ? `2px solid ${active ? 'var(--mantine-color-blue-5)' : 'transparent'}`
                        : 'none',
                    background: active ? 'var(--surface-3)' : 'transparent',
                    color: active
                        ? 'var(--mantine-color-white)'
                        : 'var(--mantine-color-dark-2)',
                    transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => {
                    if (!active)
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                }}
                onMouseLeave={e => {
                    if (!active)
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
            >
                <Box style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</Box>
                {!collapsed && (
                    <Text size="sm" fw={active ? 600 : 400}
                        style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {item.label}
                    </Text>
                )}
            </Group>
        </Link>
    );

    return collapsed
        ? <Tooltip label={item.label} position="right" withArrow offset={8}>{inner}</Tooltip>
        : inner;
}

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;

    // Update isActive to use base:
    const isActive = (item: typeof NAV_ITEMS[number]) => {
        if (item.base === '/') return currentPath === '/';
        return currentPath.startsWith(item.base);
    };

    return (
        <AppShell
            navbar={{ width: collapsed ? SLIM : WIDE, breakpoint: 'sm' }}
            padding={0}
            styles={{
                navbar: { transition: 'width 0.2s ease', background: 'var(--surface-1)', borderRight: '1px solid var(--border)' },
                main: { background: 'var(--surface-0)' },
            }}
        >
            <AppShell.Navbar p={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                {/* Logo */}
                <Box
                    px={collapsed ? 0 : 'md'} py="sm"
                    style={{
                        borderBottom: '1px solid var(--border)', flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: 10, minHeight: 56,
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

                {/* Nav */}
                <Box px={collapsed ? 6 : 8} py={8} style={{ flexShrink: 0 }}>
                    <Stack gap={2}>
                        {NAV_ITEMS.map(item => (
                            <NavItem
                                key={item.id}
                                item={item}
                                active={isActive(item)}
                                collapsed={collapsed}
                            />
                        ))}
                    </Stack>
                </Box>

                <Box style={{ flex: 1 }} />

                {/* Collapse toggle */}
                <Box
                    px={collapsed ? 0 : 'sm'} py="sm"
                    style={{
                        borderTop: '1px solid var(--border)', flexShrink: 0,
                        display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end',
                    }}
                >
                    <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right" withArrow offset={8}>
                        <UnstyledButton
                            onClick={() => setCollapsed(v => !v)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: 'var(--mantine-radius-sm)',
                                color: 'var(--mantine-color-dark-2)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {collapsed ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
                        </UnstyledButton>
                    </Tooltip>
                </Box>
            </AppShell.Navbar>

            <AppShell.Main style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}