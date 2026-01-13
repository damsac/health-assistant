import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import type { ProfileApi } from '../api/profile';
import type { ApiError } from '../api-middleware';
import { config } from '../config';
import { queryKeys } from '../query-client';

type ProfileResponse = ProfileApi['GET']['response'];
type UpsertProfileRequest = ProfileApi['PUT']['request'];

async function fetchProfile(): Promise<ProfileResponse | null> {
  const res = await fetch(`${config.agent.url}/api/profile`, {
    credentials: 'include',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const error: ApiError = await res.json();
    throw new Error(error.error);
  }

  return res.json();
}

async function upsertProfile(
  data: UpsertProfileRequest,
): Promise<ProfileResponse> {
  const res = await fetch(`${config.agent.url}/api/profile`, {
    method: 'PUT',
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

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail,
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useSuspenseProfile() {
  return useSuspenseQuery({
    queryKey: queryKeys.profile.detail,
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile.detail, data);
    },
  });
}
