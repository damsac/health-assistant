/**
 * Health Stats Page
 *
 * Displays synced health metrics from Garmin Connect including:
 * - Latest health data cards
 * - Manual refresh functionality
 * - Connection status
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Button,
  Card,
  ErrorState,
  H2,
  LoadingState,
  ScreenHeader,
  Spinner,
  SuccessMessage,
  Text,
  XStack,
  YStack,
} from '@/components/ui';
import {
  useDisconnectGarmin,
  useGarminConnection,
  useGarminMetrics,
  useSyncGarmin,
} from '@/lib/hooks/use-garmin';

export default function HealthStatsPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    data: connection,
    isLoading: connectionLoading,
    error: connectionError,
    refetch: refetchConnection,
  } = useGarminConnection();
  const { data: latestMetrics, isLoading: metricsLoading } = useGarminMetrics();
  const disconnectMutation = useDisconnectGarmin();
  const syncMutation = useSyncGarmin();

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Garmin account?')) {
      try {
        await disconnectMutation.mutateAsync();
        alert('Garmin disconnected successfully');
        router.push('/garmin');
      } catch (_error) {
        alert('Failed to disconnect Garmin');
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await syncMutation.mutateAsync();
      setShowSuccess(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to refresh Garmin data',
      );
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Never';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  const formatMetricValue = (
    value: string,
    unit: string | null,
    metricType: string,
  ) => {
    try {
      if (metricType === 'activity' && value.startsWith('{')) {
        const activity = JSON.parse(value);
        return (
          <YStack alignItems="flex-end" gap="$1">
            <Text fontSize="$6" fontWeight="bold">
              {activity.activityName || 'Unknown Activity'}
            </Text>
            <Text fontSize="$3" opacity={0.7}>
              {activity.duration
                ? `${Math.round(activity.duration / 60)} min`
                : ''}
              {activity.distance
                ? ` • ${Math.round((activity.distance / 1000) * 10) / 10} km`
                : ''}
              {activity.calories ? ` • ${activity.calories} cal` : ''}
            </Text>
          </YStack>
        );
      }

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
    return <LoadingState message="Loading health stats..." />;
  }

  if (connectionError) {
    return (
      <ErrorState
        message="Failed to load Garmin connection"
        onRetry={refetchConnection}
      />
    );
  }

  if (!connection?.connected) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <ScreenHeader title="Health Stats" showBack={false} />
        <ScrollView style={{ flex: 1 }}>
          <YStack gap="$4" paddingHorizontal="$4" paddingVertical="$4">
            <Card padding="$4">
              <YStack gap="$3">
                <Text>No Garmin account connected.</Text>
                <Button onPress={() => router.push('/garmin')}>
                  Connect Garmin
                </Button>
              </YStack>
            </Card>
          </YStack>
        </ScrollView>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title="Health Stats" showBack={false} />
      <SuccessMessage
        message="Garmin data refreshed successfully!"
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
      />
      <ScrollView style={{ flex: 1 }}>
        <YStack gap="$4" paddingHorizontal="$4" paddingVertical="$4">
          <Card padding="$4">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text fontWeight="bold">Connected Account</Text>
                  <Text opacity={0.7}>{connection.email}</Text>
                </YStack>
                <XStack gap="$2">
                  <Button
                    size="$3"
                    theme="green"
                    onPress={handleRefresh}
                    disabled={syncMutation.isPending}
                  >
                    {syncMutation.isPending ? (
                      <Spinner size="small" />
                    ) : (
                      'Refresh'
                    )}
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

              {connection.lastSync && (
                <Text fontSize="$2" opacity={0.7}>
                  Last Sync: {formatDate(connection.lastSync)}
                </Text>
              )}
            </YStack>
          </Card>

          <H2>Latest Health Data</H2>

          {metricsLoading ? (
            <Card padding="$4">
              <XStack justifyContent="center">
                <Spinner />
              </XStack>
            </Card>
          ) : latestMetrics && Object.keys(latestMetrics).length > 0 ? (
            <YStack gap="$3">
              {Object.entries(latestMetrics)
                .filter(([type]) => type !== 'heart_rate_detailed')
                .map(([type, metric]) => (
                  <Card key={metric.id} padding="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack>
                        <Text fontWeight="bold" textTransform="capitalize">
                          {type === 'activity'
                            ? 'Latest Activity'
                            : type.replace(/_/g, ' ')}
                        </Text>
                        <Text fontSize="$2" opacity={0.7}>
                          {formatDate(metric.recordedAt)}
                        </Text>
                      </YStack>
                      <Text fontSize="$6" fontWeight="bold">
                        {formatMetricValue(metric.value, metric.unit, type)}
                      </Text>
                    </XStack>
                  </Card>
                ))}

              <Text
                fontSize="$2"
                opacity={0.7}
                textAlign="center"
                marginTop="$2"
              >
                💡 Calories are shown within activity data
              </Text>
            </YStack>
          ) : (
            <Card padding="$4">
              <Text textAlign="center" opacity={0.7}>
                No health data synced yet. Click "Refresh" to sync your latest
                data.
              </Text>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
