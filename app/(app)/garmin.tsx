/**
 * Garmin Integration Page
 *
 * This component handles the entire Garmin Connect integration UI including:
 * - Connection form for Garmin credentials
 * - Display of synced health metrics
 * - Manual refresh functionality
 * - Error handling and loading states
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  ScreenHeader,
  Spinner,
  SuccessMessage,
  Text,
  XStack,
  YStack,
} from '@/components/ui';
import {
  useConnectGarmin,
  useDisconnectGarmin,
  useGarminConnection,
} from '@/lib/hooks/use-garmin';

export default function GarminPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    data: connection,
    isLoading: connectionLoading,
    error: connectionError,
    refetch,
  } = useGarminConnection();
  const connectMutation = useConnectGarmin();
  const disconnectMutation = useDisconnectGarmin();

  const handleConnect = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    try {
      await connectMutation.mutateAsync({
        garminEmail: email,
        garminPassword: password,
      });
      setEmail('');
      setPassword('');
      setShowForm(false);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/(app)/health-stats');
      }, 1500);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to connect Garmin',
      );
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Garmin account?')) {
      try {
        await disconnectMutation.mutateAsync();
        alert('Garmin disconnected successfully');
      } catch (_error) {
        alert('Failed to disconnect Garmin');
      }
    }
  };

  if (connectionLoading) {
    return <LoadingState message="Loading Garmin connection..." />;
  }

  if (connectionError) {
    return (
      <ErrorState
        message="Failed to load Garmin connection"
        onRetry={refetch}
      />
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title="Garmin Connect" />
      <SuccessMessage
        message="Garmin connected successfully!"
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
      />
      <ScrollView style={{ flex: 1 }}>
        <YStack gap="$4" paddingHorizontal="$4" paddingVertical="$4">
          {connection?.connected ? (
            <Card padding="$4">
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="bold">✓ Garmin Connected</Text>
                    <Text opacity={0.7}>{connection.email}</Text>
                  </YStack>
                  <Button
                    size="$3"
                    theme="red"
                    onPress={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending
                      ? 'Disconnecting...'
                      : 'Disconnect'}
                  </Button>
                </XStack>
                <Button onPress={() => router.push('/(app)/health-stats')}>
                  View Health Stats
                </Button>
              </YStack>
            </Card>
          ) : (
            <Card padding="$4">
              <YStack gap="$3">
                <Text>
                  Connect your Garmin account to sync health data including
                  steps, heart rate, sleep, and activities.
                </Text>

                {!showForm ? (
                  <Button onPress={() => setShowForm(true)}>
                    Connect Garmin
                  </Button>
                ) : (
                  <YStack gap="$3">
                    <Input
                      placeholder="Garmin Email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <Input
                      placeholder="Garmin Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    <XStack gap="$2">
                      <Button
                        flex={1}
                        onPress={handleConnect}
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending ? <Spinner /> : 'Connect'}
                      </Button>
                      <Button
                        flex={1}
                        onPress={() => {
                          setShowForm(false);
                          setEmail('');
                          setPassword('');
                        }}
                      >
                        Cancel
                      </Button>
                    </XStack>
                  </YStack>
                )}
              </YStack>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
