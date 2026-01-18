import { Pressable } from 'react-native';
import { Text, XStack, YStack } from '@/components/ui';
import {
  useCreateDailyLog,
  useDeleteDailyLog,
  useTodaySummary,
} from '@/lib/hooks/use-daily-log';

const GLASSES = Array.from({ length: 8 }, (_, i) => ({
  id: `glass-${i}`,
  position: i,
}));

export function WaterTracker() {
  const { data: summary, isLoading } = useTodaySummary();
  const createLog = useCreateDailyLog();
  const deleteLog = useDeleteDailyLog();

  const waterCount = summary?.waterCount ?? 0;
  const waterEntries = summary?.waterEntries ?? [];
  const goal = GLASSES.length;

  const handleGlassPress = (position: number) => {
    if (position < waterCount) {
      // Clicking filled glass - remove most recent water entry
      const mostRecentWater = waterEntries[0];
      if (mostRecentWater) {
        deleteLog.mutate(mostRecentWater.id);
      }
    } else {
      // Clicking empty glass - add water
      createLog.mutate({
        category: 'water',
        summary: '1 glass',
      });
    }
  };

  const isPending = createLog.isPending || deleteLog.isPending;

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" fontWeight="600">
          Water Intake
        </Text>
        <Text fontSize="$2" color="$color10">
          Goal: {goal} glasses
        </Text>
      </XStack>

      {/* Water glasses visualization - now clickable */}
      <XStack flexWrap="wrap" gap="$2">
        {GLASSES.map((glass) => {
          const isFilled = glass.position < waterCount;
          return (
            <Pressable
              key={glass.id}
              onPress={() => handleGlassPress(glass.position)}
              disabled={isPending || isLoading}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <YStack
                width={36}
                height={44}
                borderRadius="$2"
                backgroundColor={isFilled ? '$blue9' : '$color4'}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
              >
                <Text fontSize={20} opacity={isFilled ? 1 : 0.3}>
                  W
                </Text>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>

      {/* Progress text with helpful hint */}
      <YStack gap="$1">
        <Text fontSize="$3" color="$color11" textAlign="center">
          {waterCount} of {goal} glasses today
        </Text>
        <Text fontSize="$2" color="$color10" textAlign="center">
          Tap empty glass to add, filled glass to remove
        </Text>
      </YStack>
    </YStack>
  );
}
