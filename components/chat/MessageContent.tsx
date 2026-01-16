import { isToolUIPart } from 'ai';
import { MessageBubble } from './MessageBubble';
import { ThinkingProcess } from './ThinkingProcess';
import {
  getToolApprovalDetails,
  isToolApprovalRequest,
  ToolApprovalCard,
} from './ToolApprovalCard';
import type { MessagePart, MessageRole } from './types';

type MessageContentProps = {
  role: MessageRole;
  parts: MessagePart[];
  getMessageText: (parts: MessagePart[]) => string;
  isStreaming?: boolean;
  onApprove?: (approvalId: string) => void;
  onReject?: (approvalId: string) => void;
};

/**
 * Renders a complete message with text and tool invocations
 */
export function MessageContent({
  role,
  parts,
  getMessageText,
  isStreaming,
  onApprove,
  onReject,
}: MessageContentProps) {
  const textContent = getMessageText(parts);
  const toolParts = parts.filter(isToolUIPart);
  const approvalParts = toolParts.filter(isToolApprovalRequest);

  return (
    <>
      {/* Thinking process (collapsible tool calls) */}
      {toolParts.length > 0 && role === 'assistant' && (
        <ThinkingProcess toolParts={toolParts} isStreaming={isStreaming} />
      )}

      {/* Text content */}
      {textContent && <MessageBubble role={role} content={textContent} />}

      {/* Tool approval requests */}
      {approvalParts.map((part) => {
        const details = getToolApprovalDetails(part);
        if (!details || !onApprove || !onReject) return null;

        return (
          <ToolApprovalCard
            key={details.approvalId}
            approvalId={details.approvalId}
            toolName={details.toolName}
            args={details.args}
            onApprove={onApprove}
            onReject={onReject}
          />
        );
      })}
    </>
  );
}
