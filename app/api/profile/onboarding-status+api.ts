import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { isOnboardingComplete } from '@/lib/profile-utils';

export const GET = withAuth(async (_request, session) => {
  try {
    const isComplete = await isOnboardingComplete(session.user.id);
    return json({ isComplete });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return errorResponse('Failed to check onboarding status', 500);
  }
});
