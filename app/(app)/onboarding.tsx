/**
 * Onboarding Screen
 * Multi-step form for collecting user's basic health profile information
 * including age, height, weight, gender, goals, and dietary preferences.
 * Uses React Hook Form with Zod validation for type-safe form handling.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Controller,
  type Resolver,
  type SubmitHandler,
  useForm,
} from 'react-hook-form';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Button, Input, Spinner, Text, XStack, YStack } from '@/components/ui';
import { PROFILE_BOUNDS, type UpsertProfileRequest } from '@/lib/api/profile';
import { type Gender, genderEnum } from '@/lib/db/schema';
import { useUpsertProfile } from '@/lib/hooks/use-profile';
import {
  feetInchesToCm,
  kgToGrams,
  lbsToKg,
  type MeasurementSystem,
} from '@/lib/units';

const genderLabels: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

const primaryGoals = [
  'Weight management',
  'More energy',
  'Better digestion',
  'Athletic performance',
  'Manage a health condition',
  'General wellness',
] as const;

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Keto',
  'Paleo',
  'Halal',
  'Kosher',
  'None',
] as const;

// Simple coercion helper - returns null for empty/invalid
const optionalNumber = z
  .string()
  .transform((v) => (v === '' ? null : Number(v)))
  .pipe(
    z
      .number()
      .nullable()
      .refine((n) => n === null || !Number.isNaN(n), 'Must be a valid number'),
  );

// Form schema
const createFormSchema = (
  isMetric: boolean,
  measurementSystem: MeasurementSystem,
) => {
  const { heightCm, weightKg, weightLbs } = PROFILE_BOUNDS;
  const [minW, maxW] = isMetric
    ? [weightKg.min, weightKg.max]
    : [weightLbs.min, weightLbs.max];

  return z
    .object({
      age: optionalNumber.refine(
        (n) => n === null || (n >= 13 && n <= 120),
        'Age must be between 13 and 120',
      ),
      heightCm: optionalNumber.refine(
        (n) => n === null || (n >= heightCm.min && n <= heightCm.max),
        `${heightCm.min}-${heightCm.max} cm`,
      ),
      heightFeet: optionalNumber.refine(
        (n) => n === null || (n >= 0 && n <= 9),
        '0-9 ft',
      ),
      heightInches: optionalNumber.refine(
        (n) => n === null || (n >= 0 && n < 12),
        '0-11 in',
      ),
      weight: optionalNumber.refine(
        (n) => n === null || (n >= minW && n <= maxW),
        `${minW}-${maxW} ${isMetric ? 'kg' : 'lbs'}`,
      ),
      gender: z.enum([...genderEnum, '']).default(''),
      primaryGoals: z
        .array(z.string())
        .max(2, 'Select up to 2 goals')
        .default([]),
      dietaryPreferences: z.array(z.string()),
      allergies: z.string().optional(),
      healthChallenge: z.string().optional(),
    })
    .transform((data): UpsertProfileRequest => {
      let heightCmVal: number | null = null;
      if (isMetric && data.heightCm !== null) {
        heightCmVal = Math.round(data.heightCm);
      } else if (
        !isMetric &&
        (data.heightFeet !== null || data.heightInches !== null)
      ) {
        heightCmVal = feetInchesToCm(
          data.heightFeet ?? 0,
          data.heightInches ?? 0,
        );
      }

      let weightGrams: number | null = null;
      if (data.weight !== null) {
        const kg = isMetric ? data.weight : lbsToKg(data.weight);
        weightGrams = kgToGrams(kg);
      }

      return {
        heightCm: heightCmVal,
        weightGrams,
        gender: data.gender === '' ? null : data.gender,
        dateOfBirth: data.age
          ? new Date(new Date().getFullYear() - data.age, 0, 1).toISOString()
          : null,
        measurementSystem,
        dietaryPreferences: data.dietaryPreferences.length
          ? data.dietaryPreferences
          : null,
        primaryGoals: data.primaryGoals?.length ? data.primaryGoals : null,
        allergies: data.allergies || null,
        // Include all other fields with null defaults
        sleepHoursAverage: null,
        sleepQuality: null,
        typicalWakeTime: null,
        typicalBedTime: null,
        mealsPerDay: null,
        typicalMealTimes: null,
        snackingHabits: null,
        supplementsMedications: null,
        healthConditions: null,
        stressLevel: null,
        exerciseFrequency: null,
        exerciseTypes: null,
        waterIntakeLiters: null,
        garminConnected: false,
        garminUserId: null,
      };
    });
};

type FormInput = z.input<ReturnType<typeof createFormSchema>>;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const upsertProfile = useUpsertProfile();
  const [measurementSystem] = useState<MeasurementSystem>('imperial');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const isMetric = measurementSystem === 'metric';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(
      createFormSchema(isMetric, measurementSystem),
    ) as unknown as Resolver<FormInput>,
    defaultValues: {
      age: '',
      heightCm: '',
      heightFeet: '',
      heightInches: '',
      weight: '',
      gender: '',
      primaryGoals: [],
      dietaryPreferences: [],
      allergies: '',
      healthChallenge: '',
    },
  });

  const selectedGender = watch('gender');
  const selectedGoals = watch('primaryGoals');
  const selectedDietary = watch('dietaryPreferences');

  const onSubmit = async (data: UpsertProfileRequest) => {
    try {
      await upsertProfile.mutateAsync(data);
      router.replace('/(app)');
    } catch {
      // handled by mutation
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGoal = (goal: string) => {
    const current = selectedGoals ?? [];
    if (current.includes(goal)) {
      setValue(
        'primaryGoals',
        current.filter((g: string) => g !== goal),
      );
    } else if (current.length < 2) {
      setValue('primaryGoals', [...current, goal]);
    }
  };

  const toggleDietary = (option: string) => {
    const current = selectedDietary;
    if (current.includes(option)) {
      setValue(
        'dietaryPreferences',
        current.filter((d: string) => d !== option),
      );
    } else {
      setValue('dietaryPreferences', [...current, option]);
    }
  };

  const serverError = upsertProfile.error?.message ?? null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Age
              </Text>
              <Controller
                control={control}
                name="age"
                render={({ field: { onChange, onBlur, value } }) => (
                  <YStack gap="$1">
                    <Input
                      placeholder="e.g. 25"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      disabled={upsertProfile.isPending}
                    />
                    {errors.age && (
                      <Text color="$red10" fontSize="$2">
                        {errors.age.message}
                      </Text>
                    )}
                  </YStack>
                )}
              />
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Biological Sex
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {genderEnum.map((g) => (
                  <Button
                    key={g}
                    size="$3"
                    onPress={() =>
                      setValue('gender', selectedGender === g ? '' : g)
                    }
                    opacity={selectedGender === g ? 1 : 0.5}
                    disabled={upsertProfile.isPending}
                  >
                    {genderLabels[g]}
                  </Button>
                ))}
              </XStack>
            </YStack>
          </YStack>
        );

      case 2:
        return (
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Height
              </Text>
              <YStack gap="$1">
                <XStack gap="$2" alignItems="center">
                  <Controller
                    control={control}
                    name="heightFeet"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <XStack flex={1} gap="$1" alignItems="center">
                        <Input
                          flex={1}
                          placeholder="5"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          disabled={upsertProfile.isPending}
                        />
                        <Text>ft</Text>
                      </XStack>
                    )}
                  />
                  <Controller
                    control={control}
                    name="heightInches"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <XStack flex={1} gap="$1" alignItems="center">
                        <Input
                          flex={1}
                          placeholder="9"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          disabled={upsertProfile.isPending}
                        />
                        <Text>in</Text>
                      </XStack>
                    )}
                  />
                </XStack>
                {(errors.heightFeet || errors.heightInches) && (
                  <Text color="$red10" fontSize="$2">
                    {errors.heightFeet?.message || errors.heightInches?.message}
                  </Text>
                )}
              </YStack>
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Current Weight (lbs)
              </Text>
              <Controller
                control={control}
                name="weight"
                render={({ field: { onChange, onBlur, value } }) => (
                  <YStack gap="$1">
                    <Input
                      placeholder="e.g. 154"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      disabled={upsertProfile.isPending}
                    />
                    {errors.weight && (
                      <Text color="$red10" fontSize="$2">
                        {errors.weight.message}
                      </Text>
                    )}
                  </YStack>
                )}
              />
            </YStack>
          </YStack>
        );

      case 3:
        return (
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Primary Goals
              </Text>
              <Text fontSize="$2" opacity={0.7}>
                Select up to 2
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {primaryGoals.map((goal) => (
                  <Button
                    key={goal}
                    size="$3"
                    onPress={() => toggleGoal(goal)}
                    opacity={(selectedGoals ?? []).includes(goal) ? 1 : 0.5}
                    disabled={upsertProfile.isPending}
                  >
                    {goal}
                  </Button>
                ))}
              </XStack>
              {errors.primaryGoals && (
                <Text color="$red10" fontSize="$2">
                  {errors.primaryGoals.message}
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Dietary Preferences
              </Text>
              <Controller
                control={control}
                name="dietaryPreferences"
                render={() => (
                  <XStack gap="$2" flexWrap="wrap">
                    {dietaryOptions.map((option) => (
                      <Button
                        key={option}
                        size="$3"
                        onPress={() => toggleDietary(option)}
                        opacity={selectedDietary.includes(option) ? 1 : 0.5}
                        disabled={upsertProfile.isPending}
                      >
                        {option}
                      </Button>
                    ))}
                  </XStack>
                )}
              />
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Allergies/Intolerances
              </Text>
              <Text fontSize="$2" opacity={0.7}>
                Optional
              </Text>
              <Controller
                control={control}
                name="allergies"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="e.g. nuts, soy, lactose"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    disabled={upsertProfile.isPending}
                  />
                )}
              />
            </YStack>
          </YStack>
        );

      case 4:
        return (
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Biggest Health Challenge
              </Text>
              <Text fontSize="$2" opacity={0.7}>
                Optional - you can skip this
              </Text>
              <Controller
                control={control}
                name="healthChallenge"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Tell us about your main health challenge..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    disabled={upsertProfile.isPending}
                  />
                )}
              />
            </YStack>
          </YStack>
        );

      default:
        return null;
    }
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
        <YStack gap="$2">
          <Text fontSize="$7" fontWeight="bold">
            Let's get to know you
          </Text>
          <Text fontSize="$3" opacity={0.7}>
            Step {currentStep} of {totalSteps}
          </Text>
          <XStack gap="$2">
            {[...Array(totalSteps)].map((_, index) => (
              <YStack
                key={`step-${index + 1}`}
                flex={1}
                height={4}
                backgroundColor={index < currentStep ? '$color' : 'gray'}
                borderRadius={2}
              />
            ))}
          </XStack>
        </YStack>

        {serverError && (
          <Text color="$red10" textAlign="center">
            {serverError}
          </Text>
        )}

        {Object.keys(errors).length > 0 && (
          <YStack
            gap="$2"
            padding="$3"
            backgroundColor="$red2"
            borderRadius="$4"
          >
            <Text color="$red10" fontWeight="bold">
              Please fix the following:
            </Text>
            {errors.gender && (
              <Text color="$red10">• Select your biological sex</Text>
            )}
            {errors.primaryGoals && (
              <Text color="$red10">• Select at least 1 primary goal</Text>
            )}
          </YStack>
        )}

        {renderStep()}

        <XStack gap="$2" justifyContent="space-between">
          {currentStep > 1 && (
            <Button
              variant="outlined"
              onPress={prevStep}
              disabled={upsertProfile.isPending}
            >
              Previous
            </Button>
          )}
          <YStack flex={1} />
          {currentStep < totalSteps ? (
            <Button onPress={nextStep} disabled={upsertProfile.isPending}>
              Next
            </Button>
          ) : (
            <Button
              onPress={handleSubmit(
                onSubmit as unknown as SubmitHandler<FormInput>,
              )}
              disabled={upsertProfile.isPending}
            >
              {upsertProfile.isPending ? (
                <XStack gap="$2" alignItems="center">
                  <Spinner size="small" />
                  <Text>Saving...</Text>
                </XStack>
              ) : (
                'Complete Profile'
              )}
            </Button>
          )}
        </XStack>
      </YStack>
    </ScrollView>
  );
}
