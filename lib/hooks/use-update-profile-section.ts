import { useMutation, useQueryClient } from '@tanstack/react-query';
import { config } from '../config';

type UpdateProfileSectionRequest = {
  sectionKey: string;
  completed: boolean;
};

async function updateProfileSection(
  data: UpdateProfileSectionRequest,
): Promise<void> {
  const response = await fetch(`${config.agent.url}/api/profile-sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile section');
  }
}

export function useUpdateProfileSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileSection,
    onSuccess: () => {
      // Invalidate profile sections query to refetch
      queryClient.invalidateQueries({ queryKey: ['profile-sections'] });
    },
  });
}
