import { Pressable } from 'react-native';
import { Text, XStack, YStack } from '@/components/ui';
import { formatRelativeDate } from './formatters';

type ConversationItemProps = {
  id: string;
  title: string | null;
  updatedAt: Date | string;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export function ConversationItem({
  title,
  updatedAt,
  isActive,
  onPress,
  onDelete,
  isDeleting,
}: ConversationItemProps) {
  return (
    <Pressable onPress={onPress} disabled={isDeleting}>
      {({ pressed }) => (
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$3"
          backgroundColor={
            isActive ? '$color4' : pressed ? '$color3' : 'transparent'
          }
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          alignItems="center"
          gap="$2"
          opacity={isDeleting ? 0.5 : 1}
        >
          <YStack flex={1} gap="$1">
            <Text
              fontSize="$3"
              fontWeight={isActive ? '600' : '400'}
              numberOfLines={1}
            >
              {title || 'New conversation'}
            </Text>
            <Text fontSize="$1" color="$color10">
              {formatRelativeDate(updatedAt)}
            </Text>
          </YStack>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={8}
            disabled={isDeleting}
          >
            <Text color="$red10" fontSize="$2">
              {isDeleting ? '...' : '×'}
            </Text>
          </Pressable>
        </XStack>
      )}
    </Pressable>
  );
}
