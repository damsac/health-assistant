import { getToolName, isToolUIPart } from 'ai';
import { Spinner, Text, XStack, YStack } from '@/components/ui';
import { formatToolArgs, getToolDisplayName } from './formatters';
import type { AnyToolUIPart, MessagePart } from './types';
import { isToolError, isToolPending, isToolSuccess } from './types';

type ToolCallDisplayProps = {
  part: MessagePart;
  isLast: boolean;
};

/**
 * Single tool call display in the thinking process
 */
export function ToolCallDisplay({ part, isLast }: ToolCallDisplayProps) {
  if (!isToolUIPart(part)) return null;

  const toolPart = part as AnyToolUIPart;
  const toolName = getToolDisplayName(getToolName(toolPart));
  const { state, input } = toolPart;

  const isComplete = isToolSuccess(state);
  const hasError = isToolError(state);
  const isPending = isToolPending(state);
  const errorText = hasError ? toolPart.errorText : undefined;

  const statusIcon = isComplete ? '✓' : hasError ? '✗' : isPending ? '◉' : '○';

  return (
    <YStack
      paddingVertical="$2"
      borderBottomWidth={isLast ? 0 : 1}
      borderBottomColor="$color4"
      gap="$1"
    >
      {/* Tool name & status */}
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$1" color={hasError ? '$red9' : '$color9'}>
          {statusIcon}
        </Text>
        <Text fontSize="$2" fontWeight="500" color="$color11">
          {toolName}
        </Text>
        {isPending && <Spinner size="small" color="$color9" />}
      </XStack>

      {/* Tool arguments */}
      {input && (
        <YStack paddingLeft="$4">
          <Text fontSize="$1" color="$color9">
            {formatToolArgs(input)}
          </Text>
        </YStack>
      )}

      {/* Error text */}
      {hasError && errorText && (
        <YStack paddingLeft="$4">
          <Text fontSize="$1" color="$red9">
            {errorText}
          </Text>
        </YStack>
      )}
    </YStack>
  );
}
