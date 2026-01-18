import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { userGoal } from '@/lib/db/schema';

// Types derived from schema
const selectSchema = createSelectSchema(userGoal);
export type GoalResponse = z.infer<typeof selectSchema>;

// API contract
export type GoalsApi = {
  GET: { response: GoalResponse[] };
};
