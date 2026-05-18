import { MODEL_PRICING } from "../constants";

export function calculateAICost(modelId: string, usage?: any): number {
  if (!usage) return 0;
  const pricing = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];
  if (!pricing) return 0;
  
  const inputCost = (usage.promptTokenCount || 0) * (pricing.input / 1000000);
  const outputCost = (usage.candidatesTokenCount || 0) * (pricing.output / 1000000);
  
  return inputCost + outputCost;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) {
      throw error;
    }

    const errMsg = error.message?.toUpperCase() || "";
    const isTransient =
      error.status === 429 ||
      error.status >= 500 ||
      errMsg.includes("RATE LIMIT") ||
      errMsg.includes("EXHAUSTED") ||
      errMsg.includes("TIMEOUT") ||
      errMsg.includes("FETCH FAILED");

    if (!isTransient) {
      throw error;
    }

    console.warn(`[AI Retry] Transient error encountered. Retrying in ${delayMs}ms... (Retries left: ${retries})`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}


