import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { ProfileForm } from '@/components/ProfileForm';
import {
  Button,
  Card,
  ErrorState,
  H2,
  LoadingState,
  ScreenHeader,
  SuccessMessage,
  Text,
  XStack,
  YStack,
} from '@/components/ui';
import { useProfile } from '@/lib/hooks/use-profile';
import { getAllSections } from '@/lib/profile-sections-config';

/**
 * Edit Profile Screen
 * Allows users to update their basic profile information and access additional profile sections
 * for updating health-related data (sleep, eating, supplements, lifestyle, Garmin)
 */
export default function EditProfileScreen() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const [showSuccess, setShowSuccess] = useState(false);

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load profile" onRetry={refetch} />;
  }

  const allSections = getAllSections();

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      router.back();
    }, 1500);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title="Edit Profile" />
      <SuccessMessage
        message="Profile updated successfully!"
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
      />
      <ScrollView style={{ flex: 1 }}>
        <YStack flex={1} paddingHorizontal="$4" paddingVertical="$4" gap="$4">
          <ProfileForm
            initialProfile={profile}
            onSuccess={handleSuccess}
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
    </YStack>
  );
}
