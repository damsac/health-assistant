import { type UIMessage, useChat as useAIChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ConversationListResponse,
  getTextFromParts,
} from '../api/conversation';
import { config } from '../config';
import { queryKeys } from '../query-client';
import { fetchConversations, useConversation } from './use-conversations';

type UseChatOptions = {
  /**
   * ID of an existing conversation to load. Leave undefined for new chats.
   */
  existingConversationId?: string;
  /**
   * Called when a new conversation is created by the server.
   * Use this to update the URL - the hook handles internal state.
   */
  onConversationCreated?: (id: string) => void;
};

/**
 * Chat hook that handles both new and existing conversations.
 *
 * For new chats: Pass no existingConversationId. After first message,
 * onConversationCreated fires with the server-assigned ID.
 *
 * For existing chats: Pass existingConversationId. Messages load from DB.
 */
export function useChat(options: UseChatOptions = {}) {
  const { existingConversationId, onConversationCreated } = options;
  const queryClient = useQueryClient();

  // ID created during this session (for new chats)
  const createdInSessionRef = useRef<string | null>(null);

  // Controls AI SDK state reset - only changes when switching conversations
  const [chatInstanceId, setChatInstanceId] = useState(
    existingConversationId ?? 'new',
  );

  // Only fetch from DB for existing conversations (not ones we just created)
  const shouldFetchFromDb =
    existingConversationId &&
    existingConversationId !== createdInSessionRef.current;
  const { data: conversation, isLoading } = useConversation(
    shouldFetchFromDb ? existingConversationId : undefined,
  );

  // Keep existingConversationId in a ref so transport closure stays stable
  const existingIdRef = useRef(existingConversationId);
  existingIdRef.current = existingConversationId;

  // Effective conversation ID for API calls (reads from refs for fresh value)
  const getEffectiveId = () =>
    existingIdRef.current ?? createdInSessionRef.current;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${config.agent.url}/chat`,
        credentials: 'include',
        body: () => ({
          conversationId: existingIdRef.current ?? createdInSessionRef.current,
        }),
      }),
    [],
  );

  const chat = useAIChat({
    id: chatInstanceId,
    transport,
    // Auto-continue after user approves/denies tool execution
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish: async () => {
      // New chat: detect server-assigned conversation ID
      if (!getEffectiveId()) {
        const conversations =
          await queryClient.fetchQuery<ConversationListResponse>({
            queryKey: queryKeys.conversations.list(),
            queryFn: fetchConversations,
            staleTime: 0,
          });

        const newId = conversations?.[0]?.id;
        if (newId) {
          createdInSessionRef.current = newId;
          onConversationCreated?.(newId);
        }
      }

      // Sync cache with DB
      const id = getEffectiveId();
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.detail(id),
        });
      }
    },
  });

  // Load messages from DB for existing conversations
  useEffect(() => {
    if (!conversation?.messages?.length) return;

    chat.setMessages(
      conversation.messages.map(
        (msg) =>
          ({
            id: msg.id,
            role: msg.role,
            content: '',
            parts: msg.parts,
            createdAt: new Date(msg.createdAt),
          }) as UIMessage,
      ),
    );
  }, [conversation, chat.setMessages]);

  // Handle conversation switches
  useEffect(() => {
    // Same conversation (including when parent syncs to our created ID)
    if (existingConversationId === createdInSessionRef.current) return;
    // Already on fresh new chat (no existing ID and never created one this session)
    if (
      existingConversationId === undefined &&
      chatInstanceId === 'new' &&
      !createdInSessionRef.current
    )
      return;

    // Switching to different conversation - reset chat state
    createdInSessionRef.current = null;
    setChatInstanceId(existingConversationId ?? 'new');
    chat.setMessages([]);
  }, [existingConversationId, chatInstanceId, chat.setMessages]);

  return {
    ...chat,
    conversationId: getEffectiveId(),
    isLoadingConversation: isLoading,
    conversationTitle: conversation?.title ?? null,
    getMessageText: getTextFromParts,
  };
}
