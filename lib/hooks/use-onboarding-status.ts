import { useQuery } from '@tanstack/react-query';
import { config } from '../config';

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      // We'll need to pass the user ID, but we don't have direct access here
      // For now, we'll make an API call instead
      const response = await fetch(
        `${config.agent.url}/api/profile/onboarding-status`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch onboarding status');
      }

      return response.json() as Promise<{ isComplete: boolean }>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
