import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input, Spinner, Text, XStack, YStack } from '@/components/ui';
import { PROFILE_BOUNDS, type UpsertProfileRequest } from '@/lib/api/profile';
import { type Gender, genderEnum } from '@/lib/db/schema';
import { useUpsertProfile } from '@/lib/hooks/use-profile';
import {
  cmToFeetInches,
  convertWeightBetweenSystems,
  feetInchesToCm,
  gramsToKg,
  kgToGrams,
  kgToLbs,
  lbsToKg,
  type MeasurementSystem,
} from '@/lib/units';

const genderLabels: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};

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

// Form schema - validates string inputs, transforms to API format
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
      gender: z.enum([...genderEnum, '']),
      dateOfBirth: z
        .string()
        .refine(
          (v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v),
          'Use YYYY-MM-DD',
        ),
      dietaryPreferences: z.string(),
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

      const prefs = data.dietaryPreferences
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      return {
        heightCm: heightCmVal,
        weightGrams,
        gender: data.gender === '' ? null : data.gender,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth).toISOString()
          : null,
        measurementSystem,
        dietaryPreferences: prefs.length ? prefs : null,
      };
    });
};

type FormInput = z.input<ReturnType<typeof createFormSchema>>;

type InitialProfile = {
  heightCm: number | null;
  weightGrams: number | null;
  gender: string | null;
  dateOfBirth: Date | null;
  measurementSystem: string | null;
  dietaryPreferences: string[] | null;
};

type ProfileFormProps = {
  initialProfile?: InitialProfile | null;
  onSuccess: () => void;
  submitLabel?: string;
};

function formatDateForInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getInitialValues(
  profile: InitialProfile | null | undefined,
  isMetric: boolean,
): FormInput {
  if (!profile) {
    return {
      heightCm: '',
      heightFeet: '',
      heightInches: '',
      weight: '',
      gender: '',
      dateOfBirth: '',
      dietaryPreferences: '',
    };
  }

  let heightCm = '',
    heightFeet = '',
    heightInches = '',
    weight = '';

  if (profile.heightCm) {
    if (isMetric) {
      heightCm = String(profile.heightCm);
    } else {
      const { feet, inches } = cmToFeetInches(profile.heightCm);
      heightFeet = String(feet);
      heightInches = String(inches);
    }
  }

  if (profile.weightGrams) {
    const kg = gramsToKg(profile.weightGrams);
    weight = String(isMetric ? kg : kgToLbs(kg));
  }

  return {
    heightCm,
    heightFeet,
    heightInches,
    weight,
    gender: (profile.gender as Gender | '') || '',
    dateOfBirth: profile.dateOfBirth
      ? formatDateForInput(profile.dateOfBirth)
      : '',
    dietaryPreferences: profile.dietaryPreferences?.join(', ') || '',
  };
}

