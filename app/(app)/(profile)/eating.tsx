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

const formSchema = z.object({
  mealsPerDay: z.number().min(1).max(6),
  typicalMealTimes: z.array(z.string()),
  snackingHabits: z.string().optional(),
  waterIntakeLiters: z.number().min(0).max(5),
});

type FormData = z.infer<typeof formSchema>;

export default function EatingScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const upsertProfile = useUpsertProfile();
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
      mealsPerDay: profile?.mealsPerDay || 3,
      typicalMealTimes: profile?.typicalMealTimes || [
        '08:00',
        '13:00',
        '19:00',
      ],
      snackingHabits: profile?.snackingHabits || '',
      waterIntakeLiters: profile?.waterIntakeLiters
        ? Number(profile.waterIntakeLiters)
        : 2,
    },
  });

  // Using direct array management instead of useFieldArray for now
  const mealTimes = watch('typicalMealTimes') || [];

  const _waterIntake = watch('waterIntakeLiters');

  // Adjust meal times array when meals per day changes
  const handleMealsChange = (value: number) => {
    setValue('mealsPerDay', value);
    const currentTimes = watch('typicalMealTimes') || [];

    if (value > currentTimes.length) {
      // Add more meal times
      const newTimes = [...currentTimes];
      for (let i = currentTimes.length; i < value; i++) {
        newTimes.push(`${String(8 + i * 2).padStart(2, '0')}:00`);
      }
      setValue('typicalMealTimes', newTimes);
    } else if (value < currentTimes.length) {
      // Remove meal times
      setValue('typicalMealTimes', currentTimes.slice(0, value));
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      // Update profile
      await upsertProfile.mutateAsync({
        mealsPerDay: data.mealsPerDay,
        typicalMealTimes: data.typicalMealTimes,
        snackingHabits: data.snackingHabits,
        waterIntakeLiters: data.waterIntakeLiters,
      });

      // Show success message
      alert('Eating schedule saved successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving eating schedule:', error);
      alert('Failed to save eating schedule. Please try again.');
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
            Eating Schedule
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
          {/* Meals Per Day */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Meals Per Day
            </Text>
            <Controller
              control={control}
              name="mealsPerDay"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value.toString()}
                  onChangeText={(text) => {
                    const num = Number(text);
                    if (!Number.isNaN(num) && num >= 1 && num <= 6) {
                      handleMealsChange(num);
                    }
                  }}
                  onBlur={onBlur}
                  placeholder="3"
                  keyboardType="numeric"
                />
              )}
            />
            {errors.mealsPerDay && (
              <Text color="red" fontSize="$2">
                {errors.mealsPerDay.message}
              </Text>
            )}
          </YStack>

          {/* Typical Meal Times */}
          <YStack gap="$3">
            <YStack gap="$1">
              <Text fontSize="$4" fontWeight="600">
                Typical Meal Times
              </Text>
              <Text fontSize="$2" color="gray">
                When do you usually eat?
              </Text>
            </YStack>
            {mealTimes.map((_time, index) => (
              <Controller
                key={`meal-time-${index}-${_time}`}
                control={control}
                name={`typicalMealTimes.${index}`}
                render={({ field: { onChange, value } }) => (
                  <TimePicker
                    label={`Meal ${index + 1}`}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            ))}
            {errors.typicalMealTimes && (
              <Text color="red" fontSize="$2">
                {errors.typicalMealTimes.message}
              </Text>
            )}
          </YStack>

          {/* Snacking Habits */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Snacking Habits
            </Text>
            <Controller
              control={control}
              name="snackingHabits"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g., Healthy snacks between meals, Late night snacking..."
                />
              )}
            />
          </YStack>

          {/* Water Intake */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600">
              Daily Water Intake
            </Text>
            <Controller
              control={control}
              name="waterIntakeLiters"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value.toString()}
                  onChangeText={(text) => onChange(Number(text))}
                  onBlur={onBlur}
                  placeholder="2"
                  keyboardType="decimal-pad"
                />
              )}
            />
            {errors.waterIntakeLiters && (
              <Text color="red" fontSize="$2">
                {errors.waterIntakeLiters.message}
              </Text>
            )}
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
