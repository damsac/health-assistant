import { useState } from 'react';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { useCreateDailyLog } from '@/lib/hooks/use-daily-log';

export function QuickNote() {
  const [note, setNote] = useState('');
  const createLog = useCreateDailyLog();

  const handleSubmit = () => {
    if (!note.trim()) return;
    createLog.mutate(
      {
        category: 'note',
        summary: note.trim(),
      },
      {
        onSuccess: () => setNote(''),
      },
    );
  };

  return (
    <YStack gap="$3">
      <Text fontSize="$4" fontWeight="600">
        Quick Note
      </Text>

      <Text fontSize="$2" color="$color10">
        Jot down anything about your health today - symptoms, observations, or
        reminders.
      </Text>

      <Input
        placeholder="How are you feeling? Any symptoms or observations?"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
        editable={!createLog.isPending}
        borderRadius="$3"
        backgroundColor="$color2"
        borderWidth={1}
        borderColor="$borderColor"
        minHeight={80}
        paddingTop="$2"
        textAlignVertical="top"
      />

      <Button
        onPress={handleSubmit}
        disabled={!note.trim() || createLog.isPending}
        // biome-ignore lint/suspicious/noExplicitAny: Tamagui's backgroundColor type doesn't support conditional token values
        backgroundColor={(note.trim() ? '$purple10' : '$gray5') as any}
      >
        {createLog.isPending ? (
          <Spinner size="small" color="white" />
        ) : (
          <XStack gap="$2" alignItems="center">
            <Text color="white" fontSize={16}>
              +
            </Text>
            <Text color="white" fontWeight="600">
              Add Note
            </Text>
          </XStack>
        )}
      </Button>
    </YStack>
  );
}
