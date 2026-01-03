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

  const [profile] = await db
    .insert(userProfile)
    .values({
      userId: session.user.id,
      ...parsed.data,
    })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: {
        ...parsed.data,
        updatedAt: new Date(),
      },
    })
    .returning();

  return json<ProfileResponse>(profile);
});
