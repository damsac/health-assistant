import { Text, XStack } from '@/components/ui';
import { getToolDisplayName } from '../formatters';
import {
  ApprovalActions,
  ApprovalCardContainer,
  type ApprovalStatus,
  StatusBadge,
} from './shared';

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

export function GenericToolCard({
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
