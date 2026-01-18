import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, H1, Text, XStack, YStack } from '@/components/ui';
import { useSession, useSignOut } from '@/lib/hooks/use-auth';
import { useProfile } from '@/lib/hooks/use-profile';
import { SECTIONS_CONFIG } from '@/lib/profile-sections-config';
import { isSectionComplete } from '@/lib/profile-utils';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const signOut = useSignOut();

  const user = session?.user;
  const completionPercentage = profile?.profileCompletionPercentage || 0;

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.replace('/(auth)/sign-in');
    } catch {
      // handled by mutation
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <YStack
        flex={1}
        paddingTop={insets.top + 20}
        paddingBottom={insets.bottom + 20}
        paddingHorizontal="$4"
        gap="$5"
      >
        <H1>Profile</H1>

        {/* User Info */}
        <XStack gap="$4" alignItems="center">
          <YStack
            width={60}
            height={60}
            backgroundColor="$color4"
            borderRadius={30}
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={28}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </YStack>
          <YStack flex={1} gap="$1">
            <Text fontSize="$5" fontWeight="600">
              {user?.name || 'User'}
            </Text>
            <Text color="$color10" fontSize="$3">
              {user?.email || ''}
            </Text>
            <Text color="$color10" fontSize="$2">
              {completionPercentage}% profile complete
            </Text>
          </YStack>
        </XStack>

        {/* Progress Bar */}
        <YStack gap="$2">
          <YStack
            height={8}
            backgroundColor="$color4"
            borderRadius={4}
            overflow="hidden"
          >
            <YStack
              height={8}
              backgroundColor="$blue9"
              width={`${completionPercentage}%`}
              borderRadius={4}
            />
          </YStack>
        </YStack>

        {/* Profile Sections */}
        <YStack gap="$3">
          <Text fontSize="$4" fontWeight="600">
            Your Profile
          </Text>
          {SECTIONS_CONFIG.map((section) => {
            const isComplete = profile
              ? isSectionComplete(
                  profile as Record<string, unknown>,
                  section.key,
                )
              : false;

            return (
              <Button
                key={section.key}
                variant="outlined"
                justifyContent="flex-start"
                onPress={() => router.push(section.route as never)}
              >
                <XStack flex={1} alignItems="center" gap="$3">
                  <Text fontSize="$6">{section.icon}</Text>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$4" fontWeight="500">
                      {section.title}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      {section.benefit}
                    </Text>
                  </YStack>
                  <Text
                    fontSize="$4"
                    color={isComplete ? '$green10' : '$color10'}
                  >
                    {isComplete ? 'Done' : '>'}
                  </Text>
                </XStack>
              </Button>
            );
          })}
        </YStack>

        {/* Edit Profile Button */}
        <Button onPress={() => router.push('/(app)/edit-profile')}>
          Edit Basic Info
        </Button>

        {/* Settings Section */}
        <YStack gap="$3" marginTop="$2">
          <Text fontSize="$4" fontWeight="600">
            Settings
          </Text>
          <Button
            variant="outlined"
            onPress={handleSignOut}
            disabled={signOut.isPending}
          >
            {signOut.isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
