import { Link, Stack } from 'expo-router';
import { H1, Text, YStack } from 'tamagui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$5"
        backgroundColor="$background"
      >
        <H1 size="$7" color="$color">
          This screen doesn't exist.
        </H1>
        <Link href="/">
          <Text color="$blue10" marginTop="$4" fontSize="$4">
            Go to home screen!
          </Text>
        </Link>
      </YStack>
    </>
  );
}
