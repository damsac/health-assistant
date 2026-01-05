import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db, garminConnection, healthMetric } from '@/lib/db';
import { type AuthEnv, authMiddleware } from '../middleware/auth';

const execAsync = promisify(exec);
const garmin = new Hono<AuthEnv>();

garmin.use('*', authMiddleware);

garmin.post('/connect', async (c) => {
  const session = c.get('session');
  const { garminEmail, garminPassword } = await c.req.json();

  if (!garminEmail || !garminPassword) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

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

    return c.json({
      success: true,
      message:
        'Garmin connected successfully. Initial sync started in background.',
    });
  } catch (error) {
    console.error('Error connecting Garmin:', error);
    return c.json({ error: 'Failed to connect Garmin account' }, 500);
  }
});

garmin.get('/connection', async (c) => {
  const session = c.get('session');

  const connection = await db.query.garminConnection.findFirst({
    where: eq(garminConnection.userId, session.user.id),
  });

  return c.json(connection || null);
});

garmin.delete('/connection', async (c) => {
  const session = c.get('session');

  await db
    .update(garminConnection)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(garminConnection.userId, session.user.id));

  return c.json({ success: true, message: 'Garmin disconnected successfully' });
});

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

    return c.json({
      success: true,
      message: 'Garmin data synced successfully',
    });
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

    return c.json({ error: 'Failed to sync Garmin data' }, 500);
  }
});

garmin.get('/metrics', async (c) => {
  const session = c.get('session');
  const metricType = c.req.query('type');
  const days = parseInt(c.req.query('days') || '7', 10);

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

  return c.json(metrics);
});

garmin.get('/metrics/summary', async (c) => {
  const session = c.get('session');
  const days = parseInt(c.req.query('days') || '7', 10);

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

  return c.json(summaryQuery);
});

garmin.get('/metrics/latest', async (c) => {
  const session = c.get('session');

  const latestMetrics = await db
    .select()
    .from(healthMetric)
    .where(eq(healthMetric.userId, session.user.id))
    .orderBy(desc(healthMetric.recordedAt))
    .limit(50);

  const grouped = latestMetrics.reduce(
    (acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = metric;
      }
      return acc;
    },
    {} as Record<string, (typeof latestMetrics)[0]>,
  );

  return c.json(Object.values(grouped));
});

export { garmin as garminRoute };