export function ProfileForm({
  initialProfile,
  onSuccess,
  submitLabel = 'Save',
}: ProfileFormProps) {
  const upsertProfile = useUpsertProfile();
  const initialSystem =
    (initialProfile?.measurementSystem as MeasurementSystem) || 'metric';
  const [measurementSystem, setMeasurementSystem] =
    useState<MeasurementSystem>(initialSystem);
  const isMetric = measurementSystem === 'metric';

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormInput, unknown, UpsertProfileRequest>({
    resolver: zodResolver(createFormSchema(isMetric, measurementSystem)),
    defaultValues: getInitialValues(initialProfile, initialSystem === 'metric'),
  });

  const handleSystemChange = (newSystem: MeasurementSystem) => {
    if (newSystem === measurementSystem) return;
    const values = getValues();

    if (newSystem === 'imperial' && values.heightCm) {
      const cm = Number.parseFloat(values.heightCm);
      if (!Number.isNaN(cm)) {
        const { feet, inches } = cmToFeetInches(cm);
        setValue('heightFeet', String(feet));
        setValue('heightInches', String(inches));
      }
    } else if (newSystem === 'metric') {
      const feet = Number.parseFloat(values.heightFeet || '0') || 0;
      const inches = Number.parseFloat(values.heightInches || '0') || 0;
      if (feet || inches)
        setValue('heightCm', String(feetInchesToCm(feet, inches)));
    }

    if (values.weight) {
      const w = Number.parseFloat(values.weight);
      if (!Number.isNaN(w))
        setValue(
          'weight',
          String(convertWeightBetweenSystems(w, measurementSystem, newSystem)),
        );
    }

    setMeasurementSystem(newSystem);
  };

  const onSubmit = async (data: UpsertProfileRequest) => {
    try {
      await upsertProfile.mutateAsync(data);
      onSuccess();
    } catch {
      // handled by mutation
    }
  };

  const serverError = upsertProfile.error?.message ?? null;

  return (
    <YStack gap="$4">
      <XStack gap="$2">
        <Button
          flex={1}
          onPress={() => handleSystemChange('metric')}
          opacity={isMetric ? 1 : 0.5}
        >
          Metric (cm, kg)
        </Button>
        <Button
          flex={1}
          onPress={() => handleSystemChange('imperial')}
          opacity={!isMetric ? 1 : 0.5}
        >
          Imperial (ft/in, lbs)
        </Button>
      </XStack>

      {serverError && (
        <Text color="$red10" textAlign="center">
          {serverError}
        </Text>
      )}

      <YStack gap="$2">
        <Text>Height</Text>
        {isMetric ? (
          <Controller
            control={control}
            name="heightCm"
            render={({ field: { onChange, onBlur, value } }) => (
              <YStack gap="$1">
                <XStack gap="$2" alignItems="center">
                  <Input
                    flex={1}
                    placeholder="e.g. 175"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    disabled={upsertProfile.isPending}
                  />
                  <Text width={30}>cm</Text>
                </XStack>
                {errors.heightCm && (
                  <Text color="$red10" fontSize="$2">
                    {errors.heightCm.message}
                  </Text>
                )}
              </YStack>
            )}
          />
        ) : (
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
        )}
      </YStack>

      <YStack gap="$2">
        <Text>Weight ({isMetric ? 'kg' : 'lbs'})</Text>
        <Controller
          control={control}
          name="weight"
          render={({ field: { onChange, onBlur, value } }) => (
            <YStack gap="$1">
              <Input
                placeholder={isMetric ? 'e.g. 70.5' : 'e.g. 154'}
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

      <YStack gap="$2">
        <Text>Gender</Text>
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, value } }) => (
            <XStack gap="$2" flexWrap="wrap">
              {genderEnum.map((g) => (
                <Button
                  key={g}
                  size="$3"
                  onPress={() => onChange(value === g ? '' : g)}
                  opacity={value === g ? 1 : 0.5}
                  disabled={upsertProfile.isPending}
                >
                  {genderLabels[g]}
                </Button>
              ))}
            </XStack>
          )}
        />
      </YStack>

      <YStack gap="$2">
        <Text>Date of Birth</Text>
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { onChange, onBlur, value } }) => (
            <YStack gap="$1">
              <Input
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                disabled={upsertProfile.isPending}
              />
              <Text fontSize="$2" opacity={0.6}>
                Format: YYYY-MM-DD (e.g. 1990-05-15)
              </Text>
              {errors.dateOfBirth && (
                <Text color="$red10" fontSize="$2">
                  {errors.dateOfBirth.message}
                </Text>
              )}
            </YStack>
          )}
        />
      </YStack>

      <YStack gap="$2">
        <Text>Dietary Preferences</Text>
        <Controller
          control={control}
          name="dietaryPreferences"
          render={({ field: { onChange, onBlur, value } }) => (
            <YStack gap="$1">
              <Input
                placeholder="e.g. vegetarian, gluten-free"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                disabled={upsertProfile.isPending}
              />
              <Text fontSize="$2" opacity={0.6}>
                Separate with commas
              </Text>
            </YStack>
          )}
        />
      </YStack>

      <Button
        onPress={handleSubmit(onSubmit)}
        disabled={upsertProfile.isPending}
      >
        {upsertProfile.isPending ? (
          <XStack gap="$2" alignItems="center">
            <Spinner size="small" />
            <Text>Saving...</Text>
          </XStack>
        ) : (
          submitLabel
        )}
      </Button>
    </YStack>
  );
}
