/* apps/web/src/main.tsx */
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

// Theme — provider applies light/dark class on change; initializeTheme
// applies the persisted theme BEFORE first paint (no light-flash on load)
import { ThemeProvider } from './components/theme-provider';
import { initializeTheme } from './stores/themeStore';

// A6 offline-tolerant front desk
import { initOffline } from './lib/offline';
import { apiClient, getAuthHeaders, apiFetchForRefresh } from './api/client';

// Initialize Sentry in production
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  initSentry();
}

// Apply persisted theme before React renders — prevents FOUC
initializeTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── A6: initialize the offline layer on the shared axios instance ───
initOffline({ apiClient, getAuthHeaders, apiFetchForRefresh });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
