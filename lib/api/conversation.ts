import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { conversation, message, messageRoleEnum } from '@/lib/db/schema';

// Drizzle-generated schemas
const selectConversationSchema = createSelectSchema(conversation);
const selectMessageSchema = createSelectSchema(message);

/**
 * Tool invocation states matching AI SDK's UIToolInvocation state
 */
export const toolInvocationStateSchema = z.enum([
  'input-streaming',
  'input-available',
  'approval-requested',
  'approval-responded',
  'output-available',
  'output-error',
  'output-denied',
]);

export type ToolInvocationState = z.infer<typeof toolInvocationStateSchema>;

/**
 * Base tool invocation fields (common to all states)
 */
const toolInvocationBaseSchema = z.object({
  toolCallId: z.string(),
  title: z.string().optional(),
  providerExecuted: z.boolean().optional(),
});

/**
 * Approval object for tool invocations that require/have approval
 */
const toolApprovalSchema = z.object({
  id: z.string(),
  approved: z.boolean().optional(),
  reason: z.string().optional(),
});

/**
 * Tool invocation schema matching AI SDK's UIToolInvocation discriminated by state
 */
const toolInvocationSchema = z.discriminatedUnion('state', [
  toolInvocationBaseSchema.extend({
    state: z.literal('input-streaming'),
    input: z.unknown().optional(),
  }),
  toolInvocationBaseSchema.extend({
    state: z.literal('input-available'),
    input: z.unknown(),
    callProviderMetadata: z.record(z.string(), z.unknown()).optional(),
  }),
  toolInvocationBaseSchema.extend({
    state: z.literal('approval-requested'),
    input: z.unknown(),
    callProviderMetadata: z.record(z.string(), z.unknown()).optional(),
    approval: toolApprovalSchema,
  }),
  toolInvocationBaseSchema.extend({
    state: z.literal('approval-responded'),
    input: z.unknown(),
    callProviderMetadata: z.record(z.string(), z.unknown()).optional(),
    approval: toolApprovalSchema,
  }),
  toolInvocationBaseSchema.extend({
    state: z.literal('output-available'),
    input: z.unknown(),
    output: z.unknown(),
    callProviderMetadata: z.record(z.string(), z.unknown()).optional(),
    preliminary: z.boolean().optional(),
    approval: toolApprovalSchema.optional(),
  }),
  toolInvocationBaseSchema.extend({
    state: z.literal('output-error'),
    input: z.unknown().optional(),
    rawInput: z.unknown().optional(),
    errorText: z.string(),
    callProviderMetadata: z.record(z.string(), z.unknown()).optional(),
    approval: toolApprovalSchema.optional(),
  }),
  toolInvocationBaseSchema.extend({
    state: z.literal('output-denied'),
    input: z.unknown(),
    callProviderMetadata: z.record(z.string(), z.unknown()).optional(),
    approval: toolApprovalSchema,
  }),
]);

/**
 * TextUIPart - matches AI SDK's TextUIPart
 */
const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  state: z.enum(['streaming', 'done']).optional(),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * ReasoningUIPart - matches AI SDK's ReasoningUIPart
 */
const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  state: z.enum(['streaming', 'done']).optional(),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * SourceUrlUIPart - matches AI SDK's SourceUrlUIPart
 */
const sourceUrlPartSchema = z.object({
  type: z.literal('source-url'),
  sourceId: z.string(),
  url: z.string(),
  title: z.string().optional(),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * SourceDocumentUIPart - matches AI SDK's SourceDocumentUIPart
 */
const sourceDocumentPartSchema = z.object({
  type: z.literal('source-document'),
  sourceId: z.string(),
  mediaType: z.string(),
  title: z.string(),
  filename: z.string().optional(),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * FileUIPart - matches AI SDK's FileUIPart
 */
const filePartSchema = z.object({
  type: z.literal('file'),
  mediaType: z.string(),
  filename: z.string().optional(),
  url: z.string(),
  providerMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * StepStartUIPart - matches AI SDK's StepStartUIPart
 */
const stepStartPartSchema = z.object({
  type: z.literal('step-start'),
});

/**
 * DynamicToolUIPart - matches AI SDK's DynamicToolUIPart
 * For dynamic tools where type is 'dynamic-tool' and toolName is a separate field
 */
const dynamicToolPartSchema = z
  .object({
    type: z.literal('dynamic-tool'),
    toolName: z.string(),
  })
  .and(toolInvocationSchema);

/**
 * ToolUIPart - matches AI SDK's ToolUIPart<TOOLS>
 * For static tools where type is 'tool-{toolName}'
 * Using a custom refinement since tool names are dynamic
 */
const staticToolPartSchema = z
  .object({
    type: z
      .string()
      .refine((t) => t.startsWith('tool-') && t !== 'tool-invocation', {
        message: "Static tool type must start with 'tool-' prefix",
      }),
  })
  .and(toolInvocationSchema);

/**
 * DataUIPart - matches AI SDK's DataUIPart<DATA_TYPES>
 * For custom data parts where type is 'data-{name}'
 */
const dataPartSchema = z.object({
  type: z.string().refine((t) => t.startsWith('data-'), {
    message: "Data part type must start with 'data-' prefix",
  }),
  id: z.string().optional(),
  data: z.unknown(),
});

/**
 * Message part schema matching AI SDK's UIMessagePart union type
 * Supports all part types from the AI SDK
 */
export const messagePartSchema = z.union([
  // Known literal types (discriminated)
  textPartSchema,
  reasoningPartSchema,
  sourceUrlPartSchema,
  sourceDocumentPartSchema,
  filePartSchema,
  stepStartPartSchema,
  dynamicToolPartSchema,
  // Dynamic prefix types (refined strings)
  staticToolPartSchema,
  dataPartSchema,
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
