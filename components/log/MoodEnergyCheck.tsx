import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from '@/components/ui';
import { useCreateDailyLog, useTodaySummary } from '@/lib/hooks/use-daily-log';

const MOOD_OPTIONS = [
  { value: 1, label: 'Rough', color: '$red9' },
  { value: 2, label: 'Low', color: '$orange9' },
  { value: 3, label: 'OK', color: '$yellow9' },
  { value: 4, label: 'Good', color: '$green9' },
  { value: 5, label: 'Great', color: '$blue9' },
];

const ENERGY_OPTIONS = [
  { value: 1, label: 'Tired', color: '$red9' },
  { value: 2, label: 'Low', color: '$orange9' },
  { value: 3, label: 'OK', color: '$yellow9' },
  { value: 4, label: 'Good', color: '$green9' },
  { value: 5, label: 'High', color: '$blue9' },
];

type ScaleSelectorProps = {
  title: string;
  options: typeof MOOD_OPTIONS;
  currentValue: number | null;
  onSelect: (value: number) => void;
  isLoading: boolean;
  showSuccess: boolean;
};

function ScaleSelector({
  title,
  options,
  currentValue,
  onSelect,
  isLoading,
  showSuccess,
}: ScaleSelectorProps) {
  return (
    <YStack gap="$2">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$3" fontWeight="500">
          {title}
        </Text>
        {showSuccess ? (
          <Text fontSize="$2" color="$green10" fontWeight="600">
            ✓ Updated!
          </Text>
        ) : currentValue ? (
          <Text fontSize="$2" color="$color10">
            Latest: {options.find((o) => o.value === currentValue)?.label}
          </Text>
        ) : null}
      </XStack>
      <XStack gap="$2">
        {options.map((option) => {
          const isSelected = currentValue === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              <YStack
                backgroundColor={isSelected ? option.color : '$color3'}
                padding="$2"
                borderRadius="$3"
                alignItems="center"
                opacity={isLoading ? 0.5 : 1}
              >
                <Text
                  fontSize="$4"
                  fontWeight={isSelected ? '700' : '400'}
                  color={isSelected ? 'white' : '$color11'}
                >
                  {option.value}
                </Text>
                <Text
                  fontSize="$1"
                  color={isSelected ? 'white' : '$color10'}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>
    </YStack>
  );
}

export function MoodEnergyCheck() {
  const { data: summary } = useTodaySummary();
  const createLog = useCreateDailyLog();
  const [lastUpdated, setLastUpdated] = useState<'mood' | 'energy' | null>(
    null,
  );

  const currentMood = summary?.latestMood ?? null;
  const currentEnergy = summary?.latestEnergy ?? null;

  // Clear success message after 2 seconds
  useEffect(() => {
    if (lastUpdated) {
      const timer = setTimeout(() => setLastUpdated(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated]);

  const handleMoodSelect = (value: number) => {
    createLog.mutate(
      {
        category: 'mood',
        summary: value.toString(),
      },
      {
        onSuccess: () => setLastUpdated('mood'),
      },
    );
  };

  const handleEnergySelect = (value: number) => {
    createLog.mutate(
      {
        category: 'energy',
        summary: value.toString(),
      },
      {
        onSuccess: () => setLastUpdated('energy'),
      },
    );
  };

  return (
    <YStack gap="$4">
      <Text fontSize="$4" fontWeight="600">
        How are you feeling?
      </Text>

      <ScaleSelector
        title="Mood"
        options={MOOD_OPTIONS}
        currentValue={currentMood}
        onSelect={handleMoodSelect}
        isLoading={createLog.isPending}
        showSuccess={lastUpdated === 'mood'}
      />

      <ScaleSelector
        title="Energy"
        options={ENERGY_OPTIONS}
        currentValue={currentEnergy}
        onSelect={handleEnergySelect}
        isLoading={createLog.isPending}
        showSuccess={lastUpdated === 'energy'}
      />
    </YStack>
  );
}
