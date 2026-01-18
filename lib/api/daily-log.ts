import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { dailyLog, dailyLogCategoryEnum } from '@/lib/db/schema';

// Schema for creating a new daily log entry
export const createDailyLogSchema = z.object({
  category: z.enum(dailyLogCategoryEnum),
  summary: z.string().min(1).max(500),
  details: z.string().optional(),
  date: z.string().datetime().optional(), // defaults to now on server
});

// Types derived from schema
const selectSchema = createSelectSchema(dailyLog);
export type DailyLogResponse = z.infer<typeof selectSchema>;
export type CreateDailyLogRequest = z.infer<typeof createDailyLogSchema>;

// Aggregated daily summary for dashboard
export type TodaySummary = {
  waterCount: number;
  mealCount: number;
  latestMood: number | null;
  latestEnergy: number | null;
  entries: DailyLogResponse[];
  waterEntries: DailyLogResponse[]; // Water entries sorted by date desc
};

// DELETE response type
export type DeleteDailyLogResponse = {
  success: boolean;
  id: string;
};

// API contract
export type DailyLogApi = {
  GET: { response: DailyLogResponse[] };
  POST: { request: CreateDailyLogRequest; response: DailyLogResponse };
  DELETE: { response: DeleteDailyLogResponse };
};

export type DailyLogTodayApi = {
  GET: { response: TodaySummary };
};
