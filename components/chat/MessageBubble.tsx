import { Text, XStack, YStack } from '@/components/ui';
import type { MessageRole } from './types';

type MessageBubbleProps = {
  role: MessageRole;
  content: string;
};

/**
 * Chat bubble for displaying message text
 */
export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  // Don't render empty assistant messages (can happen when only tool calls)
  if (!content && role === 'assistant') {
    return null;
  }

  return (
    <XStack
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
      paddingHorizontal="$3"
      marginVertical="$1"
    >
      <YStack
        backgroundColor={isUser ? '$blue9' : '$color4'}
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$4"
        maxWidth="80%"
      >
        <Text color={isUser ? 'white' : '$color12'} fontSize="$3">
          {content}
        </Text>
      </YStack>
    </XStack>
  );
}
