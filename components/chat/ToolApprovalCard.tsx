import { getToolName, isToolUIPart } from 'ai';
import { useState } from 'react';
import { GenericToolCard } from './approval/GenericToolCard';
import { GoalsCard } from './approval/GoalsCard';
import { ProfileUpdateCard } from './approval/ProfileUpdateCard';
import type { ApprovalStatus } from './approval/shared';
import { buildProfileChanges, formatGoalAction } from './formatters';
import type { AnyToolUIPart, MessagePart } from './types';
import { isToolAwaitingApproval } from './types';

// ============================================================================
// Types
// ============================================================================

type ToolApprovalCardProps = {
  approvalId: string;
  toolName: string;
  args: unknown;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Card that displays a tool approval request and allows user to confirm or deny
 */
export function ToolApprovalCard({
  approvalId,
  toolName,
  args,
  onApprove,
  onReject,
}: ToolApprovalCardProps) {
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = () => {
    setIsLoading(true);
    try {
      onApprove(approvalId);
      setStatus('approved');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    setIsLoading(true);
    try {
      onReject(approvalId);
      setStatus('denied');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile update gets a specialized display
  if (toolName === 'proposeProfileUpdate') {
    const changes = buildProfileChanges(args);
    return (
      <ProfileUpdateCard
        status={status}
        changes={changes}
        isLoading={isLoading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  // Goals management gets a specialized display
  if (toolName === 'manageGoals') {
    const goalInfo = formatGoalAction(args);
    return (
      <GoalsCard
        status={status}
        goalInfo={goalInfo}
        isLoading={isLoading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  // Generic fallback for unknown tool types
  return (
    <GenericToolCard
      toolName={toolName}
      args={args}
      status={status}
      isLoading={isLoading}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}

// ============================================================================
// Type Guards & Helpers
// ============================================================================

/**
 * Type guard to check if a part is a tool UI part
 */
export function isToolPart(part: MessagePart): part is AnyToolUIPart {
  return isToolUIPart(part);
}

/**
 * Check if a tool part is in the approval-requested state
 */
export function isToolApprovalRequest(part: MessagePart): boolean {
  if (!isToolUIPart(part)) return false;
  return isToolAwaitingApproval(part.state);
}

/**
 * Extract approval details from a tool part in approval-requested state
 */
export function getToolApprovalDetails(
  part: MessagePart,
): { approvalId: string; toolName: string; args: unknown } | null {
  if (!isToolUIPart(part)) return null;

  const toolPart = part as AnyToolUIPart;

  if (toolPart.state === 'approval-requested' && toolPart.approval?.id) {
    return {
      approvalId: toolPart.approval.id,
      toolName: getToolName(toolPart),
      args: toolPart.input,
    };
  }

  return null;
}
