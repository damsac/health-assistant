import { eq } from 'drizzle-orm';
import { db, profileSection, userProfile } from '@/lib/db';
import type { Section } from '@/lib/profile-sections-config';
import { SECTIONS_CONFIG } from '@/lib/profile-sections-config';

/**
 * Calculate profile completion percentage for a user
 * @param userId - The user ID to calculate completion for
 * @returns Promise<number> - The completion percentage (0-100)
 */
export async function calculateProfileCompletion(
  userId: string,
): Promise<number> {
  const sections = await db.query.profileSection.findMany({
    where: eq(profileSection.userId, userId),
  });

  const sectionKeys = ['sleep', 'garmin', 'eating', 'supplements', 'lifestyle'];
  const completedCount = sections.filter(
    (s) => s.completed && sectionKeys.includes(s.sectionKey),
  ).length;

  // Base completion is 40% from onboarding
  // Each completed section adds 12%
  return Math.min(40 + completedCount * 12, 100);
}

/**
 * Mark a profile section as complete and update the overall completion percentage
 * @param userId - The user ID
 * @param sectionKey - The section key to mark complete
 */
export async function markSectionComplete(
  userId: string,
  sectionKey: string,
): Promise<void> {
  console.log('[markSectionComplete] Starting transaction for:', {
    userId,
    sectionKey,
  });
  try {
    await db.transaction(async (tx) => {
      console.log('[markSectionComplete] Inserting/updating section...');
      // Insert or update the section as completed
      await tx
        .insert(profileSection)
        .values({
          userId,
          sectionKey,
          completed: true,
          completedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [profileSection.userId, profileSection.sectionKey],
          set: {
            completed: true,
            completedAt: new Date(),
          },
        });

      console.log(
        '[markSectionComplete] Section inserted/updated, calculating completion...',
      );
      // Calculate and update the profile completion percentage
      const completionPercentage = await calculateProfileCompletion(userId);
      console.log(
        '[markSectionComplete] Completion percentage:',
        completionPercentage,
      );

      console.log('[markSectionComplete] Updating user profile...');
      await tx
        .update(userProfile)
        .set({
          profileCompletionPercentage: completionPercentage,
          updatedAt: new Date(),
        })
        .where(eq(userProfile.userId, userId));
      console.log('[markSectionComplete] Transaction complete');
    });
  } catch (error) {
    console.error('[markSectionComplete] Transaction failed:', error);
    throw error;
  }
}

/**
 * Get all incomplete profile sections for a user
 * @param userId - The user ID
 * @returns Promise<Section[]> - Array of incomplete sections
 */
export async function getIncompleteSections(
  userId: string,
): Promise<Section[]> {
  const sections = await db.query.profileSection.findMany({
    where: eq(profileSection.userId, userId),
  });

  const completedKeys = new Set(
    sections.filter((s) => s.completed).map((s) => s.sectionKey),
  );

  return SECTIONS_CONFIG.filter((section) => !completedKeys.has(section.key));
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

/**
 * Check if a specific section is complete for a user
 * @param userId - The user ID
 * @param sectionKey - The section key to check
 * @returns Promise<boolean> - True if section is complete
 */
export async function isSectionComplete(
  userId: string,
  sectionKey: string,
): Promise<boolean> {
  const section = await db.query.profileSection.findFirst({
    where: eq(profileSection.userId, userId),
  });

  return section?.completed === true && section.sectionKey === sectionKey;
}
