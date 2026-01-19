import { eq } from 'drizzle-orm';
import { createGoalSchema, type GoalResponse } from '@/lib/api/goals';
import { json, withAuth } from '@/lib/api-middleware';
import { db, userGoal } from '@/lib/db';

export const GET = withAuth(async (_request, session) => {
  const goals = await db.query.userGoal.findMany({
    where: eq(userGoal.userId, session.user.id),
    orderBy: (goals, { desc }) => [desc(goals.createdAt)],
  });

  return json<GoalResponse[]>(goals);
});

export const POST = withAuth(async (request, session) => {
  const body = await request.json();
  const parsed = createGoalSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: 'Invalid request', details: parsed.error.format() }, { status: 400 });
  }

  const [goal] = await db
    .insert(userGoal)
    .values({
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      status: 'active',
    })
    .returning();

  return json<GoalResponse>(goal);
});
