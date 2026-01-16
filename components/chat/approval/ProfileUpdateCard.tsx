import { Text, XStack, YStack } from '@/components/ui';
import type { DisplayChange } from '../formatters';
import {
  ApprovalActions,
  ApprovalCardContainer,
  type ApprovalStatus,
  StatusBadge,
} from './shared';

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

export function ProfileUpdateCard({
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
