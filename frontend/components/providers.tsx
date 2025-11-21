"use client";

import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useTelemetry } from '@/lib/telemetry';
import { useThemeApplier } from '@/hooks/useThemeApplier';

function ThemeApplierWrapper({ children }: { children: React.ReactNode }) {
  useThemeApplier(); // Apply theme colors to DOM
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useTelemetry();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange
      storageKey="uns-theme"
    >
      <ThemeApplierWrapper>
        <QueryClientProvider client={queryClient}>
          {children}
        {mounted && (
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        )}
        </QueryClientProvider>
      </ThemeApplierWrapper>
    </ThemeProvider>
  );
}
