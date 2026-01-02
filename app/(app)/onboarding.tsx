import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { H1, Text, YStack } from '@/components/ui';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  const handleSuccess = () => {
    router.replace('/');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <YStack
        flex={1}
        paddingTop={insets.top + 20}
        paddingBottom={insets.bottom}
        paddingHorizontal="$4"
        gap="$4"
      >
        <H1>Complete Your Profile</H1>
        <Text>Please fill out your basic information to get started.</Text>
        <ProfileForm onSuccess={handleSuccess} submitLabel="Continue" />
      </YStack>
    </ScrollView>
  );
}
