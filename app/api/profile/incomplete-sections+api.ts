import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { getIncompleteSections } from '@/lib/profile-utils';

export const GET = withAuth(async (_request, session) => {
  try {
    const incompleteSections = await getIncompleteSections(session.user.id);
    return json(incompleteSections);
  } catch (error) {
    console.error('Error fetching incomplete sections:', error);
    return errorResponse('Failed to fetch incomplete sections', 500);
  }
});
