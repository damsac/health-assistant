import { useQuery } from '@tanstack/react-query';
import type { Section } from '@/lib/profile-utils';
import { config } from '../config';

type ProfileSection = {
  id: string;
  userId: string;
  sectionKey: string;
  completed: boolean;
  completedAt: string | null;
};

async function fetchProfileSections(): Promise<ProfileSection[]> {
  const response = await fetch(`${config.api.url}/api/profile-sections`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile sections');
  }

  return response.json();
}

async function fetchIncompleteSections(): Promise<Section[]> {
  const response = await fetch(
    `${config.api.url}/api/profile/incomplete-sections`,
    {
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch incomplete sections');
  }

  return response.json();
}

export function useProfileSections() {
  const {
    data: sections = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile-sections'],
    queryFn: fetchProfileSections,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: incompleteSections = [],
    isLoading: isLoadingIncomplete,
    error: incompleteError,
  } = useQuery({
    queryKey: ['profile-incomplete-sections'],
    queryFn: fetchIncompleteSections,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    sections,
    incompleteSections,
    isLoading: isLoading || isLoadingIncomplete,
    error: error || incompleteError,
  };
}
