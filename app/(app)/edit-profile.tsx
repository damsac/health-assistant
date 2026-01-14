import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileForm } from '@/components/ProfileForm';
import { Button, Card, H1, H2, Text, XStack, YStack } from '@/components/ui';
import { useProfile } from '@/lib/hooks/use-profile';
import { getAllSections } from '@/lib/profile-utils';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return null;
  }

  const allSections = getAllSections();

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

        {/* Basic Profile Information */}
        <ProfileForm
          initialProfile={profile}
          onSuccess={() => router.back()}
          submitLabel="Save Changes"
        />

        {/* Profile Sections */}
        <Card gap="$3" padding="$4">
          <H2>Additional Profile Sections</H2>
          <Text fontSize="$3" color="gray">
            Update your health and lifestyle information
          </Text>

          <YStack gap="$2">
            {allSections.map((section) => (
              <Button
                key={section.key}
                variant="outlined"
                justifyContent="flex-start"
                onPress={() => router.push(section.route as any)}
              >
                <XStack flex={1} alignItems="center" gap="$3">
                  <Text fontSize="$6">{section.icon}</Text>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$4" fontWeight="500">
                      {section.title}
                    </Text>
                    <Text fontSize="$2" color="gray">
                      {section.benefit}
                    </Text>
                  </YStack>
                  <Text fontSize="$6" color="gray">
                    ›
                  </Text>
                </XStack>
              </Button>
            ))}
          </YStack>
        </Card>

        <Button onPress={() => router.back()} chromeless>
          Cancel
        </Button>
      </YStack>
    </ScrollView>
  );
}
