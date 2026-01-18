import { and, eq } from 'drizzle-orm';
import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { dailyLog, db } from '@/lib/db';

export const DELETE = withAuth(async (request, session) => {
  // Extract ID from URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id || id === 'daily-log') {
    return errorResponse('Missing or invalid entry ID', 400);
  }

  // Find the entry to verify it exists and belongs to the user
  const entry = await db.query.dailyLog.findFirst({
    where: and(eq(dailyLog.id, id), eq(dailyLog.userId, session.user.id)),
  });

  if (!entry) {
    return errorResponse('Entry not found or unauthorized', 404);
  }

  // Delete the entry
  await db.delete(dailyLog).where(eq(dailyLog.id, id));

  return json({ success: true, id }, { status: 200 });
});
