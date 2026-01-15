import { eq } from 'drizzle-orm';
import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { db, userProfile } from '@/lib/db';
import { isOnboardingComplete } from '@/lib/profile-utils';

export const GET = withAuth(async (_request, session) => {
  try {
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, session.user.id),
    });

    const isComplete = isOnboardingComplete(profile ?? null);
    return json({ isComplete });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return errorResponse('Failed to check onboarding status', 500);
  }
});
