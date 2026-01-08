import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { healthMetric } from '@/lib/db/schema';

// Garmin Connection types - matches the actual API response
export const garminConnectionResponseSchema = z.object({
  connected: z.boolean(),
  email: z.string().nullable(),
  lastSync: z.string().nullable(),
});
export type GarminConnectionResponse = z.infer<
  typeof garminConnectionResponseSchema
>;

// Health Metric types
const healthMetricSelectSchema = createSelectSchema(healthMetric);
export type HealthMetricResponse = z.infer<typeof healthMetricSelectSchema>;

// Request/Response types for each endpoint
export const connectGarminSchema = z.object({
  garminEmail: z.string().email(),
  garminPassword: z.string().min(1),
});
export type ConnectGarminRequest = z.infer<typeof connectGarminSchema>;

export type ConnectGarminResponse = {
  success: boolean;
  message: string;
};

export type DisconnectGarminResponse = {
  success: boolean;
  message: string;
};

export type SyncGarminResponse = {
  success: boolean;
  message: string;
};

export const getMetricsSchema = z.object({
  type: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).default(7),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export type GetMetricsRequest = z.infer<typeof getMetricsSchema>;
export type GetMetricsResponse = HealthMetricResponse[];

export const getMetricsLatestSchema = z.object({
  type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type GetMetricsLatestRequest = z.infer<typeof getMetricsLatestSchema>;
export type GetMetricsLatestResponse = Record<string, HealthMetricResponse>;

export const getMetricsSummarySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
});
export type GetMetricsSummaryRequest = z.infer<typeof getMetricsSummarySchema>;

export type HealthMetricSummary = {
  metricType: string;
  value: string;
  unit: string | null;
  recordedAt: string;
};
export type GetMetricsSummaryResponse = HealthMetricSummary[];

// API contract - defines all endpoint types
export type GarminApi = {
  // Connection endpoints
  'POST /connect': {
    request: ConnectGarminRequest;
    response: ConnectGarminResponse;
  };
  'DELETE /disconnect': { response: DisconnectGarminResponse };
  'POST /sync': { response: SyncGarminResponse };
  'GET /connection': { response: GarminConnectionResponse | null };

  // Metrics endpoints
  'GET /metrics': { request: GetMetricsRequest; response: GetMetricsResponse };
  'GET /metrics/latest': {
    request: GetMetricsLatestRequest;
    response: GetMetricsLatestResponse;
  };
  'GET /metrics/summary': {
    request: GetMetricsSummaryRequest;
    response: GetMetricsSummaryResponse;
  };
};
