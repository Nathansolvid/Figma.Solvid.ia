import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus (too aggressive for B2B app)
      refetchOnReconnect: true, // Refetch on reconnect (useful for offline scenarios)
    },
    mutations: {
      retry: 0, // Don't retry mutations (avoid duplicate operations)
    },
  },
});
