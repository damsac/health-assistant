import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConversationListResponse,
  ConversationWithMessagesResponse,
} from '../api/conversation';
import { config } from '../config';
import { queryKeys } from '../query-client';

// Fetch all conversations
export async function fetchConversations(): Promise<ConversationListResponse> {
  const res = await fetch(`${config.agent.url}/chat/conversations`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch conversations');
  }

  return res.json();
}

// Fetch single conversation with messages
async function fetchConversation(
  id: string,
): Promise<ConversationWithMessagesResponse> {
  const res = await fetch(`${config.agent.url}/chat/conversations/${id}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch conversation');
  }

  return res.json();
}

// Delete conversation
async function deleteConversation(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${config.agent.url}/chat/conversations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete conversation');
  }

  return res.json();
}

// Hook to fetch all conversations
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: fetchConversations,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook to fetch a single conversation with messages
export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id ?? ''),
    queryFn: () => fetchConversation(id ?? ''),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to delete a conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, deletedId) => {
      // Remove from list cache
      queryClient.setQueryData<ConversationListResponse>(
        queryKeys.conversations.list(),
        (old) => (old ? old.filter((c) => c.id !== deletedId) : []),
      );
      // Remove detail cache
      queryClient.removeQueries({
        queryKey: queryKeys.conversations.detail(deletedId),
      });
    },
  });
}
