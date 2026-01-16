import { Button, Text, YStack } from '@/components/ui';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: ErrorStateProps) {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      gap="$4"
      paddingHorizontal="$4"
    >
      <Text fontSize="$8">⚠️</Text>
      <Text color="$red10" textAlign="center" fontSize="$5" fontWeight="600">
        {message}
      </Text>
      {onRetry && (
        <Button onPress={onRetry} theme="blue">
          Try Again
        </Button>
      )}
    </YStack>
  );
}
