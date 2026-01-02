import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { genderEnum, userProfile } from '@/lib/db/schema';

// Shared validation bounds (used by both server and form)
export const PROFILE_BOUNDS = {
  heightCm: { min: 50, max: 275 },
  weightKg: { min: 20, max: 650 },
  weightLbs: { min: 44, max: 1430 },
  age: { min: 13, max: 120 },
} as const;

// Server-side validation schema (transforms dateOfBirth string to Date for DB)
export const upsertProfileSchema = z.object({
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
});

// Types derived from schemas
const selectSchema = createSelectSchema(userProfile);
export type UpsertProfileRequest = z.input<typeof upsertProfileSchema>; // What client sends (dateOfBirth as string)
export type ProfileResponse = z.infer<typeof selectSchema>;

// API contract
export type ProfileApi = {
  GET: { response: ProfileResponse };
  PUT: { request: UpsertProfileRequest; response: ProfileResponse };
};
