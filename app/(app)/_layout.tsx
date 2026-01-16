import { Redirect, Stack, useSegments } from 'expo-router';
import { Suspense } from 'react';
import { YStack } from 'tamagui';
import { LoadingState, TabBar } from '@/components/ui';
import { useAuth } from '@/lib/hooks/use-auth';
import { useProfile } from '@/lib/hooks/use-profile';

function LoadingScreen() {
  return <LoadingState />;
}

function ProfileAwareStack() {
  const { data: profile, isLoading } = useProfile();
  const segments = useSegments();
  const isOnOnboarding = segments.includes('onboarding' as never);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!profile && !isOnOnboarding) {
    return <Redirect href="/(app)/onboarding" />;
  }

  if (profile && isOnOnboarding) {
    return <Redirect href="/(app)" />;
  }

  const showTabBar = !isOnOnboarding;

  return (
    <YStack flex={1}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="health-stats" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="garmin" />
        <Stack.Screen name="(profile)" />
      </Stack>
      {showTabBar && <TabBar />}
    </YStack>
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
