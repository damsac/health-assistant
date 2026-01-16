import type { UIMessage } from 'ai';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import {
  type ConversationResponse,
  type ConversationWithMessagesResponse,
  createConversationSchema,
  getTextFromParts,
} from '../../lib/api/conversation';
import { db, userProfile } from '../../lib/db';
import { getActionTools } from '../actions';
import type { UserProfileContext } from '../agents/health-consultant';
import { type AuthEnv, authMiddleware } from '../middleware/auth';
import { invokeAgent } from '../services/agent';
import { conversationService } from '../services/conversation';
import { getLatestHealthData } from '../services/health-data';

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

  // Fetch latest health data from Garmin
  const healthData = await getLatestHealthData(session.user.id);

  const profileContext: UserProfileContext = {
    userName: session.user.name,
    heightCm: profile?.heightCm,
    weightGrams: profile?.weightGrams,
    gender: profile?.gender,
    dietaryPreferences: profile?.dietaryPreferences,
    dateOfBirth: profile?.dateOfBirth,
    measurementSystem: profile?.measurementSystem,
    healthData,
    // New profile fields
    sleepHoursAverage: profile?.sleepHoursAverage,
    sleepQuality: profile?.sleepQuality,
    typicalWakeTime: profile?.typicalWakeTime,
    typicalBedTime: profile?.typicalBedTime,
    mealsPerDay: profile?.mealsPerDay,
    typicalMealTimes: profile?.typicalMealTimes,
    snackingHabits: profile?.snackingHabits,
    supplementsMedications: profile?.supplementsMedications,
    healthConditions: profile?.healthConditions,
    stressLevel: profile?.stressLevel,
    exerciseFrequency: profile?.exerciseFrequency,
    exerciseTypes: profile?.exerciseTypes,
    waterIntakeLiters: profile?.waterIntakeLiters,
    garminConnected: profile?.garminConnected,
  };

  // Get action tools bound to user context
  const tools = getActionTools({
    userId: session.user.id,
    conversationId,
  });

  // Invoke the agent
  const result = await invokeAgent({
    messages: body.messages,
    profileContext,
    tools,
    onFinish: async ({ text }) => {
      // Save assistant response (only if there's text content)
      if (text) {
        await conversationService.addMessage({
          conversationId,
          role: 'assistant',
          parts: [{ type: 'text', text }],
        });
      }
    },
  });

  // Use UI message stream response to include tool results
  const response = result.toUIMessageStreamResponse();
  response.headers.set('X-Conversation-Id', conversationId);

  return response;
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
