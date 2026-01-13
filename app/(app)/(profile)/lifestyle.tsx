import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Button, Input, Spinner, Text, XStack, YStack } from '@/components/ui';
import { usePartialProfileUpdate } from '@/lib/hooks/use-partial-profile-update';
import { useProfile } from '@/lib/hooks/use-profile';
import { useUpdateProfileSection } from '@/lib/hooks/use-update-profile-section';

const stressLevelEnum = ['low', 'moderate', 'high'] as const;
type StressLevel = (typeof stressLevelEnum)[number];

const exerciseFrequencyEnum = [
  'daily',
  '4-6x/week',
  '2-3x/week',
  '1x/week',
  'rarely',
  'never',
] as const;
type ExerciseFrequency = (typeof exerciseFrequencyEnum)[number];

const exerciseTypesEnum = [
  'cardio',
  'strength',
  'yoga',
  'pilates',
  'sports',
  'walking',
  'cycling',
  'swimming',
  'other',
] as const;

const formSchema = z.object({
  stressLevel: z.enum(stressLevelEnum),
  exerciseFrequency: z.enum(exerciseFrequencyEnum),
  exerciseTypes: z.array(z.string()),
  lifestyleNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const stressLevelLabels: Record<StressLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

const exerciseTypeLabels: Record<(typeof exerciseTypesEnum)[number], string> = {
  cardio: 'Cardio',
  strength: 'Strength Training',
  yoga: 'Yoga',
  pilates: 'Pilates',
  sports: 'Sports',
  walking: 'Walking',
  cycling: 'Cycling',
  swimming: 'Swimming',
  other: 'Other',
};

export default function LifestyleScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const updateProfile = usePartialProfileUpdate();
  const updateSection = useUpdateProfileSection();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stressLevel: (profile?.stressLevel as StressLevel) || 'moderate',
      exerciseFrequency:
        (profile?.exerciseFrequency as ExerciseFrequency) || '2-3x/week',
      exerciseTypes: profile?.exerciseTypes || [],
      lifestyleNotes: '',
    },
  });

  const _selectedStress = watch('stressLevel');
  const _selectedFrequency = watch('exerciseFrequency');
  const selectedTypes = watch('exerciseTypes');

  const toggleExerciseType = (type: string) => {
    const current = selectedTypes;
    if (current.includes(type)) {
      setValue(
        'exerciseTypes',
        current.filter((t) => t !== type),
      );
    } else {
      setValue('exerciseTypes', [...current, type]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      // Update profile
      await updateProfile.mutateAsync({
        stressLevel: data.stressLevel,
        exerciseFrequency: data.exerciseFrequency,
        exerciseTypes: data.exerciseTypes,
      });

      // Mark section as complete
      await updateSection.mutateAsync({
        sectionKey: 'lifestyle',
        completed: true,
      });

      // Show success message
      alert('Lifestyle information saved successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving lifestyle:', error);
      alert('Failed to save lifestyle information. Please try again.');
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
            Lifestyle
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
          {/* Stress Level */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Stress Level
            </Text>
            <Text fontSize="$2" color="gray">
              How would you describe your typical stress level?
            </Text>
            <Controller
              control={control}
              name="stressLevel"
              render={({ field: { onChange, value } }) => (
                <XStack gap="$2" flexWrap="wrap">
                  {stressLevelEnum.map((level) => (
                    <Button
                      key={level}
                      size="$3"
                      variant={value === level ? 'outlined' : undefined}
                      onPress={() => onChange(level)}
                    >
                      {stressLevelLabels[level]}
                    </Button>
                  ))}
                </XStack>
              )}
            />
            {errors.stressLevel && (
              <Text color="red" fontSize="$2">
                {errors.stressLevel.message}
              </Text>
            )}
          </YStack>

          {/* Exercise Frequency */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Exercise Frequency
            </Text>
            <Text fontSize="$2" color="gray">
              How often do you exercise?
            </Text>
            <Controller
              control={control}
              name="exerciseFrequency"
              render={({ field: { onChange, value } }) => (
                <XStack gap="$2" flexWrap="wrap">
                  {exerciseFrequencyEnum.map((frequency) => (
                    <Button
                      key={frequency}
                      size="$3"
                      variant={value === frequency ? 'outlined' : undefined}
                      onPress={() => onChange(frequency)}
                    >
                      {frequency}
                    </Button>
                  ))}
                </XStack>
              )}
            />
            {errors.exerciseFrequency && (
              <Text color="red" fontSize="$2">
                {errors.exerciseFrequency.message}
              </Text>
            )}
          </YStack>

          {/* Exercise Types */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Exercise Types
            </Text>
            <Text fontSize="$2" color="gray">
              Select all that apply
            </Text>
            <Controller
              control={control}
              name="exerciseTypes"
              render={() => (
                <XStack gap="$2" flexWrap="wrap">
                  {exerciseTypesEnum.map((type) => (
                    <Button
                      key={type}
                      size="$3"
                      variant={
                        selectedTypes.includes(type) ? 'outlined' : undefined
                      }
                      onPress={() => toggleExerciseType(type)}
                    >
                      {exerciseTypeLabels[type]}
                    </Button>
                  ))}
                </XStack>
              )}
            />
            {errors.exerciseTypes && (
              <Text color="red" fontSize="$2">
                {errors.exerciseTypes.message}
              </Text>
            )}
          </YStack>

          {/* Optional Notes */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Notes (Optional)
            </Text>
            <Controller
              control={control}
              name="lifestyleNotes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholder="Any other lifestyle factors, activities, or preferences..."
                />
              )}
            />
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
