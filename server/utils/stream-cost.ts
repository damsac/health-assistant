import type { UIMessageStreamWriter } from 'ai';
import {
  type CostEstimate,
  calculateCost,
  type TokenUsage,
} from '../../lib/pricing';
import { MODEL_ID } from '../config/model';

export type CostStreamData = {
  conversationId: string;
  modelId: string;
  cost: CostEstimate;
};

type StreamResultWithUsage = {
  usage: PromiseLike<{
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  }>;
};

/**
 * Writes cost estimate data to a UI message stream after streaming completes.
 * Call this after writer.merge() to append cost data.
 */
export async function writeCostEstimate(
  writer: UIMessageStreamWriter,
  result: StreamResultWithUsage,
  conversationId: string,
): Promise<void> {
  const usage = await result.usage;

  if (usage.inputTokens === undefined || usage.outputTokens === undefined) {
    return;
  }

  const tokenUsage: TokenUsage = {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens ?? 0,
  };

  const cost = calculateCost(MODEL_ID, tokenUsage);

  writer.write({
    type: 'data-cost-estimate',
    data: {
      conversationId,
      modelId: MODEL_ID,
      cost: {
        inputCost: cost.inputCost,
        outputCost: cost.outputCost,
        totalCost: cost.totalCost,
        tokenUsage: cost.tokenUsage,
      },
    } satisfies CostStreamData,
  });
}
