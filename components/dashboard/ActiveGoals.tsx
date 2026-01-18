import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from '@/components/ui';
import { useActiveGoals } from '@/lib/hooks/use-goals';

export function ActiveGoals() {
  const { data: goals, isLoading, error } = useActiveGoals();

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
          Failed to load goals
        </Text>
      </YStack>
    );
  }

  const displayGoals = goals.slice(0, 3);

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$4" fontWeight="600" color="$color11">
          Your Goals
        </Text>
        <Pressable onPress={() => router.push('/(app)/(tabs)/chat')}>
          <Text color="$blue10" fontSize="$2">
            Manage
          </Text>
        </Pressable>
      </XStack>

      {goals.length === 0 ? (
        <YStack
          backgroundColor="$color2"
          padding="$4"
          borderRadius="$4"
          alignItems="center"
          gap="$2"
        >
          <Text color="$color10" textAlign="center">
            No goals yet. Set your first health goal!
          </Text>
          <Button
            size="$3"
            onPress={() =>
              router.push({
                pathname: '/(app)/(tabs)/chat',
                params: { prompt: 'Help me set a new health goal' },
              } as never)
            }
          >
            Set a Goal
          </Button>
        </YStack>
      ) : (
        <YStack gap="$2">
          {displayGoals.map((goal) => (
            <YStack
              key={goal.id}
              backgroundColor="$color2"
              padding="$3"
              borderRadius="$4"
              gap="$1"
            >
              <Text fontSize="$3" fontWeight="500">
                {goal.title}
              </Text>
              {goal.description && (
                <Text fontSize="$2" color="$color10" numberOfLines={2}>
                  {goal.description}
                </Text>
              )}
            </YStack>
          ))}

          {goals.length > 3 && (
            <Pressable onPress={() => router.push('/(app)/(tabs)/chat')}>
              <Text color="$blue10" fontSize="$2" textAlign="center">
                +{goals.length - 3} more goals
              </Text>
            </Pressable>
          )}
        </YStack>
      )}
    </YStack>
  );
}
