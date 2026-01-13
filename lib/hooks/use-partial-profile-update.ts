import { useMutation, useQueryClient } from '@tanstack/react-query';
import { config } from '../config';

type PartialProfileUpdate = {
  sleepHoursAverage?: number;
  sleepQuality?: string;
  typicalWakeTime?: string;
  typicalBedTime?: string;
  mealsPerDay?: number;
  typicalMealTimes?: string[];
  snackingHabits?: string;
  supplementsMedications?: string | null;
  stressLevel?: string;
  exerciseFrequency?: string;
  exerciseTypes?: string[];
  waterIntakeLiters?: number;
  garminConnected?: boolean;
  garminUserId?: string | null;
};

async function updatePartialProfile(data: PartialProfileUpdate): Promise<void> {
  const response = await fetch(`${config.agent.url}/api/profile/partial`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }
}

export function usePartialProfileUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePartialProfile,
    onSuccess: () => {
      // Invalidate profile query to refetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
