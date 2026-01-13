import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import type { ProfileApi } from '../api/profile';
import type { ApiError } from '../api-middleware';
import { queryKeys } from '../query-client';

type ProfileResponse = ProfileApi['GET']['response'];
type UpsertProfileRequest = ProfileApi['PUT']['request'];

async function fetchProfile(): Promise<ProfileResponse | null> {
  console.log('[fetchProfile] Starting fetch to /api/profile');
  try {
    const res = await fetch('/api/profile', {
      credentials: 'include',
    });
    console.log('[fetchProfile] Response status:', res.status);

    if (res.status === 404) {
      console.log('[fetchProfile] Profile not found (404), returning null');
      return null;
    }

    if (!res.ok) {
      const error: ApiError = await res.json();
      console.error('[fetchProfile] Error response:', error);
      throw new Error(error.error);
    }

    const data = await res.json();
    console.log('[fetchProfile] Success, profile data:', data);
    return data;
  } catch (error) {
    console.error('[fetchProfile] Fetch error:', error);
    throw error;
  }
}

async function upsertProfile(
  data: UpsertProfileRequest,
): Promise<ProfileResponse> {
  const res = await fetch('/api/profile', {
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
