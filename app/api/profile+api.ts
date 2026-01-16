import { eq } from 'drizzle-orm';
import { type ProfileResponse, upsertProfileSchema } from '@/lib/api/profile';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, userProfile } from '@/lib/db';
import { calculateProfileCompletion } from '@/lib/profile-utils';

export const GET = withAuth(async (_request, session) => {
  const profile = await db.query.userProfile.findFirst({
    where: eq(userProfile.userId, session.user.id),
  });

  if (!profile) {
    return errorResponse('Profile not found', 404);
  }

  // Compute completion percentage from actual fields
  const profileCompletionPercentage = calculateProfileCompletion(profile);

  return json<ProfileResponse>({
    ...profile,
    profileCompletionPercentage,
  });
});

export const PUT = withAuth(async (request, session) => {
  const parsed = await parseBody(request, upsertProfileSchema);

  if (!parsed.success) {
    return parsed.error;
  }

  const updateData = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  const [profile] = await db
    .insert(userProfile)
    .values({
      userId: session.user.id,
      ...parsed.data,
    })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: updateData,
    })
    .returning();

  // Compute completion percentage from actual fields
  const profileCompletionPercentage = calculateProfileCompletion(profile);

  return json<ProfileResponse>({
    ...profile,
    profileCompletionPercentage,
  });
});
