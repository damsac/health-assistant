import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateDailyLogRequest,
  DailyLogResponse,
  DeleteDailyLogResponse,
  TodaySummary,
} from '@/lib/api/daily-log';
import type { ApiError } from '@/lib/api-middleware';
import { queryKeys } from '@/lib/query-client';

async function fetchTodaySummary(): Promise<TodaySummary> {
  const res = await fetch('/api/daily-log?today=true', {
    credentials: 'include',
  });

  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

async function createDailyLog(
  data: CreateDailyLogRequest,
): Promise<DailyLogResponse> {
  const res = await fetch('/api/daily-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

export function useTodaySummary() {
  return useQuery({
    queryKey: queryKeys.dailyLog.today,
    queryFn: fetchTodaySummary,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCreateDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDailyLog,
    onSuccess: () => {
      // Invalidate today's summary to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLog.today });
    },
  });
}

async function deleteDailyLog(id: string): Promise<DeleteDailyLogResponse> {
  const res = await fetch(`/api/daily-log/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

export function useDeleteDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDailyLog,
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.dailyLog.today });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TodaySummary>(
        queryKeys.dailyLog.today,
      );

      // Optimistically update by removing the entry
      if (previousData) {
        const deletedEntry = previousData.entries.find((e) => e.id === id);
        queryClient.setQueryData<TodaySummary>(queryKeys.dailyLog.today, {
          ...previousData,
          entries: previousData.entries.filter((entry) => entry.id !== id),
          waterEntries: previousData.waterEntries.filter(
            (entry) => entry.id !== id,
          ),
          waterCount:
            deletedEntry?.category === 'water'
              ? previousData.waterCount - 1
              : previousData.waterCount,
          mealCount:
            deletedEntry?.category === 'meal'
              ? previousData.mealCount - 1
              : previousData.mealCount,
        });
      }

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.dailyLog.today,
          context.previousData,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLog.today });
    },
  });
}
