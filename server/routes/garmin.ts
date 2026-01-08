import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
/**
 * Garmin Connect integration routes
 * 
 * Provides endpoints for:
 * - Connecting/disconnecting Garmin accounts
 * - Syncing health data from Garmin Connect
 * - Fetching health metrics and summaries
 * 
 * All routes require authentication
 */
import { Hono } from 'hono';
import { db, garminConnection, healthMetric } from '@/lib/db';
import { type AuthEnv, authMiddleware } from '../middleware/auth';
import {
  type ConnectGarminResponse,
  type DisconnectGarminResponse,
  type SyncGarminResponse,
  type GarminConnectionResponse,
  type GetMetricsRequest,
  type GetMetricsResponse,
  type GetMetricsLatestRequest,
  type GetMetricsLatestResponse,
  type GetMetricsSummaryRequest,
  type GetMetricsSummaryResponse,
  connectGarminSchema,
  getMetricsSchema,
  getMetricsLatestSchema,
  getMetricsSummarySchema,
} from '@/lib/api/garmin';

const execAsync = promisify(exec);
const garmin = new Hono<AuthEnv>();

garmin.use('*', authMiddleware);

/**
 * POST /garmin/connect
 * Connect a Garmin account by storing credentials
 * 
 * Request Body:
 * - garminEmail: Garmin account email
 * - garminPassword: Garmin account password
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
garmin.post('/connect', async (c) => {
  const session = c.get('session');
  const body = await c.req.json();
  
  // Validate request body
  const parsed = connectGarminSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid request body', details: parsed.error }, 400);
  }
  
  const { garminEmail, garminPassword } = parsed.data;

  try {
    const existingConnection = await db.query.garminConnection.findFirst({
      where: eq(garminConnection.userId, session.user.id),
    });

    if (existingConnection) {
      await db
        .update(garminConnection)
        .set({
          garminEmail,
          garminPassword,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(garminConnection.userId, session.user.id));
    } else {
      await db.insert(garminConnection).values({
        userId: session.user.id,
        garminEmail,
        garminPassword,
        isActive: true,
      });
    }

    const pythonPath = `${process.cwd()}/python-services`;
    const command = `cd ${pythonPath} && .venv/bin/python3 garmin_sync.py "${session.user.id}" "${garminEmail}" "${garminPassword}" 7`;

    execAsync(command)
      .then(async () => {
        console.log(`✓ Garmin sync completed for user ${session.user.id}`);
        await db
          .update(garminConnection)
          .set({
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
            lastSyncError: null,
          })
          .where(eq(garminConnection.userId, session.user.id));
      })
      .catch(async (error) => {
        console.error(
          `✗ Garmin sync failed for user ${session.user.id}:`,
          error,
        );
        await db
          .update(garminConnection)
          .set({
            lastSyncAt: new Date(),
            lastSyncStatus: 'error',
            lastSyncError: (error as Error).message || 'Sync failed',
          })
          .where(eq(garminConnection.userId, session.user.id));
      });

    const response: ConnectGarminResponse = {
      success: true,
      message:
        'Garmin connected successfully. Initial sync started in background.',
    };
    return c.json(response);
  } catch (error) {
    console.error('Error connecting Garmin:', error);
    const response: ConnectGarminResponse = {
      success: false,
      message: 'Failed to connect Garmin account',
    };
    return c.json(response, 500);
  }
});

garmin.get('/connection', async (c) => {
  const session = c.get('session');

  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, session.user.id),
  });

  return c.json(connection as GarminConnectionResponse | null);
});

/**
 * DELETE /garmin/disconnect
 * Disconnect Garmin account and remove credentials
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
garmin.delete('/disconnect', async (c) => {
  const session = c.get('session');

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
  return c.json(response);
});

/**
 * POST /garmin/sync
 * Trigger manual sync of Garmin data
 * 
 * Executes Python script to:
 * - Authenticate with Garmin Connect
 * - Fetch last 7 days of health data
 * - Force refresh today's data
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
garmin.post('/sync', async (c) => {
  const session = c.get('session');

  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, session.user.id),
  });

  if (!connection) {
    return c.json({ error: 'No Garmin connection found' }, 404);
  }

  if (!connection.isActive) {
    return c.json({ error: 'Garmin connection is inactive' }, 400);
  }

  if (!connection.garminEmail || !connection.garminPassword) {
    return c.json({ error: 'Garmin credentials not stored' }, 400);
  }

  const pythonPath = `${process.cwd()}/python-services`;
  const command = `cd ${pythonPath} && DATABASE_URL="${process.env.DATABASE_URL}" .venv/bin/python3 garmin_sync.py "${session.user.id}" "${connection.garminEmail}" "${connection.garminPassword}" 7`;

  try {
    const { stdout, stderr } = await execAsync(command);
    console.log(`✓ Garmin sync completed for user ${session.user.id}`);
    console.log('Sync output:', stdout);
    if (stderr) console.log('Sync errors:', stderr);

    await db
      .update(garminConnection)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      })
      .where(eq(garminConnection.userId, session.user.id));

    const response: SyncGarminResponse = {
      success: true,
      message: 'Garmin data synced successfully',
    };
    return c.json(response);
  } catch (error) {
    console.error(`✗ Garmin sync failed for user ${session.user.id}:`, error);

    await db
      .update(garminConnection)
      .set({
        lastSyncAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncError: (error as Error).message || 'Sync failed',
      })
      .where(eq(garminConnection.userId, session.user.id));

    const response: SyncGarminResponse = {
      success: false,
      message: 'Failed to sync Garmin data',
    };
    return c.json(response, 500);
  }
});

/**
 * GET /garmin/metrics
 * Fetch health metrics with optional filtering
 * 
 * Query Parameters:
 * - type: (optional) Filter by metric type
 * - days: Number of days to fetch (default: 7)
 * - startDate: (optional) ISO date string
 * - endDate: (optional) ISO date string
 * 
 * Response: Array of HealthMetric objects
 */
