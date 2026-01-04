import { desc, eq, sql } from 'drizzle-orm';
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
  const parseFloat = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  summary.steps = parseFloat(metricMap.get('steps'));
  summary.calories = parseFloat(metricMap.get('calories'));
  summary.distance = parseFloat(metricMap.get('distance'));
  summary.restingHeartRate = parseFloat(metricMap.get('resting_heart_rate'));
  summary.maxHeartRate = parseFloat(metricMap.get('max_heart_rate'));
  summary.minHeartRate = parseFloat(metricMap.get('min_heart_rate'));
  summary.sleepDuration = parseFloat(metricMap.get('sleep_duration'));
  summary.deepSleep = parseFloat(metricMap.get('deep_sleep'));
  summary.lightSleep = parseFloat(metricMap.get('light_sleep'));
  summary.remSleep = parseFloat(metricMap.get('rem_sleep'));
  summary.activeMinutes = parseFloat(metricMap.get('active_minutes'));
  summary.vigorousMinutes = parseFloat(metricMap.get('vigorous_minutes'));
  summary.stressAvg = parseFloat(metricMap.get('stress_avg'));
  summary.stressMax = parseFloat(metricMap.get('stress_max'));

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
    const dayMetrics = dateMap.get(dateKey)!;
    if (!dayMetrics.has(metric.metricType)) {
      dayMetrics.set(metric.metricType, metric.value);
    }
  }

  // Convert to array of summaries
  const summaries: HealthDataSummary[] = [];
  for (const [dateStr, metricMap] of dateMap.entries()) {
    const parseFloat = (value: string | undefined): number | undefined => {
      if (!value) return undefined;
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    summaries.push({
      latestDate: new Date(dateStr),
      steps: parseFloat(metricMap.get('steps')),
      calories: parseFloat(metricMap.get('calories')),
      distance: parseFloat(metricMap.get('distance')),
      restingHeartRate: parseFloat(metricMap.get('resting_heart_rate')),
      maxHeartRate: parseFloat(metricMap.get('max_heart_rate')),
      minHeartRate: parseFloat(metricMap.get('min_heart_rate')),
      sleepDuration: parseFloat(metricMap.get('sleep_duration')),
      deepSleep: parseFloat(metricMap.get('deep_sleep')),
      lightSleep: parseFloat(metricMap.get('light_sleep')),
      remSleep: parseFloat(metricMap.get('rem_sleep')),
      activeMinutes: parseFloat(metricMap.get('active_minutes')),
      vigorousMinutes: parseFloat(metricMap.get('vigorous_minutes')),
      stressAvg: parseFloat(metricMap.get('stress_avg')),
      stressMax: parseFloat(metricMap.get('stress_max')),
    });
  }

  return summaries;
}
