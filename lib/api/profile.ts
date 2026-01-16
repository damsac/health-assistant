import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  genderEnum,
  sleepQualityEnum,
  stressLevelEnum,
  userProfile,
} from '@/lib/db/schema';

// Shared validation bounds (used by both server and form)
export const PROFILE_BOUNDS = {
  heightCm: { min: 50, max: 275 },
  weightKg: { min: 20, max: 650 },
  weightLbs: { min: 44, max: 1430 },
  age: { min: 13, max: 120 },
} as const;

// Server-side validation schema (transforms dateOfBirth string to Date for DB)
export const upsertProfileSchema = z
  .object({
    heightCm: z
      .number()
      .int()
      .min(PROFILE_BOUNDS.heightCm.min)
      .max(PROFILE_BOUNDS.heightCm.max)
      .nullable(),
    weightGrams: z
      .number()
      .int()
      .min(PROFILE_BOUNDS.weightKg.min * 1000)
      .max(PROFILE_BOUNDS.weightKg.max * 1000)
      .nullable(),
    gender: z.enum(genderEnum).nullable(),
    dateOfBirth: z
      .string()
      .datetime()
      .transform((s) => new Date(s))
      .nullable(),
    measurementSystem: z.enum(['metric', 'imperial']),
    dietaryPreferences: z.array(z.string()).nullable(),
    primaryGoals: z.array(z.string()).nullable(),
    allergies: z.string().nullable(),
    // New fields for progressive profile completion
    sleepHoursAverage: z
      .number()
      .min(4)
      .max(12)
      .nullable()
      .transform((n) => n?.toString()),
    sleepQuality: z.enum(sleepQualityEnum).nullable(),
    typicalWakeTime: z.string().nullable(),
    typicalBedTime: z.string().nullable(),
    mealsPerDay: z.number().min(1).max(6).nullable(),
    typicalMealTimes: z.array(z.string()).nullable(),
    snackingHabits: z.string().nullable(),
    supplementsMedications: z.string().nullable(),
    healthConditions: z.array(z.string()).nullable(),
    stressLevel: z.enum(stressLevelEnum).nullable(),
    exerciseFrequency: z.string().nullable(),
    exerciseTypes: z.array(z.string()).nullable(),
    waterIntakeLiters: z
      .number()
      .min(0)
      .max(5)
      .nullable()
      .transform((n) => n?.toString()),
    garminConnected: z.boolean().optional(),
    garminUserId: z.string().nullable(),
    profileCompletionPercentage: z.number().min(0).max(100).optional(),
  })
  .partial();

// Types derived from schemas
const selectSchema = createSelectSchema(userProfile);
export type UpsertProfileRequest = z.input<typeof upsertProfileSchema>; // What client sends (dateOfBirth as string)
export type ProfileResponse = z.infer<typeof selectSchema>;

// API contract
export type ProfileApi = {
  GET: { response: ProfileResponse };
  PUT: { request: UpsertProfileRequest; response: ProfileResponse };
};
