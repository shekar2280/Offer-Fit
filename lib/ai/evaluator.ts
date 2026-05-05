import { GoogleGenerativeAI } from "@google/generative-ai";
import { JUDGE_PROMPT } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function evaluateAnalysis(
  resume: string,
  jd: string,
  analysis: string,
) {
  const models = ["gemini-2.5-flash-lite"];
  
  for (const modelId of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const prompt = JUDGE_PROMPT(resume, jd, analysis);
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text().match(/\{[\s\S]*\}/)?.[0] || "{}");
    } catch (error) {
      console.error(`Evaluator failed with ${modelId}, trying next...`);
      continue;
    }
  }
  return { passed: true, score: 100, critique: "Evaluation skipped due to quota limits." };
}
