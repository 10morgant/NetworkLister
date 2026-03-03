import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routes';

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // preload on hover — snappy navigation
});

// Type-safe router throughout the app
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}