import { eq } from 'drizzle-orm';
import { type ProfileResponse, upsertProfileSchema } from '@/lib/api/profile';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, profileSection, userProfile } from '@/lib/db';

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
  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id),
  });

  if (!profile) {
    return errorResponse('Profile not found', 404);
  }

  return json<ProfileResponse>(profile);
});

export const PUT = withAuth(async (request, session) => {
  const parsed = await parseBody(request, upsertProfileSchema);

  if (!parsed.success) {
    return parsed.error;
  }

  // Check if this is the first time completing the profile
  const _existingProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id),
  });

  // Calculate completion percentage based on sections
  const completionPercentage = await calculateCompletionPercentage(
    session.user.id,
  );

  const updateData = {
    ...parsed.data,
    updatedAt: new Date(),
    profileCompletionPercentage: completionPercentage,
  };

  const [profile] = await db
    .insert(userProfile)
    .values({
      userId: session.user.id,
      ...parsed.data,
      profileCompletionPercentage: completionPercentage,
    })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: updateData,
    })
    .returning();

  return json<ProfileResponse>(profile);
});
