import { and, eq, gte, lte } from 'drizzle-orm';
import {
  createDailyLogSchema,
  type DailyLogResponse,
  type TodaySummary,
} from '@/lib/api/daily-log';
import { json, parseBody, withAuth } from '@/lib/api-middleware';
import { dailyLog, db } from '@/lib/db';

// Get today's date range in user's timezone (assumes UTC for now)
function getTodayRange() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

export const GET = withAuth(async (request, session) => {
  const url = new URL(request.url);
  const todayOnly = url.searchParams.get('today') === 'true';

  if (todayOnly) {
    const { startOfDay, endOfDay } = getTodayRange();

    const entries = await db.query.dailyLog.findMany({
      where: and(
        eq(dailyLog.userId, session.user.id),
        gte(dailyLog.date, startOfDay),
        lte(dailyLog.date, endOfDay),
      ),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    });

    // Calculate summary
    const waterEntries = entries.filter((e) => e.category === 'water');
    const waterCount = waterEntries.length;
    const mealCount = entries.filter((e) => e.category === 'meal').length;

    const moodEntries = entries.filter((e) => e.category === 'mood');
    const energyEntries = entries.filter((e) => e.category === 'energy');

    const latestMood =
      moodEntries.length > 0 ? parseMoodEnergy(moodEntries[0].summary) : null;
    const latestEnergy =
      energyEntries.length > 0
        ? parseMoodEnergy(energyEntries[0].summary)
        : null;

    const summary: TodaySummary = {
      waterCount,
      mealCount,
      latestMood,
      latestEnergy,
      entries,
      waterEntries, // Include water entries with IDs for deletion
    };

    return json<TodaySummary>(summary);
  }

  // Return all entries for user
  const entries = await db.query.dailyLog.findMany({
    where: eq(dailyLog.userId, session.user.id),
    orderBy: (logs, { desc }) => [desc(logs.date)],
    limit: 100,
  });

  return json<DailyLogResponse[]>(entries);
});

export const POST = withAuth(async (request, session) => {
  const parsed = await parseBody(request, createDailyLogSchema);

  if (!parsed.success) {
    return parsed.error;
  }

  const { category, summary, details, date } = parsed.data;

  const [entry] = await db
    .insert(dailyLog)
    .values({
      userId: session.user.id,
      category,
      summary,
      details: details || null,
      date: date ? new Date(date) : new Date(),
    })
    .returning();

  return json<DailyLogResponse>(entry, { status: 201 });
});

// Parse mood/energy value from summary (expects "1" to "5")
function parseMoodEnergy(summary: string): number | null {
  const num = parseInt(summary, 10);
  if (Number.isNaN(num) || num < 1 || num > 5) return null;
  return num;
}
