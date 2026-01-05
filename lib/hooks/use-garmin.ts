import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type GarminConnection = {
  id: string;
  userId: string;
  garminEmail: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  createdAt: string;
  updatedAt: string;
};

type HealthMetric = {
  id: string;
  userId: string;
  metricType: string;
  value: string;
  unit: string | null;
  recordedAt: string;
  metadata: string | null;
  createdAt: string;
};

export function useGarminConnection() {
  return useQuery({
    queryKey: ['garmin', 'connection'],
    queryFn: async () => {
      const response = await fetch('/api/garmin/connection', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch Garmin connection');
      }
      return response.json() as Promise<GarminConnection | null>;
    },
  });
}

export function useConnectGarmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      garminEmail,
      garminPassword,
    }: {
      garminEmail: string;
      garminPassword: string;
    }) => {
      const response = await fetch('http://localhost:4000/garmin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garminEmail, garminPassword }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect Garmin');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garmin', 'connection'] });
      queryClient.invalidateQueries({ queryKey: ['garmin', 'metrics'] });
    },
  });
}

export function useDisconnectGarmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:4000/garmin/disconnect', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Garmin');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garmin', 'connection'] });
    },
  });
}

export function useHealthMetrics(metricType?: string, days = 7) {
  return useQuery({
    queryKey: ['garmin', 'metrics', metricType, days],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        ...(metricType && { type: metricType }),
      });

      const response = await fetch(`http://localhost:4000/garmin/metrics?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch health metrics');
      }

      return response.json() as Promise<HealthMetric[]>;
    },
  });
}

export function useHealthMetricsSummary(days = 7) {
  return useQuery({
    queryKey: ['garmin', 'metrics', 'summary', days],
    queryFn: async () => {
      const params = new URLSearchParams({ days: days.toString() });

      const response = await fetch(`http://localhost:4000/garmin/metrics/summary?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch health metrics summary');
      }

      return response.json();
    },
  });
}

export function useSyncGarmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:4000/garmin/sync', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync Garmin data');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garmin', 'connection'] });
      queryClient.invalidateQueries({ queryKey: ['garmin', 'metrics'] });
    },
  });
}

export function useLatestHealthMetrics() {
  return useQuery({
    queryKey: ['garmin', 'metrics', 'latest'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4000/garmin/metrics/latest', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch latest health metrics');
      }

      return response.json() as Promise<HealthMetric[]>;
    },
  });
}
