/**
 * Partial Profile Update API
 * Allows updating specific profile fields without requiring all fields to be present.
 * Used by profile section forms (sleep, eating, supplements, lifestyle) to update
 * only the relevant fields without overwriting the entire profile.
 */

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, userProfile } from '@/lib/db';
import { calculateProfileCompletion } from '@/lib/profile-utils';

const partialUpdateSchema = z.object({
  sleepHoursAverage: z.number().min(4).max(12).optional(),
  sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
  typicalWakeTime: z.string().optional(),
  typicalBedTime: z.string().optional(),
  mealsPerDay: z.number().min(1).max(6).optional(),
  typicalMealTimes: z.array(z.string()).optional(),
  snackingHabits: z.string().optional(),
  supplementsMedications: z.string().optional(),
  stressLevel: z.enum(['low', 'moderate', 'high']).optional(),
  exerciseFrequency: z.string().optional(),
  exerciseTypes: z.array(z.string()).optional(),
  waterIntakeLiters: z.number().min(0).max(5).optional(),
  garminConnected: z.boolean().optional(),
  garminUserId: z.string().nullable().optional(),
});

export const PATCH = withAuth(async (request, session) => {
  const parsed = await parseBody(request, partialUpdateSchema);

  if (!parsed.success) {
    return parsed.error;
  }

  const data = parsed.data;

  // Transform numbers to strings for decimal fields
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.sleepHoursAverage !== undefined) {
    updateData.sleepHoursAverage = data.sleepHoursAverage.toString();
  }

  if (data.waterIntakeLiters !== undefined) {
    updateData.waterIntakeLiters = data.waterIntakeLiters.toString();
  }

  try {
    const [profile] = await db
      .update(userProfile)
      .set(updateData)
      .where(eq(userProfile.userId, session.user.id))
      .returning();

    if (!profile) {
      return errorResponse(
        'Profile not found. Please complete onboarding first.',
        404,
      );
    }

    // Compute completion percentage from actual fields
    const profileCompletionPercentage = calculateProfileCompletion(profile);

    return json({
      ...profile,
      profileCompletionPercentage,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return errorResponse('Failed to update profile', 500);
  }
});
