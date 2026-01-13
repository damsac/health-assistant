import { eq } from 'drizzle-orm';
import { type ProfileResponse, upsertProfileSchema } from '@/lib/api/profile';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, userProfile } from '@/lib/db';

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
  const existingProfile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id),
  });

  const updateData = {
    ...parsed.data,
    updatedAt: new Date(),
    // Set completion percentage to 40 if this is onboarding
    profileCompletionPercentage:
      existingProfile?.profileCompletionPercentage ?? 40,
  };

  const [profile] = await db
    .insert(userProfile)
    .values({
      userId: session.user.id,
      ...parsed.data,
      profileCompletionPercentage: 40,
    })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: updateData,
    })
    .returning();

  return json<ProfileResponse>(profile);
});
