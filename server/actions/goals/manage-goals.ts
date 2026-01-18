import { type Tool, tool } from 'ai';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { goalStatusEnum, userGoal } from '@/lib/db/schema';
import type { ToolExecutionContext } from '../tools';

const goalActionSchema = z.object({
  action: z
    .enum(['create', 'update', 'delete', 'list'])
    .describe('The action to perform on goals'),
  goalId: z
    .string()
    .uuid()
    .optional()
    .describe('Goal ID (required for update/delete)'),
  title: z
    .string()
    .max(200)
    .optional()
    .describe('Goal title (required for create, optional for update)'),
  description: z
    .string()
    .max(1000)
    .optional()
    .describe('Optional description of the goal'),
  status: z
    .enum(goalStatusEnum)
    .optional()
    .describe('Goal status: active, completed, or abandoned'),
});

type GoalActionInput = z.infer<typeof goalActionSchema>;

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

type GoalActionResult = {
  success: boolean;
  action: string;
  goal?: Goal;
  goals?: Goal[];
  error?: string;
};

export const createGoalsTool = (
  context: ToolExecutionContext,
): Tool<GoalActionInput, GoalActionResult> =>
  tool<GoalActionInput, GoalActionResult>({
    description: `Manage user's health and wellness goals. Use this to:
- List current goals (action: "list") - call this when you need to know what goals the user has set
- Create new goals when the user mentions wanting to achieve something
- Update existing goals or mark them as completed/abandoned
Goals help track what the user wants to accomplish. Always list goals first if you need to reference them in your response.
- Delete goals (action: "delete") - requires goalId from list results`,
    inputSchema: goalActionSchema,
    needsApproval: (input) => input.action !== 'list',
    execute: async (input): Promise<GoalActionResult> => {
      const { action, goalId, title, description, status } = input;

      switch (action) {
        case 'create': {
          if (!title) {
            return {
              success: false,
              action: 'create',
              error: 'Title is required to create a goal',
            };
          }

          const [newGoal] = await db
            .insert(userGoal)
            .values({
              userId: context.userId,
              title,
              description: description ?? null,
              status: status ?? 'active',
            })
            .returning();

          return {
            success: true,
            action: 'create',
            goal: newGoal,
          };
        }

        case 'update': {
          if (!goalId) {
            return {
              success: false,
              action: 'update',
              error: 'Goal ID is required for update',
            };
          }

          const updateData: Record<string, unknown> = { updatedAt: new Date() };
          if (title) updateData.title = title;
          if (description !== undefined) updateData.description = description;
          if (status) updateData.status = status;

          const [updatedGoal] = await db
            .update(userGoal)
            .set(updateData)
            .where(
              and(eq(userGoal.id, goalId), eq(userGoal.userId, context.userId)),
            )
            .returning();

          if (!updatedGoal) {
            return {
              success: false,
              action: 'update',
              error: 'Goal not found or not owned by user',
            };
          }

          return {
            success: true,
            action: 'update',
            goal: updatedGoal,
          };
        }

        case 'delete': {
          if (!goalId) {
            return {
              success: false,
              action: 'delete',
              error: 'Goal ID is required for delete',
            };
          }

          const [deletedGoal] = await db
            .delete(userGoal)
            .where(
              and(eq(userGoal.id, goalId), eq(userGoal.userId, context.userId)),
            )
            .returning();

          if (!deletedGoal) {
            return {
              success: false,
              action: 'delete',
              error: 'Goal not found or not owned by user',
            };
          }

          return {
            success: true,
            action: 'delete',
            goal: deletedGoal,
          };
        }

        case 'list': {
          const goals = await db.query.userGoal.findMany({
            where: eq(userGoal.userId, context.userId),
            orderBy: (goals, { desc }) => [desc(goals.createdAt)],
          });

          return {
            success: true,
            action: 'list',
            goals,
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
