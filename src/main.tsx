import React                from 'react';
import ReactDOM             from 'react-dom/client';
import {
	createTheme,
	MantineProvider
}                           from '@mantine/core';
import {
	QueryClient,
	QueryClientProvider
}                           from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {RouterProvider}     from '@tanstack/react-router';
import {router}             from '@/router';
import '@mantine/core/styles.css';
import {StarredProvider}    from './context/starred';

const CSS_VARS = `
  :root {
    --surface-0: #111111;
    --surface-1: #1a1a1a;
    --surface-2: #222222;
    --surface-3: #2c2c2c;
    --border:    #383838;
  }
  body { background: var(--surface-0); }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface-1); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const theme = createTheme({
    primaryColor       : 'blue',
    defaultRadius      : 'sm',
    fontFamily         : 'Inter, system-ui, sans-serif',
    fontFamilyMonospace: 'JetBrains Mono, monospace',
    colors             : {
        dark: [
            '#ededed', '#c2c2c2', '#969696', '#6a6a6a',
            '#4a4a4a', '#383838', '#2c2c2c', '#222222',
            '#1a1a1a', '#111111',
        ],
    },
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime           : 1000 * 60 * 5, // 5 min — data stays fresh, avoids refetch on tab switch
            retry               : 1,
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme} forceColorScheme="dark">
                <style>{CSS_VARS}</style>
                <StarredProvider>
                    <RouterProvider router={router}/>
                </StarredProvider>
            </MantineProvider>
            <ReactQueryDevtools initialIsOpen={false}/>
        </QueryClientProvider>
    </React.StrictMode>
);