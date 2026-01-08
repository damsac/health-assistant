import { eq } from 'drizzle-orm';
import {
  type ConnectGarminResponse,
  connectGarminSchema,
} from '@/lib/api/garmin';
import { errorResponse, json, parseBody, withAuth } from '@/lib/api-middleware';
import { db, garminConnection } from '@/lib/db';
import { createGarminClient } from '@/server/services/garmin-sync';

export const POST = withAuth(async (request, session) => {
  const parsed = await parseBody(request, connectGarminSchema);

  if (!parsed.success) {
    return parsed.error;
  }

  const { garminEmail, garminPassword } = parsed.data;

  try {
    // Check if connection already exists
    const existingConnection = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, session.user.id),
    });

    if (existingConnection) {
      // Update existing connection
      await db
        .update(garminConnection)
        .set({
          garminEmail,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(garminConnection.userId, session.user.id));
    } else {
      // Create new connection
      await db.insert(garminConnection).values({
        userId: session.user.id,
        garminEmail,
        isActive: true,
      });
    }

    // Login and save OAuth tokens
    const garminClient = await createGarminClient(
      session.user.id,
      garminEmail,
      garminPassword,
    );

    // Start background sync (don't await)
    garminClient.syncLastNDays(7).catch((error) => {
      console.error('Background sync failed:', error);
      garminClient.updateSyncStatus('error', error.message);
    });

    const response: ConnectGarminResponse = {
      success: true,
      message:
        'Garmin connected successfully. Initial sync started in background.',
    };

    return json<ConnectGarminResponse>(response);
  } catch (error) {
    console.error('Error connecting Garmin:', error);
    const response: ConnectGarminResponse = {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to connect Garmin account',
    };
    return errorResponse(response.message, 500);
  }
});
