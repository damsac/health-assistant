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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  H1,
  Input,
  Spinner,
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: connection, isLoading: connectionLoading } =
    useGarminConnection();
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
      alert(
        'Garmin connected successfully! Redirecting to your health stats...',
      );
      router.push('/(app)/health-stats' as any);
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
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 16,
      }}
    >
      <YStack gap="$4" paddingVertical="$4">
        <H1>Garmin Connect</H1>

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
              <Button onPress={() => router.push('/(app)/health-stats' as any)}>
                View Health Stats
              </Button>
            </YStack>
          </Card>
        ) : (
          <Card padding="$4">
            <YStack gap="$3">
              <Text>
                Connect your Garmin account to sync health data including steps,
                heart rate, sleep, and activities.
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
  );
}
