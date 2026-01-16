/**
 * Type definitions for chat components, leveraging AI SDK types
 */
import type {
  DynamicToolUIPart,
  ToolUIPart,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UIToolInvocation,
  UITools,
} from 'ai';

// ============================================================================
// Re-exported SDK Types
// ============================================================================

export type {
  DynamicToolUIPart,
  ToolUIPart,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UIToolInvocation,
  UITools,
};

// ============================================================================
// Derived Types
// ============================================================================

/** Message part with default type parameters */
export type MessagePart = UIMessagePart<UIDataTypes, UITools>;

/** Union type for any tool UI part (static or dynamic) */
export type AnyToolUIPart = ToolUIPart<UITools> | DynamicToolUIPart;

/** Message role for chat display */
export type MessageRole = 'user' | 'assistant' | 'system';

// ============================================================================
// Tool State Types
// ============================================================================

/** All possible tool invocation states */
export type ToolInvocationState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

/** States indicating the tool is pending/in-progress */
export const PENDING_TOOL_STATES: ToolInvocationState[] = [
  'input-streaming',
  'input-available',
  'approval-requested',
  'approval-responded',
];

/** States indicating the tool has completed */
export const COMPLETED_TOOL_STATES: ToolInvocationState[] = [
  'output-available',
  'output-error',
  'output-denied',
];

// ============================================================================
// Tool State Guards
// ============================================================================

/** Check if a tool state is pending */
export function isToolPending(state: ToolInvocationState): boolean {
  return PENDING_TOOL_STATES.includes(state);
}

/** Check if a tool state indicates completion */
export function isToolCompleted(state: ToolInvocationState): boolean {
  return COMPLETED_TOOL_STATES.includes(state);
}

/** Check if a tool state indicates an error */
export function isToolError(state: ToolInvocationState): boolean {
  return state === 'output-error';
}

/** Check if a tool state indicates successful completion */
export function isToolSuccess(state: ToolInvocationState): boolean {
  return state === 'output-available';
}

/** Check if a tool state indicates it was denied */
export function isToolDenied(state: ToolInvocationState): boolean {
  return state === 'output-denied';
}

/** Check if a tool is awaiting approval */
export function isToolAwaitingApproval(state: ToolInvocationState): boolean {
  return state === 'approval-requested';
}
