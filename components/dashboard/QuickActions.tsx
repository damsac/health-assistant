import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from '@/components/ui';

type ActionButtonProps = {
  icon: string;
  label: string;
  onPress: () => void;
};

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <YStack
        backgroundColor="$blue2"
        padding="$3"
        borderRadius="$4"
        alignItems="center"
        gap="$1"
        borderWidth={1}
        borderColor="$blue6"
      >
        <Text fontSize={20}>{icon}</Text>
        <Text fontSize="$2" color="$blue11" fontWeight="500">
          {label}
        </Text>
      </YStack>
    </Pressable>
  );
}

export function QuickActions() {
  const goToLog = () => {
    router.push('/(app)/(tabs)/log');
  };

  const goToChat = () => {
    router.push('/(app)/(tabs)/chat');
  };

  return (
    <YStack gap="$3">
      <Text fontSize="$4" fontWeight="600" color="$color11">
        Quick Actions
      </Text>
      <XStack gap="$3">
        <ActionButton icon="+" label="Log Water" onPress={goToLog} />
        <ActionButton icon="+" label="Log Meal" onPress={goToLog} />
      </XStack>
      <Pressable onPress={goToChat}>
        <XStack
          backgroundColor="$green2"
          padding="$3"
          borderRadius="$4"
          alignItems="center"
          justifyContent="center"
          gap="$2"
          borderWidth={1}
          borderColor="$green6"
        >
          <Text fontSize={20}>AI</Text>
          <Text fontSize="$3" color="$green11" fontWeight="500">
            Check in with AI
          </Text>
        </XStack>
      </Pressable>
    </YStack>
  );
}
