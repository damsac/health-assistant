import { Redirect, Stack } from 'expo-router';
import { Spinner, Text, YStack } from 'tamagui';
import { useAuth } from '@/lib/hooks/use-auth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
      >
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$4" color="$color11">
          Loading...
        </Text>
      </YStack>
    );
  }

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
