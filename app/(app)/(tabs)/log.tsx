import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MealLogger,
  MoodEnergyCheck,
  QuickNote,
  RecentEntries,
  WaterTracker,
} from '@/components/log';
import { Card, H1, YStack } from '@/components/ui';

export default function LogScreen() {
  const insets = useSafeAreaInsets();

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
        <H1>Log</H1>

        <Card padding="$4" backgroundColor="$color1">
          <WaterTracker />
        </Card>

        <Card padding="$4" backgroundColor="$color1">
          <MealLogger />
        </Card>

        <Card padding="$4" backgroundColor="$color1">
          <MoodEnergyCheck />
        </Card>

        <Card padding="$4" backgroundColor="$color1">
          <QuickNote />
        </Card>

        {/* Recent entries with delete functionality */}
        <RecentEntries />
      </YStack>
    </ScrollView>
  );
}
