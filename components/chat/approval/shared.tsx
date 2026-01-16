import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';

// ============================================================================
// Types
// ============================================================================

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

// ============================================================================
// Shared Components
// ============================================================================

type ApprovalCardContainerProps = {
  status: ApprovalStatus;
  children: React.ReactNode;
};

export function ApprovalCardContainer({
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

export function ApprovalActions({
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

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'pending') return null;

  return (
    <Text fontSize="$2" color={status === 'approved' ? '$green10' : '$red10'}>
      {status === 'approved' ? 'Confirmed' : 'Cancelled'}
    </Text>
  );
}
