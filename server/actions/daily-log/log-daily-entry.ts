import { type Tool, tool } from 'ai';
import { and, between, desc, eq, gte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { dailyLog, dailyLogCategoryEnum } from '@/lib/db/schema';
import type { ToolExecutionContext } from '../tools';

const logActionSchema = z.object({
  action: z
    .enum(['log', 'get_today', 'get_recent'])
    .describe('The action to perform'),
  category: z
    .enum(dailyLogCategoryEnum)
    .optional()
    .describe(
      'Category of the log entry (required for log action): meal, water, exercise, sleep, mood, energy, symptom, supplement, note',
    ),
  summary: z
    .string()
    .max(500)
    .optional()
    .describe(
      'Brief summary of the entry (required for log action), e.g., "Ate oatmeal with berries for breakfast"',
    ),
  details: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      'Optional structured details as key-value pairs, e.g., { "calories": 350, "protein": "12g" }',
    ),
  days: z
    .number()
    .int()
    .min(1)
    .max(30)
    .optional()
    .describe('Number of days to fetch for get_recent (default: 7, max: 30)'),
});

type LogActionInput = z.infer<typeof logActionSchema>;

type LogEntry = {
  id: string;
  date: Date;
  category: string;
  summary: string;
  details: string | null;
  createdAt: Date;
};

type LogActionResult = {
  success: boolean;
  action: string;
  entry?: LogEntry;
  entries?: LogEntry[];
  error?: string;
};

export const createDailyLogTool = (
  context: ToolExecutionContext,
): Tool<LogActionInput, LogActionResult> =>
  tool<LogActionInput, LogActionResult>({
    description: `Log daily health and wellness entries. Use this to:
- Log meals, water intake, exercise, sleep, mood, energy levels, symptoms, supplements, or general notes
- Get today's logged entries (action: "get_today")
- Get recent entries from the past few days (action: "get_recent")

Examples:
- User says "I had eggs and toast for breakfast" → log with category: "meal", summary: "Eggs and toast for breakfast"
- User says "I drank 8 glasses of water today" → log with category: "water", summary: "8 glasses of water"
- User says "Feeling tired this afternoon" → log with category: "energy", summary: "Feeling tired in the afternoon"
- User says "Went for a 30-minute run" → log with category: "exercise", summary: "30-minute run"`,
    inputSchema: logActionSchema,
    needsApproval: (input) => input.action === 'log',
    execute: async (input): Promise<LogActionResult> => {
      const { action, category, summary, details, days = 7 } = input;

      switch (action) {
        case 'log': {
          if (!category) {
            return {
              success: false,
              action: 'log',
              error: 'Category is required to log an entry',
            };
          }
          if (!summary) {
            return {
              success: false,
              action: 'log',
              error: 'Summary is required to log an entry',
            };
          }

          const [newEntry] = await db
            .insert(dailyLog)
            .values({
              userId: context.userId,
              date: new Date(),
              category,
              summary,
              details: details ? JSON.stringify(details) : null,
            })
            .returning();

          return {
            success: true,
            action: 'log',
            entry: newEntry,
          };
        }

        case 'get_today': {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const entries = await db
            .select()
            .from(dailyLog)
            .where(
              and(
                eq(dailyLog.userId, context.userId),
                between(dailyLog.date, today, tomorrow),
              ),
            )
            .orderBy(desc(dailyLog.createdAt));

          return {
            success: true,
            action: 'get_today',
            entries,
          };
        }

        case 'get_recent': {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          startDate.setHours(0, 0, 0, 0);

          const entries = await db
            .select()
            .from(dailyLog)
            .where(
              and(
                eq(dailyLog.userId, context.userId),
                gte(dailyLog.date, startDate),
              ),
            )
            .orderBy(desc(dailyLog.date), desc(dailyLog.createdAt));

          return {
            success: true,
            action: 'get_recent',
            entries,
          };
        }

        default:
          return {
            success: false,
            action,
            error: 'Unknown action',
          };
      }
    },
  });
