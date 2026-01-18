import { useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import type { DailyLogResponse } from '@/lib/api/daily-log';
import { useDeleteDailyLog, useTodaySummary } from '@/lib/hooks/use-daily-log';

const CATEGORY_LABELS: Record<string, string> = {
  water: 'Water',
  meal: 'Meal',
  mood: 'Mood',
  energy: 'Energy',
};

const CATEGORY_ICONS: Record<string, string> = {
  water: 'W',
  meal: 'M',
  mood: '😊',
  energy: '⚡',
};

type EntryItemProps = {
  entry: DailyLogResponse;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

function EntryItem({ entry, onDelete, isDeleting }: EntryItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formattedTime = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      onDelete(entry.id);
    }
  };

  return (
    <XStack
      backgroundColor="$color2"
      padding="$3"
      borderRadius="$3"
      justifyContent="space-between"
      alignItems="center"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <XStack gap="$3" alignItems="center" flex={1}>
        <YStack
          width={32}
          height={32}
          backgroundColor="$color4"
          borderRadius="$2"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={16}>{CATEGORY_ICONS[entry.category]}</Text>
        </YStack>
        <YStack flex={1} gap="$1">
          <Text fontSize="$3" fontWeight="500">
            {CATEGORY_LABELS[entry.category]}: {entry.summary}
          </Text>
          {entry.details && (
            <Text fontSize="$2" color="$color10" numberOfLines={1}>
              {entry.details}
            </Text>
          )}
          <Text fontSize="$1" color="$color9">
            {formattedTime}
          </Text>
        </YStack>
      </XStack>
      <Button
        size="$2"
        backgroundColor={confirmDelete ? '$red9' : '$color5'}
        onPress={handleDelete}
        disabled={isDeleting}
        paddingHorizontal="$3"
      >
        {isDeleting ? (
          <Spinner size="small" />
        ) : (
          <Text
            fontSize="$2"
            fontWeight="600"
            color={confirmDelete ? 'white' : '$color11'}
          >
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </Text>
        )}
      </Button>
    </XStack>
  );
}

export function RecentEntries() {
  const { data: summary } = useTodaySummary();
  const deleteLog = useDeleteDailyLog();
  const [isExpanded, setIsExpanded] = useState(false);

  const entries = summary?.entries ?? [];
  const entryCount = entries.length;

  if (entryCount === 0) {
    return null;
  }

  return (
    <YStack gap="$3">
      {/* Header with toggle */}
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <XStack
          justifyContent="space-between"
          alignItems="center"
          backgroundColor="$color3"
          padding="$3"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$4" fontWeight="600">
              Today's Entries
            </Text>
            <YStack
              backgroundColor="$blue9"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              minWidth={24}
              alignItems="center"
            >
              <Text fontSize="$2" color="white" fontWeight="600">
                {entryCount}
              </Text>
            </YStack>
          </XStack>
          <Text fontSize={20}>{isExpanded ? '▼' : '▶'}</Text>
        </XStack>
      </Pressable>

      {/* Entry list */}
      {isExpanded && (
        <YStack gap="$2" animation="quick" enterStyle={{ opacity: 0, y: -10 }}>
          {entries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onDelete={deleteLog.mutate}
              isDeleting={deleteLog.isPending}
            />
          ))}
        </YStack>
      )}
    </YStack>
  );
}
