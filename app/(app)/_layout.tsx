import { Redirect, Stack, useSegments } from 'expo-router';
import { Suspense } from 'react';
import { LoadingState } from '@/components/ui';
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
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="(profile)" />
      <Stack.Screen name="garmin" />
      <Stack.Screen name="health-stats" />
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
