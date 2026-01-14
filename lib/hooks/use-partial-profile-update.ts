import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  console.log(
    '[usePartialProfileUpdate] Sending PATCH to /api/profile/partial with data:',
    data,
  );
  const response = await fetch('/api/profile/partial', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  console.log('[usePartialProfileUpdate] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[usePartialProfileUpdate] Error response:', errorText);
    throw new Error(
      `Failed to update profile: ${response.status} ${errorText}`,
    );
  }

  const result = await response.json();
  console.log('[usePartialProfileUpdate] Success response:', result);
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
