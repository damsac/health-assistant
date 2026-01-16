import { getToolName, isToolUIPart } from 'ai';
import { useState } from 'react';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import {
  buildProfileChanges,
  type DisplayChange,
  getToolDisplayName,
} from './formatters';
import type { AnyToolUIPart, MessagePart } from './types';
import { isToolAwaitingApproval } from './types';

// ============================================================================
// Types
// ============================================================================

type ApprovalStatus = 'pending' | 'approved' | 'denied';

type ToolApprovalCardProps = {
  approvalId: string;
  toolName: string;
  args: unknown;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

// ============================================================================
// Shared Components
// ============================================================================

type ApprovalCardContainerProps = {
  status: ApprovalStatus;
  children: React.ReactNode;
};

function ApprovalCardContainer({
  status,
  children,
}: ApprovalCardContainerProps) {
  const borderColor =
    status === 'approved'
      ? '$green8'
      : status === 'denied'
        ? '$red8'
        : '$color6';

  return (
    <YStack
      backgroundColor="$color2"
      borderRadius="$4"
      padding="$3"
      marginVertical="$2"
      marginHorizontal="$3"
      borderWidth={1}
      borderColor={borderColor}
      gap="$2"
    >
      {children}
    </YStack>
  );
}

type ApprovalActionsProps = {
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
};

function ApprovalActions({
  isLoading,
  onApprove,
  onReject,
}: ApprovalActionsProps) {
  return (
    <XStack gap="$2" paddingTop="$2">
      <Button
        flex={1}
        backgroundColor="$green9"
        onPress={onApprove}
        disabled={isLoading}
        paddingVertical="$2"
        borderRadius="$3"
      >
        {isLoading ? (
          <Spinner size="small" color="white" />
        ) : (
          <Text color="white" fontWeight="600" fontSize="$2">
            Confirm
          </Text>
        )}
      </Button>
      <Button
        flex={1}
        backgroundColor="$color5"
        onPress={onReject}
        disabled={isLoading}
        paddingVertical="$2"
        borderRadius="$3"
      >
        <Text color="$color11" fontWeight="500" fontSize="$2">
          Cancel
        </Text>
      </Button>
    </XStack>
  );
}

type StatusBadgeProps = {
  status: ApprovalStatus;
};

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'pending') return null;

  return (
    <Text fontSize="$2" color={status === 'approved' ? '$green10' : '$red10'}>
      {status === 'approved' ? 'Confirmed' : 'Cancelled'}
    </Text>
  );
}

// ============================================================================
// Profile Update Card
// ============================================================================

type ProfileUpdateCardProps = {
  status: ApprovalStatus;
  changes: DisplayChange[];
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
};

function ProfileUpdateCard({
  status,
  changes,
  isLoading,
  onApprove,
  onReject,
}: ProfileUpdateCardProps) {
  return (
    <ApprovalCardContainer status={status}>
      {/* Header */}
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Update Profile
        </Text>
        <StatusBadge status={status} />
      </XStack>

      {/* Changes list */}
      <YStack gap="$1" paddingVertical="$1">
        {changes.map((change) => (
          <XStack key={change.label} alignItems="center" gap="$2">
            <Text fontSize="$2" color="$color10" width={120}>
              {change.label}:
            </Text>
            <Text fontSize="$2" color="$color12" fontWeight="500">
              {change.value}
            </Text>
          </XStack>
        ))}
      </YStack>

      {/* Actions */}
      {status === 'pending' && (
        <ApprovalActions
          isLoading={isLoading}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </ApprovalCardContainer>
  );
}

// ============================================================================
// Generic Tool Card
// ============================================================================

type GenericToolCardProps = {
  toolName: string;
  args: unknown;
  status: ApprovalStatus;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
};

function GenericToolCard({
  toolName,
  args,
  status,
  isLoading,
  onApprove,
  onReject,
}: GenericToolCardProps) {
  return (
    <ApprovalCardContainer status={status}>
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Confirm: {getToolDisplayName(toolName)}
        </Text>
        <StatusBadge status={status} />
      </XStack>

      <Text fontSize="$2" color="$color11">
        {JSON.stringify(args, null, 2)}
      </Text>

      {status === 'pending' && (
        <ApprovalActions
          isLoading={isLoading}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </ApprovalCardContainer>
  );
}

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
