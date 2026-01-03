import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import {
  type ConversationResponse,
  type ConversationWithMessagesResponse,
  createConversationSchema,
  getTextFromParts,
} from '../../lib/api/conversation';
import { db, userProfile } from '../../lib/db';
import {
  healthConsultantAgent,
  type UserProfileContext,
} from '../agents/health-consultant';
import { type AuthEnv, authMiddleware } from '../middleware/auth';
import { conversationService } from '../services/conversation';
import { writeCostEstimate } from '../utils/stream-cost';

type ChatRequest = {
  conversationId?: string;
  messages: UIMessage[];
};

const chat = new Hono<AuthEnv>();

chat.use('*', authMiddleware);

// List all conversations for the user
chat.get('/conversations', async (c) => {
  const session = c.get('session');
  const conversations = await conversationService.listByUser(session.user.id);
  return c.json<ConversationResponse[]>(conversations);
});

// Create a new conversation
chat.post('/conversations', async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  const parsed = createConversationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: 'Invalid request', details: parsed.error.format() },
      400,
    );
  }

  const newConversation = await conversationService.create({
    userId: session.user.id,
    title: parsed.data.title,
  });

  return c.json<ConversationResponse>(newConversation, 201);
});

// Get a single conversation with messages
chat.get('/conversations/:id', async (c) => {
  const session = c.get('session');
  const conversationId = c.req.param('id');

  const conversation = await conversationService.getWithMessages(
    conversationId,
    session.user.id,
  );

  if (!conversation) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  return c.json<ConversationWithMessagesResponse>(conversation);
});

// Delete a conversation
chat.delete('/conversations/:id', async (c) => {
  const session = c.get('session');
  const conversationId = c.req.param('id');

  const deleted = await conversationService.delete(
    conversationId,
    session.user.id,
  );

  if (!deleted) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  return c.json({ success: true });
});

// Send a message and get AI response (streaming)
chat.post('/', async (c) => {
  const session = c.get('session');
  const body = await c.req.json<ChatRequest>();

  if (!body.messages || !Array.isArray(body.messages)) {
    return c.json({ error: 'Invalid request: messages array required' }, 400);
  }

  // Resolve or create conversation
  const conversationId = await resolveConversationId(
    body.conversationId,
    session.user.id,
    body.messages,
  );

  if (!conversationId) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  // Save user message (last message in array is the new one)
  const lastMessage = body.messages[body.messages.length - 1];
  if (lastMessage?.role === 'user') {
    await conversationService.addMessage({
      conversationId,
      role: 'user',
      parts: lastMessage.parts as Array<{ type: 'text'; text: string }>,
    });
  }

  // Update conversation timestamp
  await conversationService.touch(conversationId);

  // Fetch user profile for context
  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id),
  });

  const profileContext: UserProfileContext = {
    userName: session.user.name,
    heightCm: profile?.heightCm,
    weightGrams: profile?.weightGrams,
    gender: profile?.gender,
    dietaryPreferences: profile?.dietaryPreferences,
    dateOfBirth: profile?.dateOfBirth,
    measurementSystem: profile?.measurementSystem,
  };

  // Convert UIMessage format to model message format
  const modelMessages = await convertToModelMessages(body.messages);

  const result = streamText({
    model: healthConsultantAgent.model,
    system: healthConsultantAgent.getSystemPrompt(profileContext),
    messages: modelMessages,
    async onFinish({ text }) {
      // Save assistant response
      await conversationService.addMessage({
        conversationId,
        role: 'assistant',
        parts: [{ type: 'text', text }],
      });
    },
  });

  // Create UI message stream that includes usage data
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(result.toUIMessageStream());
      await writeCostEstimate(writer, result, conversationId);
    },
  });

  return createUIMessageStreamResponse({ stream });
});

/**
 * Resolve conversation ID - verify existing or create new
 * Returns null if existing conversation not found/not owned
 */
async function resolveConversationId(
  existingId: string | undefined,
  userId: string,
  messages: UIMessage[],
): Promise<string | null> {
  if (existingId) {
    const existing = await conversationService.getByIdForUser(
      existingId,
      userId,
    );
    return existing?.id ?? null;
  }

  // Create new conversation with auto-generated title
  const firstUserMessage = messages.find((m) => m.role === 'user');
  const titleText = firstUserMessage?.parts
    ? getTextFromParts(
        firstUserMessage.parts as Array<{ type: string; text?: string }>,
      )
    : undefined;

  const newConversation = await conversationService.createWithAutoTitle(
    userId,
    titleText,
  );
  return newConversation.id;
}

export { chat as chatRoute };
