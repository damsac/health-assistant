import { desc, eq } from 'drizzle-orm';
import { db, healthMetric } from '../../lib/db';

export type HealthDataSummary = {
  steps?: number;
  calories?: number;
  distance?: number;
  restingHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  sleepDuration?: number;
  deepSleep?: number;
  lightSleep?: number;
  remSleep?: number;
  activeMinutes?: number;
  vigorousMinutes?: number;
  stressAvg?: number;
  stressMax?: number;
  latestDate?: Date;
};

/**
 * Fetch the most recent health metrics for a user
 */
export async function getLatestHealthData(
  userId: string,
): Promise<HealthDataSummary> {
  // Get the most recent date with data
  const latestMetrics = await db
    .select({
      metricType: healthMetric.metricType,
      value: healthMetric.value,
      recordedAt: healthMetric.recordedAt,
    })
    .from(healthMetric)
    .where(eq(healthMetric.userId, userId))
    .orderBy(desc(healthMetric.recordedAt))
    .limit(50);

  if (latestMetrics.length === 0) {
    return {};
  }

  const summary: HealthDataSummary = {
    latestDate: latestMetrics[0]?.recordedAt,
  };

  // Group by metric type and get the most recent value for each
  const metricMap = new Map<string, string>();
  for (const metric of latestMetrics) {
    if (!metricMap.has(metric.metricType)) {
      metricMap.set(metric.metricType, metric.value);
    }
  }

  // Parse values
  const parseMetricFloat = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  // Debug: Log what we're getting
  console.log('Health data metrics found:', Array.from(metricMap.entries()));

  summary.steps = parseMetricFloat(metricMap.get('steps'));
  summary.calories = parseMetricFloat(metricMap.get('calories'));
  summary.distance = parseMetricFloat(metricMap.get('distance'));
  summary.restingHeartRate = parseMetricFloat(metricMap.get('resting_heart_rate'));
  summary.maxHeartRate = parseMetricFloat(metricMap.get('max_heart_rate'));
  summary.minHeartRate = parseMetricFloat(metricMap.get('min_heart_rate'));
  summary.sleepDuration = parseMetricFloat(metricMap.get('sleep_duration'));
  summary.deepSleep = parseMetricFloat(metricMap.get('deep_sleep'));
  summary.lightSleep = parseMetricFloat(metricMap.get('light_sleep'));
  summary.remSleep = parseMetricFloat(metricMap.get('rem_sleep'));

  return summary;
}

/**
 * Get health data for the last N days
 */
export async function getHealthDataForDays(
  userId: string,
  days: number = 7,
): Promise<HealthDataSummary[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const metrics = await db
    .select({
      metricType: healthMetric.metricType,
      value: healthMetric.value,
      recordedAt: healthMetric.recordedAt,
    })
    .from(healthMetric)
    .where(eq(healthMetric.userId, userId))
    .orderBy(desc(healthMetric.recordedAt));

  // Group by date
  const dateMap = new Map<string, Map<string, string>>();

  for (const metric of metrics) {
    const dateKey = metric.recordedAt.toISOString().split('T')[0];
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, new Map());
    }
    const dayMetrics = dateMap.get(dateKey);
    if (dayMetrics && !dayMetrics.has(metric.metricType)) {
      dayMetrics.set(metric.metricType, metric.value);
    }
  }

  // Convert to array of summaries
  const summaries: HealthDataSummary[] = [];
  for (const [dateStr, metricMap] of dateMap.entries()) {
    const parseValue = (value: string | undefined): number | undefined => {
      if (!value) return undefined;
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    summaries.push({
      latestDate: new Date(dateStr),
      steps: parseValue(metricMap.get('steps')),
      calories: parseValue(metricMap.get('calories')),
      distance: parseValue(metricMap.get('distance')),
      restingHeartRate: parseValue(metricMap.get('resting_heart_rate')),
      maxHeartRate: parseValue(metricMap.get('max_heart_rate')),
      minHeartRate: parseValue(metricMap.get('min_heart_rate')),
      sleepDuration: parseValue(metricMap.get('sleep_duration')),
      deepSleep: parseValue(metricMap.get('deep_sleep')),
      lightSleep: parseValue(metricMap.get('light_sleep')),
      remSleep: parseValue(metricMap.get('rem_sleep')),
      activeMinutes: parseValue(metricMap.get('active_minutes')),
      vigorousMinutes: parseValue(metricMap.get('vigorous_minutes')),
      stressAvg: parseValue(metricMap.get('stress_avg')),
      stressMax: parseValue(metricMap.get('stress_max')),
    });
  }

  return summaries;
}
