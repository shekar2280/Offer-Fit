import { MODEL_PRICING } from "../constants";

export function calculateAICost(modelId: string, usage?: any): number {
  if (!usage) return 0;
  const pricing = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];
  if (!pricing) return 0;
  
  const inputCost = (usage.promptTokenCount || 0) * (pricing.input / 1000000);
  const outputCost = (usage.candidatesTokenCount || 0) * (pricing.output / 1000000);
  
  return inputCost + outputCost;
}
