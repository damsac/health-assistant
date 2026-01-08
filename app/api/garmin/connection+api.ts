import { eq } from 'drizzle-orm';
import type { GarminConnectionResponse } from '@/lib/api/garmin';
import { json, withAuth } from '@/lib/api-middleware';
import { db, garminConnection } from '@/lib/db';

export const GET = withAuth(async (_request, session) => {
  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, session.user.id),
  });

  return json<GarminConnectionResponse | null>(connection || null);
});
