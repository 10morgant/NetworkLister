import { createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
import Dashboard from '@/pages/Dashboard';
import NetworksPage from '@/pages/Networks';
import FoldersPage from '@/pages/Folders';
import ReviewPage from '@/pages/Review';
import ManagePage from '@/pages/Manage';
import { AppLayout } from '@/components/layout/AppLayout';

export const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'layout',
    component: AppLayout,
});

export const dashboardRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: Dashboard,
});

// /networks redirects to /networks/core-1 (or whatever your default is)
// export const networksIndexRoute = createRoute({
//     getParentRoute: () => layoutRoute,
//     path: '/networks/{-$networkId}',
// });

export const networkRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/networks/{-$networkId}',
    component: NetworksPage,
});

export const foldersRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/folders',
    component: FoldersPage,
});

export const reviewRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/review',
    component: ReviewPage,
});

export const manageRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/manage',
    component: ManagePage,
});

export const routeTree = rootRoute.addChildren([
    layoutRoute.addChildren([
        dashboardRoute,
        networkRoute,
        foldersRoute,
        reviewRoute,
        manageRoute,
    ]),
]);