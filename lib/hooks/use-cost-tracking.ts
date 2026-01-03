import { useCallback, useRef, useState } from 'react';
import { type CostEstimate, formatCost } from '../pricing';

const EMPTY_COST: CostEstimate = {
  inputCost: 0,
  outputCost: 0,
  totalCost: 0,
  tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
};

export type CostTrackingState = {
  /** Cost for each message by ID */
  messageCosts: Map<string, CostEstimate>;
  /** Cumulative cost for the current session */
  totalSessionCost: CostEstimate;
};

export type UseCostTrackingReturn = CostTrackingState & {
  /** Process incoming cost data from the stream */
  handleCostData: (data: unknown) => void;
  /** Get cost for a specific message */
  getMessageCost: (messageId: string) => CostEstimate | null;
  /** Reset all cost tracking (call on conversation switch) */
  reset: () => void;
  /** Format a cost value as currency string */
  formatCost: typeof formatCost;
  /** Ref to track current message ID for cost association */
  currentMessageIdRef: React.RefObject<string | null>;
};

/**
 * Hook to track cost estimates from AI chat streams.
 * Decoupled from chat logic for clean separation of concerns.
 */
export function useCostTracking(): UseCostTrackingReturn {
  const [messageCosts, setMessageCosts] = useState<Map<string, CostEstimate>>(
    new Map(),
  );
  const [totalSessionCost, setTotalSessionCost] =
    useState<CostEstimate>(EMPTY_COST);

  const currentMessageIdRef = useRef<string | null>(null);

  const handleCostData = useCallback((data: unknown) => {
    // Validate data structure: { type: "data-cost-estimate", data: { cost, ... } }
    if (
      !data ||
      typeof data !== 'object' ||
      !('type' in data) ||
      data.type !== 'data-cost-estimate' ||
      !('data' in data)
    ) {
      return;
    }

    const costData = (data as { data: { cost: CostEstimate } }).data;
    const cost = costData.cost;
    const messageId = currentMessageIdRef.current;

    // Update message-specific cost
    if (messageId) {
      setMessageCosts((prev) => {
        const updated = new Map(prev);
        updated.set(messageId, cost);
        return updated;
      });
    }

    // Accumulate total session cost
    setTotalSessionCost((prev) => ({
      inputCost: prev.inputCost + cost.inputCost,
      outputCost: prev.outputCost + cost.outputCost,
      totalCost: prev.totalCost + cost.totalCost,
      tokenUsage: {
        inputTokens: prev.tokenUsage.inputTokens + cost.tokenUsage.inputTokens,
        outputTokens:
          prev.tokenUsage.outputTokens + cost.tokenUsage.outputTokens,
        totalTokens: prev.tokenUsage.totalTokens + cost.tokenUsage.totalTokens,
      },
    }));
  }, []);

  const getMessageCost = useCallback(
    (messageId: string): CostEstimate | null => {
      return messageCosts.get(messageId) ?? null;
    },
    [messageCosts],
  );

  const reset = useCallback(() => {
    setMessageCosts(new Map());
    setTotalSessionCost(EMPTY_COST);
    currentMessageIdRef.current = null;
  }, []);

  return {
    messageCosts,
    totalSessionCost,
    handleCostData,
    getMessageCost,
    reset,
    formatCost,
    currentMessageIdRef,
  };
}
