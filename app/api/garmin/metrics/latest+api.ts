import { and, desc, eq, sql } from 'drizzle-orm';
import type { GetMetricsLatestResponse } from '@/lib/api/garmin';
import { json, withAuth } from '@/lib/api-middleware';
import { db, healthMetric } from '@/lib/db';

export const GET = withAuth(async (_request, session) => {
  // Get the most recent metric for each type, excluding None values
  const latestMetrics = await db
    .select()
    .from(healthMetric)
    .where(
      and(
        eq(healthMetric.userId, session.user.id),
        sql`${healthMetric.value} != 'None'`,
      ),
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

  return json<GetMetricsLatestResponse>(Object.values(grouped));
});
