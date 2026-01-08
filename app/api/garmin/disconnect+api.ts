import { eq } from 'drizzle-orm';
import type { DisconnectGarminResponse } from '@/lib/api/garmin';
import { json, withAuth } from '@/lib/api-middleware';
import { db, garminConnection } from '@/lib/db';

export const DELETE = withAuth(async (_request, session) => {
  await db
    .update(garminConnection)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(garminConnection.userId, session.user.id));

  const response: DisconnectGarminResponse = {
    success: true,
    message: 'Garmin disconnected successfully',
  };

  return json<DisconnectGarminResponse>(response);
});
