import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Query keys for type-safe cache management
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  profile: {
    detail: ['profile'] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    list: () => [...queryKeys.conversations.all, 'list'] as const,
    detail: (id: string) =>
      [...queryKeys.conversations.all, 'detail', id] as const,
  },
  goals: {
    all: ['goals'] as const,
  },
  dailyLog: {
    all: ['dailyLog'] as const,
    today: ['dailyLog', 'today'] as const,
  },
} as const;
