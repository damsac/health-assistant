import { eq } from 'drizzle-orm';
import type { SyncGarminResponse } from '@/lib/api/garmin';
import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { db, garminConnection } from '@/lib/db';
import { createGarminClient } from '@/server/services/garmin-sync';

export const POST = withAuth(async (_request, session) => {
  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, session.user.id),
  });

  if (!connection) {
    return errorResponse('No Garmin connection found', 404);
  }

  if (!connection.isActive) {
    return errorResponse('Garmin connection is inactive', 400);
  }

  try {
    // Create Garmin client with existing tokens
    const garminClient = await createGarminClient(session.user.id);

    // Sync last 7 days
    await garminClient.syncLastNDays(7);

    const response: SyncGarminResponse = {
      success: true,
      message: 'Garmin data synced successfully',
    };

    return json<SyncGarminResponse>(response);
  } catch (error) {
    console.error('Garmin sync failed:', error);

    // Update sync status in database
    await db
      .update(garminConnection)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncError: error instanceof Error ? error.message : 'Sync failed',
      })
      .where(eq(garminConnection.userId, session.user.id));

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to sync Garmin data',
      500,
    );
  }
});
