import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { userGoal } from '@/lib/db/schema';

// Types derived from schema
const selectSchema = createSelectSchema(userGoal);
export type GoalResponse = z.infer<typeof selectSchema>;

// Create goal request schema
export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

export type CreateGoalRequest = z.infer<typeof createGoalSchema>;

// API contract
export type GoalsApi = {
  GET: { response: GoalResponse[] };
  POST: { request: CreateGoalRequest; response: GoalResponse };
};
