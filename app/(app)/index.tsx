import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  H1,
  H2,
  Spinner,
  Text,
  XStack,
  YStack,
} from '@/components/ui';
import { useSession, useSignOut } from '@/lib/hooks/use-auth';

export default function HomeScreen() {
  const { data: session } = useSession();
  const signOut = useSignOut();
  const insets = useSafeAreaInsets();

  const user = session?.user;

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingHorizontal="$4"
    >
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Card elevate bordered padding="$4" width="100%" maxWidth={400}>
          <YStack gap="$4" alignItems="center">
            <YStack alignItems="center" gap="$2">
              <H1>Welcome!</H1>
              <Text>You're signed in</Text>
            </YStack>

            <YStack gap="$2" alignItems="center">
              <Text>Signed in as</Text>
              <H2>{user?.name || 'User'}</H2>
              <Text>{user?.email}</Text>
            </YStack>

            <Button
              onPress={handleSignOut}
              disabled={signOut.isPending}
              width="100%"
            >
              {signOut.isPending ? (
                <XStack gap="$2" alignItems="center">
                  <Spinner size="small" />
                  <Text>Signing out...</Text>
                </XStack>
              ) : (
                'Sign Out'
              )}
            </Button>
          </YStack>
        </Card>
      </YStack>
    </YStack>
  );
}
