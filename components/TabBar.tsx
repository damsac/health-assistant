import { router, usePathname } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from '@/components/ui';

interface TabItem {
  label: string;
  icon: string;
  path: string;
}

const tabs: TabItem[] = [
  { label: 'Home', icon: '🏠', path: '/(app)' },
  { label: 'Chat', icon: '💬', path: '/(app)/chat' },
  { label: 'Stats', icon: '📊', path: '/(app)/health-stats' },
  { label: 'Profile', icon: '👤', path: '/(app)/edit-profile' },
];

export function TabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (path: string) => {
    if (path === '/(app)') {
      return pathname === '/' || pathname === '/(app)';
    }
    return pathname.startsWith(path);
  };

  return (
    <XStack
      backgroundColor="$background"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingBottom={insets.bottom}
      height={60 + insets.bottom}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <Pressable
            key={tab.path}
            onPress={() => router.push(tab.path as any)}
            style={{ flex: 1 }}
          >
            <YStack
              flex={1}
              alignItems="center"
              justifyContent="center"
              gap="$1"
              opacity={active ? 1 : 0.5}
            >
              <Text fontSize="$7">{tab.icon}</Text>
              <Text fontSize="$2" fontWeight={active ? '600' : '400'}>
                {tab.label}
              </Text>
            </YStack>
          </Pressable>
        );
      })}
    </XStack>
  );
}
