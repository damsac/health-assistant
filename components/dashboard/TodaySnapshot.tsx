import { Spinner, Text, XStack, YStack } from '@/components/ui';
import { useTodaySummary } from '@/lib/hooks/use-daily-log';

type StatCardProps = {
  icon: string;
  label: string;
  value: string;
  subtext?: string;
};

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <YStack
      flex={1}
      backgroundColor="$color2"
      padding="$3"
      borderRadius="$4"
      alignItems="center"
      gap="$1"
    >
      <Text fontSize={24}>{icon}</Text>
      <Text fontSize="$5" fontWeight="600">
        {value}
      </Text>
      <Text fontSize="$2" color="$color10">
        {label}
      </Text>
      {subtext && (
        <Text fontSize="$1" color="$color9">
          {subtext}
        </Text>
      )}
    </YStack>
  );
}

function getMoodEmoji(mood: number | null): string {
  if (mood === null) return '-';
  const emojis = ['', 'Rough', 'Low', 'OK', 'Good', 'Great'];
  return emojis[mood] || '-';
}

function getEnergyEmoji(energy: number | null): string {
  if (energy === null) return '-';
  const emojis = ['', 'Tired', 'Low', 'OK', 'Good', 'High'];
  return emojis[energy] || '-';
}

export function TodaySnapshot() {
  const { data: summary, isLoading, error } = useTodaySummary();

  if (isLoading) {
    return (
      <YStack padding="$4" alignItems="center">
        <Spinner size="small" color="$color10" />
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack padding="$4">
        <Text color="$red10" fontSize="$2">
          Failed to load today's data
        </Text>
      </YStack>
    );
  }

  const waterCount = summary?.waterCount ?? 0;
  const mealCount = summary?.mealCount ?? 0;
  const mood = summary?.latestMood ?? null;
  const energy = summary?.latestEnergy ?? null;

  return (
    <YStack gap="$3">
      <Text fontSize="$4" fontWeight="600" color="$color11">
        Today's Snapshot
      </Text>
      <XStack gap="$3">
        <StatCard
          icon="💧"
          label="Water"
          value={`${waterCount}`}
          subtext="glasses"
        />
        <StatCard icon="🍽️" label="Meals" value={`${mealCount}`} />
        <StatCard icon="😊" label="Mood" value={getMoodEmoji(mood)} />
      </XStack>
      <XStack gap="$3">
        <StatCard icon="⚡" label="Energy" value={getEnergyEmoji(energy)} />
        <YStack flex={2} />
      </XStack>
    </YStack>
  );
}
