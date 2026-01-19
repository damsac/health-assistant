import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from '@/components/ui';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export function ScreenHeader({
  title,
  showBack = true,
  onBackPress,
  rightElement,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <YStack
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingTop={insets.top}
    >
      <XStack
        height={56}
        alignItems="center"
        paddingHorizontal="$4"
        justifyContent="space-between"
      >
        <XStack flex={1} alignItems="center">
          {showBack && (
            <Pressable onPress={handleBackPress} hitSlop={8}>
              <Text fontSize="$6" color="$blue10">
                ← Back
              </Text>
            </Pressable>
          )}
        </XStack>

        <Text
          fontSize="$6"
          fontWeight="600"
          position="absolute"
          left={0}
          right={0}
          textAlign="center"
          pointerEvents="none"
        >
          {title}
        </Text>

        <XStack flex={1} justifyContent="flex-end">
          {rightElement}
        </XStack>
      </XStack>
    </YStack>
  );
}
