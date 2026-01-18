import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActiveGoals,
  QuickActions,
  TodaySnapshot,
} from '@/components/dashboard';
import { ProfileCompletionCard } from '@/components/ProfileCompletionCard';
import { H1, Text, YStack } from '@/components/ui';
import { useSession } from '@/lib/hooks/use-auth';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();

  const userName = session?.user?.name?.split(' ')[0] || 'there';
  const greeting = getGreeting();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <YStack
        flex={1}
        paddingTop={insets.top + 20}
        paddingBottom={insets.bottom + 20}
        paddingHorizontal="$4"
        gap="$5"
      >
        <YStack gap="$1">
          <H1>
            {greeting}, {userName}!
          </H1>
          <Text color="$color10">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </YStack>

        <TodaySnapshot />

        <ActiveGoals />

        <QuickActions />

        <ProfileCompletionCard />
      </YStack>
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
