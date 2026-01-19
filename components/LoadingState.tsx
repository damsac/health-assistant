import { Spinner, Text, YStack } from '@/components/ui';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
      <Spinner size="large" color="$blue10" />
      <Text color="$color11">{message}</Text>
    </YStack>
  );
}
