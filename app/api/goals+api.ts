import { eq } from 'drizzle-orm';
import type { GoalResponse } from '@/lib/api/goals';
import { json, withAuth } from '@/lib/api-middleware';
import { db, userGoal } from '@/lib/db';

export const GET = withAuth(async (_request, session) => {
  const goals = await db.query.userGoal.findMany({
    where: eq(userGoal.userId, session.user.id),
    orderBy: (goals, { desc }) => [desc(goals.createdAt)],
  });

  return json<GoalResponse[]>(goals);
});
