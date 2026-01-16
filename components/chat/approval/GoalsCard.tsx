import { Text, XStack, YStack } from '@/components/ui';
import type { GoalDisplayInfo } from '../formatters';
import {
  ApprovalActions,
  ApprovalCardContainer,
  type ApprovalStatus,
  StatusBadge,
} from './shared';

// ============================================================================
// Goals Card
// ============================================================================

type GoalsCardProps = {
  status: ApprovalStatus;
  goalInfo: GoalDisplayInfo;
  isLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
};

export function GoalsCard({
  status,
  goalInfo,
  isLoading,
  onApprove,
  onReject,
}: GoalsCardProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      default:
        return '🎯';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete':
        return '$red10';
      case 'create':
        return '$green10';
      case 'update':
        return '$blue10';
      default:
        return '$color12';
    }
  };

  return (
    <ApprovalCardContainer status={status}>
      {/* Header */}
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$3">{getActionIcon(goalInfo.action)}</Text>
        <Text
          fontSize="$3"
          fontWeight="600"
          color={getActionColor(goalInfo.action)}
        >
          {goalInfo.actionLabel}
        </Text>
        <StatusBadge status={status} />
      </XStack>

      {/* Details list */}
      {goalInfo.details.length > 0 && (
        <YStack gap="$1" paddingVertical="$1">
          {goalInfo.details.map((detail, index) => (
            <YStack key={`${detail.label}-${index}`} gap="$1">
              <Text fontSize="$2" color="$color10" fontWeight="500">
                {detail.label}:
              </Text>
              <Text fontSize="$2" color="$color12" paddingLeft="$2">
                {detail.value}
              </Text>
            </YStack>
          ))}
        </YStack>
      )}

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
