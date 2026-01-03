import { and, desc, eq } from 'drizzle-orm';
import {
  type ConversationResponse,
  type ConversationWithMessagesResponse,
  generateTitleFromMessage,
  type MessagePart,
  type MessageResponse,
  parseMessageParts,
  stringifyMessageParts,
} from '../../lib/api/conversation';
import { conversation, db, message } from '../../lib/db';

export type CreateConversationInput = {
  userId: string;
  title?: string;
};

export type CreateMessageInput = {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
};

/**
 * Service layer for conversation data access.
 * Centralizes all DB operations for conversations and messages.
 */
export const conversationService = {
  /**
   * List all conversations for a user, ordered by most recent
   */
  async listByUser(userId: string): Promise<ConversationResponse[]> {
    return db.query.conversation.findMany({
      where: eq(conversation.userId, userId),
      orderBy: [desc(conversation.updatedAt)],
    });
  },

  /**
   * Get a conversation by ID, verifying ownership
   * Returns null if not found or not owned by user
   */
  async getByIdForUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationResponse | null> {
    const result = await db.query.conversation.findFirst({
      where: and(
        eq(conversation.id, conversationId),
        eq(conversation.userId, userId),
      ),
    });
    return result ?? null;
  },

  /**
   * Get a conversation with all its messages
   */
  async getWithMessages(
    conversationId: string,
    userId: string,
  ): Promise<ConversationWithMessagesResponse | null> {
    const conv = await this.getByIdForUser(conversationId, userId);
    if (!conv) return null;

    const messages = await db.query.message.findMany({
      where: eq(message.conversationId, conversationId),
      orderBy: [message.createdAt],
    });

    const messagesWithParsedParts: MessageResponse[] = messages.map((msg) => ({
      ...msg,
      parts: parseMessageParts(msg.parts),
    }));

    return { ...conv, messages: messagesWithParsedParts };
  },

  /**
   * Create a new conversation
   */
  async create(input: CreateConversationInput): Promise<ConversationResponse> {
    const [newConversation] = await db
      .insert(conversation)
      .values({
        userId: input.userId,
        title: input.title ?? null,
      })
      .returning();

    return newConversation;
  },

  /**
   * Create a conversation with auto-generated title from first message
   */
  async createWithAutoTitle(
    userId: string,
    firstMessageText?: string,
  ): Promise<ConversationResponse> {
    const title = firstMessageText
      ? generateTitleFromMessage(firstMessageText)
      : 'New conversation';

    return this.create({ userId, title });
  },

  /**
   * Delete a conversation (cascades to messages)
   */
  async delete(conversationId: string, userId: string): Promise<boolean> {
    const conv = await this.getByIdForUser(conversationId, userId);
    if (!conv) return false;

    await db.delete(conversation).where(eq(conversation.id, conversationId));
    return true;
  },

  /**
   * Update the conversation's updatedAt timestamp
   */
  async touch(conversationId: string): Promise<void> {
    await db
      .update(conversation)
      .set({ updatedAt: new Date() })
      .where(eq(conversation.id, conversationId));
  },

  /**
   * Add a message to a conversation
   */
  async addMessage(input: CreateMessageInput): Promise<void> {
    await db.insert(message).values({
      conversationId: input.conversationId,
      role: input.role,
      parts: stringifyMessageParts(input.parts),
    });
  },
};
