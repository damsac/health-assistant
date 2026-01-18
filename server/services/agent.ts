import {
  convertToModelMessages,
  type StreamTextResult,
  stepCountIs,
  streamText,
  type ToolSet,
  type UIMessage,
} from 'ai';
import {
  healthConsultantAgent,
  type UserProfileContext,
} from '../agents/health-consultant';

type AgentInput = {
  messages: UIMessage[];
  profileContext: UserProfileContext;
  tools?: ToolSet;
  onFinish?: (result: { text: string }) => void | Promise<void>;
};

type AgentStreamResult = StreamTextResult<ToolSet, never>;

/**
 * Invoke the health consultant agent with streaming response
 */
export async function invokeAgent(
  input: AgentInput,
): Promise<AgentStreamResult> {
  const { messages, profileContext, tools, onFinish } = input;

  // Convert UIMessage format to model message format
  const modelMessages = await convertToModelMessages(messages);

  return streamText({
    model: healthConsultantAgent.model,
    system: healthConsultantAgent.getSystemPrompt(profileContext),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    onFinish,
  });
}
