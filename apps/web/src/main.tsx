import { initSentry } from './lib/sentry';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Import the router
import { router } from './router';

// Import ToastProvider from the correct file
import { ToastProvider } from './components/ui/toast';

// Initialize Sentry in production
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  initSentry();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
