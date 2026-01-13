import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="sleep" options={{ title: 'Sleep Patterns' }} />
      <Stack.Screen name="eating" options={{ title: 'Eating Schedule' }} />
      <Stack.Screen
        name="supplements"
        options={{ title: 'Supplements & Medications' }}
      />
      <Stack.Screen name="lifestyle" options={{ title: 'Lifestyle' }} />
      <Stack.Screen name="garmin" options={{ title: 'Connect Garmin' }} />
    </Stack>
  );
}
