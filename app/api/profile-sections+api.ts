import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, profileSection } from '@/lib/db';

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

    return json(section);
  } catch (error) {
    console.error('Error updating profile section:', error);
    return errorResponse('Failed to update profile section', 500);
  }
});
