import { isToolUIPart } from 'ai';
import { useState } from 'react';
import { LayoutAnimation, Pressable } from 'react-native';
import { Text, XStack, YStack } from '@/components/ui';
import { isToolApprovalRequest } from './ToolApprovalCard';
import { ToolCallDisplay } from './ToolCallDisplay';
import type { AnyToolUIPart, MessagePart } from './types';
import { isToolCompleted } from './types';

type ThinkingProcessProps = {
  toolParts: MessagePart[];
  isStreaming?: boolean;
};

/**
 * Collapsible display for tool calls / chain-of-thought
 */
export function ThinkingProcess({
  toolParts,
  isStreaming,
}: ThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out approval requests - they get their own card
  const thinkingParts = toolParts.filter((p) => !isToolApprovalRequest(p));

  if (thinkingParts.length === 0) return null;

  const { completedCount, totalCount } = countToolProgress(thinkingParts);
  const allComplete = completedCount === totalCount && !isStreaming;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <YStack
      marginHorizontal="$3"
      marginVertical="$1"
      backgroundColor="$color2"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$color4"
      overflow="hidden"
    >
      {/* Header */}
      <Pressable onPress={toggleExpanded}>
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$2"
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$2" color="$color10">
              {getStatusEmoji(isStreaming, allComplete)}
            </Text>
            <Text fontSize="$2" color="$color10">
              {getStatusText(
                isStreaming,
                allComplete,
                completedCount,
                totalCount,
              )}
            </Text>
          </XStack>
          <Text fontSize="$2" color="$color9">
            {isExpanded ? '▼' : '▶'}
          </Text>
        </XStack>
      </Pressable>

      {/* Expanded content */}
      {isExpanded && (
        <YStack
          paddingHorizontal="$3"
          paddingBottom="$2"
          borderTopWidth={1}
          borderTopColor="$color4"
        >
          {thinkingParts.map((part, index) => {
            if (!isToolUIPart(part)) return null;
            const toolPart = part as AnyToolUIPart;
            return (
              <ToolCallDisplay
                key={toolPart.toolCallId ?? index}
                part={part}
                isLast={index === thinkingParts.length - 1}
              />
            );
          })}
        </YStack>
      )}
    </YStack>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function countToolProgress(parts: MessagePart[]): {
  completedCount: number;
  totalCount: number;
} {
  const completedCount = parts.filter((p) => {
    if (!isToolUIPart(p)) return false;
    return isToolCompleted((p as AnyToolUIPart).state);
  }).length;

  return { completedCount, totalCount: parts.length };
}

function getStatusEmoji(isStreaming?: boolean, allComplete?: boolean): string {
  if (isStreaming) return '🔄';
  if (allComplete) return '💭';
  return '⏳';
}

function getStatusText(
  isStreaming: boolean | undefined,
  allComplete: boolean,
  completed: number,
  total: number,
): string {
  if (isStreaming) return 'Thinking...';
  if (allComplete) return `Used ${total} tool${total > 1 ? 's' : ''}`;
  return `Processing (${completed}/${total})`;
}
