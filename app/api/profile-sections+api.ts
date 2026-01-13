import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, profileSection, userProfile } from '@/lib/db';

const updateSectionSchema = z.object({
  sectionKey: z.string(),
  completed: z.boolean(),
});

// Calculate profile completion percentage based on completed sections
async function calculateCompletionPercentage(userId: string): Promise<number> {
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

export const GET = withAuth(async (_request, session) => {
  try {
    const sections = await db.query.profileSection.findMany({
      where: eq(profileSection.userId, session.user.id),
    });

    return json(sections);
  } catch (error) {
    console.error('Error fetching profile sections:', error);
    return errorResponse('Failed to fetch profile sections', 500);
  }
});

export const POST = withAuth(async (request, session) => {
  const parsed = await parseBody(request, updateSectionSchema);

  if (!parsed.success) {
    return parsed.error;
  }

  const { sectionKey, completed } = parsed.data;

  try {
    // Update the section
    const [section] = await db
      .insert(profileSection)
      .values({
        userId: session.user.id,
        sectionKey,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [profileSection.userId, profileSection.sectionKey],
        set: {
          completed,
          completedAt: completed ? new Date() : null,
        },
      })
      .returning();

    // Calculate and update profile completion percentage
    const completionPercentage = await calculateCompletionPercentage(
      session.user.id,
    );
    await db
      .update(userProfile)
      .set({
        profileCompletionPercentage: completionPercentage,
        updatedAt: new Date(),
      })
      .where(eq(userProfile.userId, session.user.id));

    return json(section);
  } catch (error) {
    console.error('Error updating profile section:', error);
    return errorResponse('Failed to update profile section', 500);
  }
});
