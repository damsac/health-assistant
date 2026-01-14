import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, profileSection, userProfile } from '@/lib/db';
import {
  calculateProfileCompletion,
  markSectionComplete,
} from '@/lib/profile-utils';

const updateSectionSchema = z.object({
  sectionKey: z.string(),
  completed: z.boolean(),
});

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
    console.log('[profile-sections] Updating section:', {
      userId: session.user.id,
      sectionKey,
      completed,
    });
    if (completed) {
      // Mark section as complete and update percentage
      console.log('[profile-sections] Calling markSectionComplete...');
      await markSectionComplete(session.user.id, sectionKey);
      console.log('[profile-sections] Section marked complete successfully');
    } else {
      // Mark section as incomplete (set completed to false)
      await db
        .insert(profileSection)
        .values({
          userId: session.user.id,
          sectionKey,
          completed: false,
          completedAt: null,
        })
        .onConflictDoUpdate({
          target: [profileSection.userId, profileSection.sectionKey],
          set: {
            completed: false,
            completedAt: null,
          },
        });

      // Recalculate percentage
      const completionPercentage = await calculateProfileCompletion(
        session.user.id,
      );
      await db
        .update(userProfile)
        .set({
          profileCompletionPercentage: completionPercentage,
          updatedAt: new Date(),
        })
        .where(eq(userProfile.userId, session.user.id));
    }

    // Return updated sections list
    const sections = await db.query.profileSection.findMany({
      where: eq(profileSection.userId, session.user.id),
    });

    return json(sections[sections.length - 1]); // Return the last updated section
  } catch (error) {
    console.error('[profile-sections] Error updating profile section:', error);
    console.error(
      '[profile-sections] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
    return errorResponse(
      `Failed to update profile section: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
    );
  }
});
