import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { TimePicker } from '@/components/TimePicker';
import { Button, Input, Spinner, Text, XStack, YStack } from '@/components/ui';
import { useProfile, useUpsertProfile } from '@/lib/hooks/use-profile';

/**
 * Sleep Patterns Screen
 * Allows users to input their sleep habits including average hours, quality,
 * typical bed time, and wake time. This information is used to provide
 * personalized energy and wellness recommendations.
 */

const sleepQualityEnum = ['poor', 'fair', 'good', 'excellent'] as const;
type SleepQuality = (typeof sleepQualityEnum)[number];

const formSchema = z.object({
  sleepHoursAverage: z.number().min(4).max(12),
  sleepQuality: z.enum(sleepQualityEnum),
  typicalWakeTime: z.string(),
  typicalBedTime: z.string(),
});

type FormData = z.infer<typeof formSchema>;

const sleepQualityLabels: Record<SleepQuality, string> = {
  poor: 'Poor',
  fair: 'Fair',
  good: 'Good',
  excellent: 'Excellent',
};

export default function SleepPatternsScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sleepHoursAverage: profile?.sleepHoursAverage
        ? Number(profile.sleepHoursAverage)
        : 7,
      sleepQuality: (profile?.sleepQuality as SleepQuality) || 'good',
      typicalWakeTime: profile?.typicalWakeTime || '07:00',
      typicalBedTime: profile?.typicalBedTime || '23:00',
    },
  });

  const _sleepHours = watch('sleepHoursAverage');
  const _sleepQuality = watch('sleepQuality');

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      await upsertProfile.mutateAsync({
        sleepHoursAverage: data.sleepHoursAverage,
        sleepQuality: data.sleepQuality,
        typicalWakeTime: data.typicalWakeTime,
        typicalBedTime: data.typicalBedTime,
      });

      alert('Sleep patterns saved successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving sleep patterns:', error);
      alert(
        `Failed to save sleep patterns: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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
            Sleep Patterns
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
          {/* Average Sleep Hours */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Average Sleep Hours
            </Text>
            <Controller
              control={control}
              name="sleepHoursAverage"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value.toString()}
                  onChangeText={(text) => onChange(Number(text))}
                  onBlur={onBlur}
                  placeholder="7"
                  keyboardType="decimal-pad"
                />
              )}
            />
            {errors.sleepHoursAverage && (
              <Text color="red" fontSize="$2">
                {errors.sleepHoursAverage.message}
              </Text>
            )}
          </YStack>

          {/* Sleep Quality */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Sleep Quality
            </Text>
            <Controller
              control={control}
              name="sleepQuality"
              render={({ field: { onChange, value } }) => (
                <XStack gap="$2" flexWrap="wrap">
                  {sleepQualityEnum.map((quality) => (
                    <Button
                      key={quality}
                      size="$3"
                      variant={value === quality ? 'outlined' : undefined}
                      onPress={() => onChange(quality)}
                    >
                      {sleepQualityLabels[quality]}
                    </Button>
                  ))}
                </XStack>
              )}
            />
            {errors.sleepQuality && (
              <Text color="red" fontSize="$2">
                {errors.sleepQuality.message}
              </Text>
            )}
          </YStack>

          {/* Typical Wake Time */}
          <Controller
            control={control}
            name="typicalWakeTime"
            render={({ field: { onChange, value } }) => (
              <TimePicker
                label="Typical Wake Time"
                value={value}
                onChange={onChange}
                error={errors.typicalWakeTime?.message}
              />
            )}
          />

          {/* Typical Bed Time */}
          <Controller
            control={control}
            name="typicalBedTime"
            render={({ field: { onChange, value } }) => (
              <TimePicker
                label="Typical Bed Time"
                value={value}
                onChange={onChange}
                error={errors.typicalBedTime?.message}
              />
            )}
          />
        </YStack>
      </YStack>
    </ScrollView>
  );
}
