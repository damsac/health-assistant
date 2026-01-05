import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  H1,
  H2,
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
  useLatestHealthMetrics,
  useSyncGarmin,
} from '@/lib/hooks/use-garmin';

export default function GarminPage() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: connection, isLoading: connectionLoading } =
    useGarminConnection();
  const { data: latestMetrics, isLoading: metricsLoading } =
    useLatestHealthMetrics();
  const connectMutation = useConnectGarmin();
  const disconnectMutation = useDisconnectGarmin();
  const syncMutation = useSyncGarmin();

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
      alert('Garmin connected successfully! Data sync started in background.');
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

  const handleRefresh = async () => {
    try {
      await syncMutation.mutateAsync();
      alert('Garmin data refreshed successfully!');
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to refresh Garmin data',
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatMetricValue = (value: string, unit: string | null) => {
    try {
      const numValue = parseFloat(value);
      if (!Number.isNaN(numValue)) {
        return `${numValue.toFixed(1)} ${unit || ''}`;
      }
    } catch {
      // If parsing fails, return as is
    }
    return value;
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

        {connection?.isActive ? (
          <Card padding="$4">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text fontWeight="bold">Connected Account</Text>
                  <Text opacity={0.7}>{connection.garminEmail}</Text>
                </YStack>
                <XStack gap="$2">
                  <Button
                    size="$3"
                    theme="green"
                    onPress={handleRefresh}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? <Spinner size="small" /> : 'Refresh Data'}
                  </Button>
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
              </XStack>

              {connection.lastSyncAt && (
                <YStack gap="$2">
                  <Text fontSize="$2" opacity={0.7}>
                    Last Sync: {formatDate(connection.lastSyncAt)}
                  </Text>
                  {connection.lastSyncStatus === 'success' && (
                    <Text fontSize="$2">✓ Sync successful</Text>
                  )}
                  {connection.lastSyncStatus === 'error' && (
                    <Text fontSize="$2">
                      ✗ Sync failed: {connection.lastSyncError}
                    </Text>
                  )}
                </YStack>
              )}
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

        {connection?.isActive && (
          <>
            <H2>Latest Health Data</H2>

            {metricsLoading ? (
              <Card padding="$4">
                <XStack justifyContent="center">
                  <Spinner />
                </XStack>
              </Card>
            ) : latestMetrics && latestMetrics.length > 0 ? (
              <YStack gap="$3">
                {latestMetrics
                  .filter(
                    (metric) => metric.metricType !== 'heart_rate_detailed',
                  )
                  .map((metric) => (
                    <Card key={metric.id} padding="$3">
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <YStack>
                          <Text fontWeight="bold" textTransform="capitalize">
                            {metric.metricType.replace(/_/g, ' ')}
                          </Text>
                          <Text fontSize="$2" opacity={0.7}>
                            {formatDate(metric.recordedAt)}
                          </Text>
                        </YStack>
                        <Text fontSize="$6" fontWeight="bold">
                          {formatMetricValue(metric.value, metric.unit)}
                        </Text>
                      </XStack>
                    </Card>
                  ))}
              </YStack>
            ) : (
              <Card padding="$4">
                <Text textAlign="center" opacity={0.7}>
                  No health data synced yet. Data will appear after the initial
                  sync completes.
                </Text>
              </Card>
            )}
          </>
        )}
      </YStack>
    </ScrollView>
  );
}
