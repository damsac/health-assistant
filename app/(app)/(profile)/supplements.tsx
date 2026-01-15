import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Button, Input, Spinner, Text, XStack, YStack } from '@/components/ui';
import { useProfile, useUpsertProfile } from '@/lib/hooks/use-profile';

const formSchema = z.object({
  supplementsMedications: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function SupplementsScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplementsMedications: profile?.supplementsMedications || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      await upsertProfile.mutateAsync({
        supplementsMedications: data.supplementsMedications,
      });

      // Show success message
      alert('Supplements & medications saved successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving supplements:', error);
      alert('Failed to save supplements. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    router.back();
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
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Button onPress={handleSkip}>Skip</Button>
          <Text fontSize="$5" fontWeight="bold">
            Supplements & Medications
          </Text>
          <Button onPress={handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" />
                <Text>Saving...</Text>
              </XStack>
            ) : (
              'Save'
            )}
          </Button>
        </XStack>

        {/* Form */}
        <YStack gap="$6">
          {/* Supplements & Medications */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Supplements & Medications
            </Text>
            <Text fontSize="$2" color="gray">
              Include all vitamins, supplements, and medications you're taking
            </Text>
            <Controller
              control={control}
              name="supplementsMedications"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  placeholder="e.g., Vitamin D 2000IU daily, Omega-3 1000mg twice daily, Levothyroxine 50mcg every morning..."
                />
              )}
            />
            <Text fontSize="$2" color="gray">
              💡 Include dosage and frequency if possible
            </Text>
            {errors.supplementsMedications && (
              <Text color="red" fontSize="$2">
                {errors.supplementsMedications.message}
              </Text>
            )}
          </YStack>

          {/* Privacy Note */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">
              Privacy & Safety
            </Text>
            <Text fontSize="$2" color="gray">
              🔒 This information is kept private and secure
            </Text>
            <Text fontSize="$2" color="gray">
              ⚕️ Helps us avoid recommending harmful interactions
            </Text>
            <Text fontSize="$2" color="gray">
              👩‍⚕️ Always consult with your healthcare provider
            </Text>
          </YStack>

          {/* Examples */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">
              Common Examples
            </Text>
            <YStack gap="$1" paddingLeft="$4">
              <Text fontSize="$2" color="gray">
                • Multivitamin - 1 tablet daily
              </Text>
              <Text fontSize="$2" color="gray">
                • Vitamin D3 - 2000 IU with breakfast
              </Text>
              <Text fontSize="$2" color="gray">
                • Omega-3 Fish Oil - 1000mg twice daily
              </Text>
              <Text fontSize="$2" color="gray">
                • Probiotic - 1 capsule with dinner
              </Text>
              <Text fontSize="$2" color="gray">
                • Magnesium - 400mg before bed
              </Text>
              <Text fontSize="$2" color="gray">
                • Blood pressure medication
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
