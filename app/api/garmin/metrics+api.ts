import { and, desc, eq, gte } from 'drizzle-orm';
import { type GetMetricsResponse, getMetricsSchema } from '@/lib/api/garmin';
import { errorResponse, json, withAuth } from '@/lib/api-middleware';
import { db, healthMetric } from '@/lib/db';

export const GET = withAuth(async (request, session) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);

  // Validate query parameters
  const parsed = getMetricsSchema.safeParse(query);
  if (!parsed.success) {
    return errorResponse('Invalid query parameters', 400);
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

  return json<GetMetricsResponse>(metrics);
});
