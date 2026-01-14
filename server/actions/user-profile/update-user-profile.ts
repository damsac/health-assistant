import { type Tool, tool } from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { genderEnum, userProfile } from '@/lib/db/schema';
import { feetInchesToCm, kgToGrams } from '@/lib/units';
import type { ToolExecutionContext } from '../tools';

const profileUpdatePayloadSchema = z.object({
  heightCm: z.number().int().positive().optional(),
  weightGrams: z.number().int().positive().optional(),
  gender: z.enum(genderEnum).optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  dateOfBirth: z.string().datetime().optional(), // ISO 8601 string
  measurementSystem: z.enum(['metric', 'imperial']).optional(),
});

type ProfileUpdatePayload = z.infer<typeof profileUpdatePayloadSchema>;

const profileUpdateToolInputSchema = z.object({
  weightLbs: z.number().positive().optional().describe('Weight in pounds'),
  weightKg: z.number().positive().optional().describe('Weight in kilograms'),
  heightFeet: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Height feet component'),
  heightInches: z
    .number()
    .min(0)
    .max(11)
    .optional()
    .describe('Height inches component (0-11)'),
  heightCm: z.number().positive().optional().describe('Height in centimeters'),
  gender: z.enum(genderEnum).optional().describe('Gender identity'),
  dietaryPreferences: z
    .array(z.string())
    .optional()
    .describe(
      'List of dietary preferences (e.g., vegetarian, vegan, gluten-free)',
    ),
  dateOfBirth: z
    .string()
    .optional()
    .describe('Date of birth in YYYY-MM-DD format'),
  measurementSystem: z
    .enum(['metric', 'imperial'])
    .optional()
    .describe('Preferred measurement system'),
});

type ProfileUpdateToolInput = z.infer<typeof profileUpdateToolInputSchema>;

/**
 * Transform user-friendly input to canonical payload format
 */
function transformProfileUpdateInput(
  input: ProfileUpdateToolInput,
): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = {};

  // Convert weight to grams (canonical format)
  if (input.weightKg !== undefined) {
    payload.weightGrams = kgToGrams(input.weightKg);
  } else if (input.weightLbs !== undefined) {
    // lbs -> kg -> grams
    const kg = input.weightLbs * 0.453592;
    payload.weightGrams = kgToGrams(kg);
  }

  // Convert height to cm (canonical format)
  if (input.heightCm !== undefined) {
    payload.heightCm = Math.round(input.heightCm);
  } else if (input.heightFeet !== undefined) {
    const inches = input.heightInches ?? 0;
    payload.heightCm = feetInchesToCm(input.heightFeet, inches);
  }

  // Pass through other fields
  if (input.gender !== undefined) {
    payload.gender = input.gender;
  }
  if (input.dietaryPreferences !== undefined) {
    payload.dietaryPreferences = input.dietaryPreferences;
  }
  if (input.dateOfBirth !== undefined) {
    // Convert YYYY-MM-DD to ISO 8601 datetime
    payload.dateOfBirth = new Date(input.dateOfBirth).toISOString();
  }
  if (input.measurementSystem !== undefined) {
    payload.measurementSystem = input.measurementSystem;
  }

  return payload;
}

/**
 * Output type for profile update tool
 */
type ProfileUpdateResult = {
  success: boolean;
  updatedFields: string[];
};

/**
 * Profile update tool definition with explicit typing
 */
export const createProfileUpdateTool = (
  context: ToolExecutionContext,
): Tool<ProfileUpdateToolInput, ProfileUpdateResult> =>
  tool<ProfileUpdateToolInput, ProfileUpdateResult>({
    description: `Update the user's health profile. Use this when the user mentions health info like weight, height, age, gender, or dietary preferences. Only include fields that the user explicitly mentioned.`,
    inputSchema: profileUpdateToolInputSchema,
    needsApproval: true,
    execute: async (input): Promise<ProfileUpdateResult> => {
      // Transform user-friendly input to canonical format
      const payload = transformProfileUpdateInput(input);

      // Check if profile exists
      const existingProfile = await db.query.userProfile.findFirst({
        where: eq(userProfile.userId, context.userId),
      });

      // Build update data and track which fields are being updated
      const updatedFields: string[] = [];
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (payload.heightCm) {
        updateData.heightCm = payload.heightCm;
        updatedFields.push('height');
      }
      if (payload.weightGrams) {
        updateData.weightGrams = payload.weightGrams;
        updatedFields.push('weight');
      }
      if (payload.gender) {
        updateData.gender = payload.gender;
        updatedFields.push('gender');
      }
      if (payload.dietaryPreferences) {
        updateData.dietaryPreferences = payload.dietaryPreferences;
        updatedFields.push('dietary preferences');
      }
      if (payload.dateOfBirth) {
        updateData.dateOfBirth = new Date(payload.dateOfBirth);
        updatedFields.push('date of birth');
      }
      if (payload.measurementSystem) {
        updateData.measurementSystem = payload.measurementSystem;
        updatedFields.push('measurement system');
      }

      if (existingProfile) {
        await db
          .update(userProfile)
          .set(updateData)
          .where(eq(userProfile.userId, context.userId));
      } else {
        await db.insert(userProfile).values({
          userId: context.userId,
          ...updateData,
        });
      }

      return { success: true, updatedFields };
    },
  });
