import { and, eq, gte, sql } from 'drizzle-orm';
import {
  type GetMetricsSummaryResponse,
  getMetricsSummarySchema,
} from '@/lib/api/garmin';
import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { db, healthMetric } from '@/lib/db';

export const GET = withAuth(async (request, session) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);

  // Validate query parameters
  const parsed = getMetricsSummarySchema.safeParse(query);
  if (!parsed.success) {
    return errorResponse('Invalid query parameters', 400);
  }

  const { days } = parsed.data;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summaryQuery = await db
    .select({
      metricType: healthMetric.metricType,
      value: healthMetric.value,
      unit: healthMetric.unit,
      recordedAt: sql<string>`MAX(${healthMetric.recordedAt})::text`,
    })
    .from(healthMetric)
    .where(
      and(
        eq(healthMetric.userId, session.user.id),
        gte(healthMetric.recordedAt, startDate),
      ),
    )
    .groupBy(healthMetric.metricType, healthMetric.value, healthMetric.unit);

  return json<GetMetricsSummaryResponse>(summaryQuery);
});
