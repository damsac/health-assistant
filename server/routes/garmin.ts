import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '@/lib/db';
import { garminConnection, healthMetric } from '@/lib/db/schema';
/**
 * Garmin Connect API Routes
 *
 * This module provides API endpoints for Garmin Connect integration.
 * All routes require authentication via session cookies.
 *
 * Endpoints:
 * - GET /garmin/connection - Get connection status and email
 * - POST /garmin/connect - Connect Garmin account with credentials
 * - POST /garmin/disconnect - Disconnect and remove Garmin account
 * - POST /garmin/sync - Trigger manual data sync
 * - GET /garmin/metrics - Get health metrics with optional filters
 * - GET /garmin/metrics/latest - Get latest metric for each type
 * - GET /garmin/metrics/summary - Get aggregated metrics summary
 *
 * Authentication:
 * All routes use authMiddleware which extracts user session from cookies.
 * The user ID from the session is used to fetch/store Garmin data.
 */
import { type AuthEnv, authMiddleware } from '../middleware/auth';
import { createGarminClient } from '../services/garmin-sync';

/**
 * Garmin API Routes
 */
const garmin = new Hono<AuthEnv>();

// Apply auth middleware to all routes
garmin.use('*', authMiddleware);

/**
 * GET /connection
 * Get connection status and email
 *
 * Returns:
 * - connected: boolean - Whether Garmin account is connected
 * - email: string - Garmin account email
 * - lastSync: Date - Last sync date
 */
garmin.get('/connection', async (c) => {
  const session = c.get('session');
  const userId = session.user.id;

  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, userId),
  });

  return c.json({
    connected: !!connection?.isActive,
    email: connection?.garminEmail,
    lastSync: connection?.lastSyncAt,
  });
});

garmin.post('/connect', async (c) => {
  const session = c.get('session');
  const userId = session.user.id;

  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const existingConnection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, userId),
  });

  if (existingConnection) {
    return c.json({ error: 'Garmin account already connected' }, 400);
  }

  try {
    // Create connection record first
    await db.insert(garminConnection).values({
      userId,
      garminEmail: email,
      isActive: true,
    });

    // Create client and login
    const syncService = await createGarminClient(userId, email, password);
    await syncService.syncLastNDays(7);

    return c.json({
      success: true,
      message: 'Garmin account connected and initial sync completed',
    });
  } catch (error) {
    console.error('Failed to connect Garmin account:', error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect Garmin account',
      },
      500,
    );
  }
});

garmin.post('/disconnect', async (c) => {
  const session = c.get('session');
  const userId = session.user.id;

  await db.delete(garminConnection).where(eq(garminConnection.userId, userId));

  return c.json({ success: true });
});

garmin.post('/sync', async (c) => {
  const session = c.get('session');
  const userId = session.user.id;

  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, userId),
  });

  if (!connection) {
    return c.json({ error: 'No Garmin account connected' }, 400);
  }

  try {
    const syncService = await createGarminClient(userId);
    await syncService.syncLastNDays(7);

    return c.json({
      success: true,
      message: 'Sync completed successfully',
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      500,
    );
  }
});

garmin.get('/metrics/latest', async (c) => {
  const session = c.get('session');
  const userId = session.user.id;

  const metrics = await db.query.healthMetric.findMany({
    where: eq(healthMetric.userId, userId),
    orderBy: [desc(healthMetric.recordedAt)],
    limit: 100,
  });

  const latestByType: Record<string, any> = {};

  for (const metric of metrics) {
    if (!latestByType[metric.metricType]) {
      latestByType[metric.metricType] = metric;
    }
  }

  return c.json(latestByType);
});

garmin.get('/metrics', async (c) => {
  const session = c.get('session');
  const userId = session.user.id;

  const type = c.req.query('type');
  const days = parseInt(c.req.query('days') || '30', 10);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = db.query.healthMetric.findMany({
    where: eq(healthMetric.userId, userId),
    orderBy: [desc(healthMetric.recordedAt)],
  });

  const allMetrics = await query;

  let filteredMetrics = allMetrics.filter(
    (m) => new Date(m.recordedAt) >= startDate,
  );

  if (type) {
    filteredMetrics = filteredMetrics.filter((m) => m.metricType === type);
  }

  return c.json(filteredMetrics);
});

garmin.get('/metrics/summary', async (c) => {
  const session = c.get('session');
  const userId = session.user.id;

  const days = parseInt(c.req.query('days') || '30', 10);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const allMetrics = await db.query.healthMetric.findMany({
    where: eq(healthMetric.userId, userId),
    orderBy: [desc(healthMetric.recordedAt)],
  });

  const filteredMetrics = allMetrics.filter(
    (m) => new Date(m.recordedAt) >= startDate,
  );

  const summary: Record<string, { count: number; latest: any }> = {};

  for (const metric of filteredMetrics) {
    if (!summary[metric.metricType]) {
      summary[metric.metricType] = {
        count: 0,
        latest: metric,
      };
    }
    summary[metric.metricType].count++;
  }

  return c.json(summary);
});

export default garmin;
