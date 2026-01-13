import { eq } from 'drizzle-orm';
import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { db, profileSection, userProfile } from '@/lib/db';

export const POST = withAuth(async (_request, session) => {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return errorResponse('Not available in production', 403);
  }

  try {
    // Delete user's profile sections
    await db
      .delete(profileSection)
      .where(eq(profileSection.userId, session.user.id));

    // Delete user's profile
    await db.delete(userProfile).where(eq(userProfile.userId, session.user.id));

    return json({ success: true, message: 'Profile reset successfully' });
  } catch (error) {
    console.error('Failed to reset profile:', error);
    return errorResponse('Failed to reset profile', 500);
  }
});
