import { anthropic } from '@ai-sdk/anthropic';
import type { AnthropicMessagesModelId } from '@ai-sdk/anthropic/internal';

/**
 * Central model configuration for the health consultant.
 * Change this single constant to switch models across the app.
 */
export const MODEL_ID: AnthropicMessagesModelId = 'claude-3-haiku-20240307';

/**
 * Pre-configured model instance for use with the AI SDK.
 */
export const model = anthropic(MODEL_ID);
