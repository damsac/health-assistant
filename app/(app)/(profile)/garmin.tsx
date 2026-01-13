import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import { usePartialProfileUpdate } from '@/lib/hooks/use-partial-profile-update';
import { useProfile } from '@/lib/hooks/use-profile';
import { useUpdateProfileSection } from '@/lib/hooks/use-update-profile-section';

export default function GarminConnectionScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const updateProfile = usePartialProfileUpdate();
  const updateSection = useUpdateProfileSection();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = profile?.garminConnected || false;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // TODO: Implement actual OAuth flow
      // For now, just mark as connected in the database
      await updateProfile.mutateAsync({
        garminConnected: true,
        garminUserId: 'temp-user-id', // Will be replaced with actual Garmin user ID
      });

      // Mark section as complete
      await updateSection.mutateAsync({
        sectionKey: 'garmin',
        completed: true,
      });

      // Show success message
      alert('Garmin connected successfully!');
      router.back();
    } catch (error) {
      console.error('Error connecting Garmin:', error);
      alert('Failed to connect Garmin. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await updateProfile.mutateAsync({
        garminConnected: false,
        garminUserId: null,
      });

      // Mark section as incomplete
      await updateSection.mutateAsync({
        sectionKey: 'garmin',
        completed: false,
      });

      alert('Garmin disconnected successfully.');
      router.back();
    } catch (error) {
      console.error('Error disconnecting Garmin:', error);
      alert('Failed to disconnect Garmin. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSkip = () => {
    router.back();
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
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Button onPress={handleSkip}>Skip</Button>
          <Text fontSize="$5" fontWeight="bold">
            Connect Garmin
          </Text>
          <YStack width={60} />
        </XStack>

        {/* Content */}
        <YStack gap="$6">
          {!isConnected ? (
            <>
              {/* Explanation */}
              <YStack gap="$4">
                <YStack gap="$2">
                  <Text fontSize="$4" fontWeight="600">
                    Why connect Garmin?
                  </Text>
                  <Text fontSize="$3" color="gray">
                    Get real-time health insights and personalized
                    recommendations based on your actual health data.
                  </Text>
                </YStack>

                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="500">
                    What we'll sync:
                  </Text>
                  <YStack gap="$1" paddingLeft="$4">
                    <Text fontSize="$2" color="gray">
                      • Daily steps and activity
                    </Text>
                    <Text fontSize="$2" color="gray">
                      • Heart rate and sleep data
                    </Text>
                    <Text fontSize="$2" color="gray">
                      • Stress levels and Body Battery
                    </Text>
                    <Text fontSize="$2" color="gray">
                      • Workouts and training
                    </Text>
                    <Text fontSize="$2" color="gray">
                      • Weight and body composition
                    </Text>
                  </YStack>
                </YStack>

                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="500">
                    Privacy & Security:
                  </Text>
                  <YStack gap="$1" paddingLeft="$4">
                    <Text fontSize="$2" color="gray">
                      • 🔒 Your data is encrypted and secure
                    </Text>
                    <Text fontSize="$2" color="gray">
                      • 👤 You control what's shared
                    </Text>
                    <Text fontSize="$2" color="gray">
                      • 🚫 We never sell your data
                    </Text>
                    <Text fontSize="$2" color="gray">
                      • ⚙️ Disconnect anytime
                    </Text>
                  </YStack>
                </YStack>
              </YStack>

              {/* Connect Button */}
              <Button size="$5" onPress={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <XStack gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Connecting...</Text>
                  </XStack>
                ) : (
                  'Connect Garmin Account'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Connected State */}
              <YStack gap="$4" alignItems="center" paddingVertical="$6">
                <Text fontSize="$6">⌚</Text>
                <Text fontSize="$5" fontWeight="600">
                  Garmin Connected
                </Text>
                <Text fontSize="$3" color="gray" textAlign="center">
                  Your Garmin device is syncing data with Health Assistant
                </Text>
                <Text fontSize="$2" color="gray">
                  User ID: {profile?.garminUserId}
                </Text>
              </YStack>

              {/* Disconnect Button */}
              <Button
                variant="outlined"
                onPress={handleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <XStack gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Disconnecting...</Text>
                  </XStack>
                ) : (
                  'Disconnect Garmin'
                )}
              </Button>
            </>
          )}

          {/* Help Text */}
          <YStack gap="$2">
            <Text fontSize="$2" color="gray" textAlign="center">
              Need help? Contact support@healthassistant.com
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
