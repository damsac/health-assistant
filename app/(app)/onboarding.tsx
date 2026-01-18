/**
 * Onboarding Screen
 * Multi-step form for collecting user's basic health profile information.
 * Uses simple React state with localStorage persistence.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Spinner, Text, XStack, YStack } from '@/components/ui';
import { PROFILE_BOUNDS, type UpsertProfileRequest } from '@/lib/api/profile';
import { type Gender, genderEnum } from '@/lib/db/schema';
import { useUpsertProfile } from '@/lib/hooks/use-profile';
import { feetInchesToCm, kgToGrams, lbsToKg } from '@/lib/units';

const STORAGE_KEY = 'onboarding_form';

const genderLabels: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

const primaryGoalOptions = [
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

interface OnboardingData {
  age: string;
  gender: Gender | '';
  heightFeet: string;
  heightInches: string;
  weight: string;
  primaryGoals: string[];
  dietaryPreferences: string[];
  allergies: string;
  healthChallenge: string;
}

const defaultData: OnboardingData = {
  age: '',
  gender: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  primaryGoals: [],
  dietaryPreferences: [],
  allergies: '',
  healthChallenge: '',
};

function loadPersistedData(): OnboardingData {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultData, ...JSON.parse(stored) };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return defaultData;
}

function persistData(data: OnboardingData) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Ignore storage errors
  }
}

function clearPersistedData() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

interface ValidationErrors {
  age?: string;
  weight?: string;
  heightFeet?: string;
  heightInches?: string;
}

function validate(data: OnboardingData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Age validation (optional but if provided, must be valid)
  if (data.age) {
    const age = parseInt(data.age, 10);
    if (
      isNaN(age) ||
      age < PROFILE_BOUNDS.age.min ||
      age > PROFILE_BOUNDS.age.max
    ) {
      errors.age = `Age must be between ${PROFILE_BOUNDS.age.min} and ${PROFILE_BOUNDS.age.max}`;
    }
  }

  // Weight validation (required)
  if (!data.weight) {
    errors.weight = 'Weight is required';
  } else {
    const weight = parseFloat(data.weight);
    if (
      isNaN(weight) ||
      weight < PROFILE_BOUNDS.weightLbs.min ||
      weight > PROFILE_BOUNDS.weightLbs.max
    ) {
      errors.weight = `Weight must be between ${PROFILE_BOUNDS.weightLbs.min} and ${PROFILE_BOUNDS.weightLbs.max} lbs`;
    }
  }

  // Height validation (optional but if provided, must be valid)
  if (data.heightFeet) {
    const feet = parseInt(data.heightFeet, 10);
    if (isNaN(feet) || feet < 0 || feet > 9) {
      errors.heightFeet = 'Feet must be 0-9';
    }
  }
  if (data.heightInches) {
    const inches = parseInt(data.heightInches, 10);
    if (isNaN(inches) || inches < 0 || inches >= 12) {
      errors.heightInches = 'Inches must be 0-11';
    }
  }

  return errors;
}

function toApiRequest(data: OnboardingData): UpsertProfileRequest {
  // Convert height to cm
  let heightCm: number | null = null;
  if (data.heightFeet || data.heightInches) {
    const feet = parseInt(data.heightFeet, 10) || 0;
    const inches = parseInt(data.heightInches, 10) || 0;
    heightCm = feetInchesToCm(feet, inches);
  }

  // Convert weight to grams
  let weightGrams: number | null = null;
  if (data.weight) {
    const lbs = parseFloat(data.weight);
    const kg = lbsToKg(lbs);
    weightGrams = kgToGrams(kg);
  }

  // Convert age to date of birth
  let dateOfBirth: string | null = null;
  if (data.age) {
    const age = parseInt(data.age, 10);
    if (!isNaN(age)) {
      dateOfBirth = new Date(
        new Date().getFullYear() - age,
        0,
        1,
      ).toISOString();
    }
  }

  return {
    heightCm,
    weightGrams,
    gender: data.gender || null,
    dateOfBirth,
    measurementSystem: 'imperial',
    dietaryPreferences:
      data.dietaryPreferences.length > 0 ? data.dietaryPreferences : null,
    primaryGoals: data.primaryGoals.length > 0 ? data.primaryGoals : null,
    allergies: data.allergies || null,
  };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const upsertProfile = useUpsertProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(defaultData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isInitialized, setIsInitialized] = useState(false);

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
      router.replace('/(app)/(tabs)');
    } catch {
      // handled by mutation
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData((prev) => {
      const current = prev.primaryGoals;
      if (current.includes(goal)) {
        return { ...prev, primaryGoals: current.filter((g) => g !== goal) };
      }
      if (current.length < 2) {
        return { ...prev, primaryGoals: [...current, goal] };
      }
      return prev;
    });
  };

  const toggleDietary = (option: string) => {
    setFormData((prev) => {
      const current = prev.dietaryPreferences;
      if (current.includes(option)) {
        return {
          ...prev,
          dietaryPreferences: current.filter((d) => d !== option),
        };
      }
      return { ...prev, dietaryPreferences: [...current, option] };
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const request = toApiRequest(formData);
      await upsertProfile.mutateAsync(request);
      clearPersistedData();
      router.replace('/(app)');
    } catch {
      // Error handled by mutation
    }
  };

  const serverError = upsertProfile.error?.message ?? null;
  const isPending = upsertProfile.isPending;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <YStack gap="$4">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Age
              </Text>
              <YStack gap="$1">
                <Input
                  placeholder="e.g. 25"
                  value={formData.age}
                  onChangeText={(v) => updateField('age', v)}
                  keyboardType="numeric"
                  disabled={isPending}
                />
                {errors.age && (
                  <Text color="$red10" fontSize="$2">
                    {errors.age}
                  </Text>
                )}
              </YStack>
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
                      updateField('gender', formData.gender === g ? '' : g)
                    }
                    opacity={formData.gender === g ? 1 : 0.5}
                    disabled={isPending}
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
                  <XStack flex={1} gap="$1" alignItems="center">
                    <Input
                      flex={1}
                      placeholder="5"
                      value={formData.heightFeet}
                      onChangeText={(v) => updateField('heightFeet', v)}
                      keyboardType="numeric"
                      disabled={isPending}
                    />
                    <Text>ft</Text>
                  </XStack>
                  <XStack flex={1} gap="$1" alignItems="center">
                    <Input
                      flex={1}
                      placeholder="9"
                      value={formData.heightInches}
                      onChangeText={(v) => updateField('heightInches', v)}
                      keyboardType="numeric"
                      disabled={isPending}
                    />
                    <Text>in</Text>
                  </XStack>
                </XStack>
                {(errors.heightFeet || errors.heightInches) && (
                  <Text color="$red10" fontSize="$2">
                    {errors.heightFeet || errors.heightInches}
                  </Text>
                )}
              </YStack>
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Current Weight (lbs)
              </Text>
              <YStack gap="$1">
                <Input
                  placeholder="e.g. 154"
                  value={formData.weight}
                  onChangeText={(v) => updateField('weight', v)}
                  keyboardType="decimal-pad"
                  disabled={isPending}
                />
                {errors.weight && (
                  <Text color="$red10" fontSize="$2">
                    {errors.weight}
                  </Text>
                )}
              </YStack>
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
                {primaryGoalOptions.map((goal) => (
                  <Button
                    key={goal}
                    size="$3"
                    onPress={() => toggleGoal(goal)}
                    opacity={formData.primaryGoals.includes(goal) ? 1 : 0.5}
                    disabled={isPending}
                  >
                    {goal}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Dietary Preferences
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {dietaryOptions.map((option) => (
                  <Button
                    key={option}
                    size="$3"
                    onPress={() => toggleDietary(option)}
                    opacity={
                      formData.dietaryPreferences.includes(option) ? 1 : 0.5
                    }
                    disabled={isPending}
                  >
                    {option}
                  </Button>
                ))}
              </XStack>
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Allergies/Intolerances
              </Text>
              <Text fontSize="$2" opacity={0.7}>
                Optional
              </Text>
              <Input
                placeholder="e.g. nuts, soy, lactose"
                value={formData.allergies}
                onChangeText={(v) => updateField('allergies', v)}
                disabled={isPending}
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
              <Input
                placeholder="Tell us about your main health challenge..."
                value={formData.healthChallenge}
                onChangeText={(v) => updateField('healthChallenge', v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                disabled={isPending}
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
            {errors.age && <Text color="$red10">• Age: {errors.age}</Text>}
            {errors.weight && (
              <Text color="$red10">• Weight: {errors.weight}</Text>
            )}
            {errors.heightFeet && (
              <Text color="$red10">• Height (feet): {errors.heightFeet}</Text>
            )}
            {errors.heightInches && (
              <Text color="$red10">
                • Height (inches): {errors.heightInches}
              </Text>
            )}
          </YStack>
        )}

        {renderStep()}

        <XStack gap="$2" justifyContent="space-between">
          {currentStep > 1 && (
            <Button variant="outlined" onPress={prevStep} disabled={isPending}>
              Previous
            </Button>
          )}
          <YStack flex={1} />
          {currentStep < totalSteps ? (
            <Button onPress={nextStep} disabled={isPending}>
              Next
            </Button>
          ) : (
            <Button onPress={handleSubmit} disabled={isPending}>
              {isPending ? (
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
