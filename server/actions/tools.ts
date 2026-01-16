import { createGoalsTool } from './goals/manage-goals';
import { createProfileUpdateTool } from './user-profile/update-user-profile';

/**
 * Context passed to tools during execution
 */
export type ToolExecutionContext = {
  userId: string;
  conversationId?: string;
};

/**
 * Get all action tools bound to a user context
 */
export function getActionTools(context: ToolExecutionContext) {
  return {
    proposeProfileUpdate: createProfileUpdateTool(context),
    manageGoals: createGoalsTool(context),
  } as const;
}

/**
 * Type for the action tools object
 */
export type ActionTools = ReturnType<typeof getActionTools>;
