import { useQuery } from '@tanstack/react-query';
import type { GoalResponse } from '@/lib/api/goals';
import type { ApiError } from '@/lib/api-middleware';
import { queryKeys } from '@/lib/query-client';

async function fetchGoals(): Promise<GoalResponse[]> {
  const res = await fetch('/api/goals', {
    credentials: 'include',
  });

  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: fetchGoals,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useActiveGoals() {
  const { data: goals, ...rest } = useGoals();

  const activeGoals = goals?.filter((g) => g.status === 'active') ?? [];

  return { data: activeGoals, ...rest };
}
