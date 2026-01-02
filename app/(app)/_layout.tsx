import { Redirect, Stack, useSegments } from 'expo-router';
import { Suspense } from 'react';
import { Spinner, Text, YStack } from 'tamagui';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSuspenseProfile } from '@/lib/hooks/use-profile';

function LoadingScreen() {
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

function ProfileAwareStack() {
  const { data: profile } = useSuspenseProfile();
  const segments = useSegments();
  const isOnOnboarding = segments.includes('onboarding' as never);

  if (!profile && !isOnOnboarding) {
    return <Redirect href="/(app)/onboarding" />;
  }

  if (profile && isOnOnboarding) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProfileAwareStack />
    </Suspense>
  );
}
