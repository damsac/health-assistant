/**
 * Anthropic Model Pricing (per million tokens)
 * Source: https://console.anthropic.com/docs/en/about-claude/pricing
 */

// Pricing per million tokens (MTok)
export const MODEL_PRICING = {
  // Opus models
  'claude-opus-4-5-20250514': { input: 5.0, output: 25.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },

  // Sonnet models
  'claude-sonnet-4-5-20250514': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },

  // Haiku models
  'claude-haiku-4-5-20250514': { input: 1.0, output: 5.0 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
} as const;

export type ModelId = keyof typeof MODEL_PRICING;

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type CostEstimate = {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  tokenUsage: TokenUsage;
};

/**
 * Calculate the estimated cost for a given model and token usage
 */
export function calculateCost(
  modelId: string,
  usage: TokenUsage,
): CostEstimate {
  const pricing = MODEL_PRICING[modelId as ModelId];

  // Default to Haiku 3 pricing if model not found
  const inputPricePerMTok = pricing?.input ?? 0.25;
  const outputPricePerMTok = pricing?.output ?? 1.25;

  // Convert tokens to millions and calculate cost
  const inputCost = (usage.inputTokens / 1_000_000) * inputPricePerMTok;
  const outputCost = (usage.outputTokens / 1_000_000) * outputPricePerMTok;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    tokenUsage: usage,
  };
}

/**
 * Format cost as a human-readable string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    // Show more precision for very small amounts
    return `$${cost.toFixed(6)}`;
  }
  return `$${cost.toFixed(4)}`;
}
