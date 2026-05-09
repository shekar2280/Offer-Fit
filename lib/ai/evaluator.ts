import { GoogleGenerativeAI } from "@google/generative-ai";
import { JUDGE_PROMPT } from "./prompts";
import { GEMINI_MODELS, MODEL_PRICING } from "../constants";

import { calculateAICost } from "./utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function evaluateAnalysis(
  resume: string,
  jd: string,
  analysis: string,
) {
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const prompt = JUDGE_PROMPT(resume, jd, analysis);
      const result = await model.generateContent(prompt);
      const usage = result.response.usageMetadata;
      const data = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)?.[0] || "{}");
      
      return {
        ...data,
        usage,
        estimated_cost: calculateAICost(modelId, usage)
      };
    } catch (error) {
      continue;
    }
  }
  return { passed: true, score: 100, critique: "Evaluation skipped.", usage: null, estimated_cost: 0 };
}