garmin.get('/metrics', async (c) => {
  const session = c.get('session');
  const query = c.req.query();
  
  // Validate query parameters
  const parsed = getMetricsSchema.safeParse(query);
  if (!parsed.success) {
    return c.json({ error: 'Invalid query parameters', details: parsed.error }, 400);
  }
  
  const { type: metricType, days } = parsed.data;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const whereConditions = [
    eq(healthMetric.userId, session.user.id),
    gte(healthMetric.recordedAt, startDate),
  ];

  if (metricType) {
    whereConditions.push(eq(healthMetric.metricType, metricType));
  }

  const metrics = await db.query.healthMetric.findMany({
    where: and(...whereConditions),
    orderBy: [desc(healthMetric.recordedAt)],
    limit: 1000,
  });

  return c.json(metrics as GetMetricsResponse);
});

/**
 * GET /garmin/metrics/summary
 * Get aggregated health data summary
 * 
 * Query Parameters:
 * - days: Number of days to summarize (default: 7)
 * 
 * Response: HealthDataSummary object with aggregated metrics
 */
garmin.get('/metrics/summary', async (c) => {
  const session = c.get('session');
  const query = c.req.query();
  
  // Validate query parameters
  const parsed = getMetricsSummarySchema.safeParse(query);
  if (!parsed.success) {
    return c.json({ error: 'Invalid query parameters', details: parsed.error }, 400);
  }
  
  const { days } = parsed.data;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summaryQuery = await db
    .select({
      metricType: healthMetric.metricType,
      avgValue: sql<number>`AVG(CAST(${healthMetric.value} AS NUMERIC))`,
      minValue: sql<number>`MIN(CAST(${healthMetric.value} AS NUMERIC))`,
      maxValue: sql<number>`MAX(CAST(${healthMetric.value} AS NUMERIC))`,
      count: sql<number>`COUNT(*)`,
    })
    .from(healthMetric)
    .where(
      and(
        eq(healthMetric.userId, session.user.id),
        gte(healthMetric.recordedAt, startDate),
      ),
    )
    .groupBy(healthMetric.metricType);

  return c.json(summaryQuery as GetMetricsSummaryResponse);
});

/**
 * GET /garmin/metrics/latest
 * Fetch latest health metrics for the user
 * 
 * Query Parameters:
 * - type: (optional) Filter by metric type
 * - limit: (optional) Number of metrics to return
 * 
 * Response: Array of HealthMetric objects
 */
garmin.get('/metrics/latest', async (c) => {
  const session = c.get('session');
  const query = c.req.query();
  
  // Validate query parameters
  const parsed = getMetricsLatestSchema.safeParse(query);
  if (!parsed.success) {
    return c.json({ error: 'Invalid query parameters', details: parsed.error }, 400);
  }
  
  // Get the most recent metric for each type, excluding None values
  const latestMetrics = await db
    .select()
    .from(healthMetric)
    .where(
      and(
        eq(healthMetric.userId, session.user.id),
        sql`${healthMetric.value} != 'None'`
      )
    )
    .orderBy(desc(healthMetric.recordedAt));

  // Group by metric type and keep only the latest (first after sorting)
  const grouped = latestMetrics.reduce(
    (acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = metric;
      }
      return acc;
    },
    {} as Record<string, (typeof latestMetrics)[0]>,
  );

  return c.json(Object.values(grouped) as GetMetricsLatestResponse);
});

export { garmin as garminRoute };
