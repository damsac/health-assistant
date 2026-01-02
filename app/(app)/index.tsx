import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, H1, H2, Text, YStack } from '@/components/ui';
import { useSession, useSignOut } from '@/lib/hooks/use-auth';
import { useProfile } from '@/lib/hooks/use-profile';
import {
  calculateAge,
  cmToFeetInches,
  gramsToKg,
  kgToLbs,
  type MeasurementSystem,
} from '@/lib/units';

function formatHeight(
  heightCm: number | null,
  system: MeasurementSystem,
): string {
  if (!heightCm) return '-';
  if (system === 'imperial') {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}'${inches}"`;
  }
  return `${heightCm} cm`;
}

function formatWeight(
  weightGrams: number | null,
  system: MeasurementSystem,
): string {
  if (!weightGrams) return '-';
  const kg = gramsToKg(weightGrams);
  if (system === 'imperial') {
    return `${kgToLbs(kg)} lbs`;
  }
  return `${kg} kg`;
}

export default function HomeScreen() {
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const signOut = useSignOut();
  const insets = useSafeAreaInsets();

  const user = session?.user;
  const measurementSystem =
    (profile?.measurementSystem as MeasurementSystem) || 'metric';

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.replace('/(auth)/sign-in');
    } catch {
      // handled by mutation
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <YStack
        flex={1}
        paddingTop={insets.top + 20}
        paddingBottom={insets.bottom}
        paddingHorizontal="$4"
        gap="$4"
      >
        <H1>Home</H1>

        <YStack gap="$2">
          <H2>User</H2>
          <Text>Name: {user?.name || '-'}</Text>
          <Text>Email: {user?.email || '-'}</Text>
        </YStack>

        <YStack gap="$2">
          <Button onPress={() => router.push('/(app)/chat')}>
            Health Chat
          </Button>
        </YStack>

        <YStack gap="$2">
          <H2>Profile</H2>
          {profile ? (
            <YStack gap="$1">
              <Text>
                Height: {formatHeight(profile.heightCm, measurementSystem)}
              </Text>
              <Text>
                Weight: {formatWeight(profile.weightGrams, measurementSystem)}
              </Text>
              <Text>Gender: {profile.gender || '-'}</Text>
              <Text>
                Age:{' '}
                {profile.dateOfBirth
                  ? calculateAge(new Date(profile.dateOfBirth))
                  : '-'}
              </Text>
              <Text>
                Dietary Preferences:{' '}
                {profile.dietaryPreferences?.join(', ') || '-'}
              </Text>
            </YStack>
          ) : (
            <Text>Loading profile...</Text>
          )}
          <Button onPress={() => router.push('/(app)/edit-profile')}>
            Edit Profile
          </Button>
        </YStack>

        <YStack paddingVertical="$4">
          <Button onPress={handleSignOut} disabled={signOut.isPending}>
            {signOut.isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
