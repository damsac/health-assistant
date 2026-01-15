import { eq } from 'drizzle-orm';
import { db, userProfile } from '@/lib/db';
import type { Section } from '@/lib/profile-sections-config';
import { SECTIONS_CONFIG } from '@/lib/profile-sections-config';

/**
 * Check if a specific profile section is complete based on field presence
 * @param profile - The user profile object
 * @param sectionKey - The section key to check
 * @returns boolean - True if all required fields for the section are filled
 */
export function isSectionComplete(
  profile: Record<string, unknown>,
  sectionKey: string,
): boolean {
  if (!profile) return false;

  switch (sectionKey) {
    case 'sleep':
      return !!(
        profile.sleepHoursAverage &&
        profile.sleepQuality &&
        profile.typicalWakeTime &&
        profile.typicalBedTime
      );
    case 'eating':
      return !!(
        profile.mealsPerDay &&
        profile.typicalMealTimes &&
        Array.isArray(profile.typicalMealTimes) &&
        profile.typicalMealTimes.length > 0
      );
    case 'supplements':
      return !!profile.supplementsMedications;
    case 'lifestyle':
      return !!(
        profile.stressLevel &&
        profile.exerciseFrequency &&
        profile.exerciseTypes &&
        Array.isArray(profile.exerciseTypes) &&
        profile.exerciseTypes.length > 0
      );
    case 'garmin':
      return !!profile.garminConnected;
    default:
      return false;
  }
}

/**
 * Calculate profile completion percentage based on filled fields
 * @param profile - The user profile object
 * @returns number - The completion percentage (0-100)
 */
export function calculateProfileCompletion(
  profile: Record<string, unknown>,
): number {
  if (!profile) return 0;

  // Check onboarding completion (40%)
  const hasBasicInfo = !!(
    profile.heightCm ||
    profile.weightGrams ||
    profile.gender ||
    profile.dateOfBirth
  );

  const baseCompletion = hasBasicInfo ? 40 : 0;

  // Check each section (12% each, 5 sections = 60%)
  const sectionKeys = ['sleep', 'garmin', 'eating', 'supplements', 'lifestyle'];
  const completedCount = sectionKeys.filter((key) =>
    isSectionComplete(profile, key),
  ).length;

  return Math.min(baseCompletion + completedCount * 12, 100);
}

/**
 * Get all incomplete profile sections based on field presence
 * @param profile - The user profile object
 * @returns Section[] - Array of incomplete sections
 */
export function getIncompleteSections(
  profile: Record<string, unknown>,
): Section[] {
  if (!profile) return SECTIONS_CONFIG;

  return SECTIONS_CONFIG.filter(
    (section) => !isSectionComplete(profile, section.key),
  );
}

/**
 * Check if a user has completed basic onboarding
 * @param userId - The user ID
 * @returns Promise<boolean> - True if onboarding is complete
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, userId),
  });

  if (!profile) {
    return false;
  }

  // Check if essential onboarding fields are filled
  const hasBasicInfo = !!(
    profile.heightCm ||
    profile.weightGrams ||
    profile.gender ||
    profile.dateOfBirth
  );

  const hasMeasurementSystem = !!profile.measurementSystem;

  return hasBasicInfo && hasMeasurementSystem;
}

/**
 * Get all sections configuration
 * @returns Section[] - All available sections
 */
export function getAllSections(): Section[] {
  return SECTIONS_CONFIG;
}

// Re-export for convenience
export type { Section };
