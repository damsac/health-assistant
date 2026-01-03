import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { Button, H1, YStack } from '@/components/ui';
import { useProfile } from '@/lib/hooks/use-profile';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return null;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <YStack
        flex={1}
        paddingTop={insets.top + 20}
        paddingBottom={insets.bottom}
        paddingHorizontal="$4"
        gap="$4"
      >
        <H1>Edit Profile</H1>
        <ProfileForm
          initialProfile={profile}
          onSuccess={() => router.back()}
          submitLabel="Save Changes"
        />
        <Button onPress={() => router.back()} chromeless>
          Cancel
        </Button>
      </YStack>
    </ScrollView>
  );
}
