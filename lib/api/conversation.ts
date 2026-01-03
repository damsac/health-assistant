import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { conversation, message, messageRoleEnum } from '@/lib/db/schema';

// Drizzle-generated schemas
const selectConversationSchema = createSelectSchema(conversation);
const selectMessageSchema = createSelectSchema(message);

// Message part schema (matches AI SDK UIMessage.parts format)
export const messagePartSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('reasoning'),
    text: z.string(),
    state: z.enum(['streaming', 'done']).optional(),
  }),
  z.object({
    type: z.literal('tool-invocation'),
    toolInvocationId: z.string(),
    toolName: z.string(),
    args: z.unknown(),
    state: z.enum(['partial-call', 'call', 'result']),
    result: z.unknown().optional(),
  }),
]);

export type MessagePart = z.infer<typeof messagePartSchema>;

// Request schemas
export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
});

export const createMessageSchema = z.object({
  role: z.enum(messageRoleEnum),
  parts: z.array(messagePartSchema),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: createMessageSchema,
});

// Response types
export type ConversationResponse = z.infer<typeof selectConversationSchema>;

export type MessageResponse = Omit<
  z.infer<typeof selectMessageSchema>,
  'parts'
> & {
  parts: MessagePart[];
};

export type ConversationWithMessagesResponse = ConversationResponse & {
  messages: MessageResponse[];
};

export type ConversationListResponse = ConversationResponse[];

// API contract
export type ConversationApi = {
  'GET /conversations': { response: ConversationListResponse };
  'POST /conversations': {
    request: z.infer<typeof createConversationSchema>;
    response: ConversationResponse;
  };
  'GET /conversations/:id': { response: ConversationWithMessagesResponse };
  'DELETE /conversations/:id': { response: { success: boolean } };
};

// Helper to generate title from first message
export function generateTitleFromMessage(text: string, maxLength = 50): string {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 3)}...`;
}

// Helper to parse parts from DB JSON string
export function parseMessageParts(partsJson: string): MessagePart[] {
  try {
    const parsed = JSON.parse(partsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper to stringify parts for DB storage
export function stringifyMessageParts(parts: MessagePart[]): string {
  return JSON.stringify(parts);
}

// Helper to extract text content from message parts
export function getTextFromParts(
  parts: MessagePart[] | Array<{ type: string; text?: string }>,
): string {
  return parts
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text',
    )
    .map((part) => part.text)
    .join('');
}
