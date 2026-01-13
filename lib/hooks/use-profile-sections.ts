import { useQuery } from '@tanstack/react-query';

type ProfileSection = {
  id: string;
  userId: string;
  sectionKey: string;
  completed: boolean;
  completedAt: string | null;
};

type IncompleteSection = {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
};

const INCOMPLETE_SECTIONS: IncompleteSection[] = [
  {
    key: 'sleep',
    title: 'Sleep Patterns',
    subtitle: 'Better energy advice',
    icon: '🌙',
    route: '/profile/sleep',
  },
  {
    key: 'garmin',
    title: 'Connect Garmin',
    subtitle: 'Real-time health insights',
    icon: '⌚',
    route: '/profile/garmin',
  },
  {
    key: 'eating',
    title: 'Eating Schedule',
    subtitle: 'Optimize meal timing',
    icon: '🍽️',
    route: '/profile/eating',
  },
  {
    key: 'supplements',
    title: 'Supplements & Medications',
    subtitle: 'Avoid interactions',
    icon: '💊',
    route: '/profile/supplements',
  },
  {
    key: 'lifestyle',
    title: 'Stress & Lifestyle',
    subtitle: 'Holistic wellness view',
    icon: '🧘',
    route: '/profile/lifestyle',
  },
];

async function fetchProfileSections(): Promise<ProfileSection[]> {
  const response = await fetch('/api/profile-sections', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile sections');
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

  // Get incomplete sections
  const incompleteSections = INCOMPLETE_SECTIONS.filter(
    (section) =>
      !sections.find((s) => s.sectionKey === section.key && s.completed),
  );

  return {
    sections,
    incompleteSections,
    isLoading,
    error,
  };
}
