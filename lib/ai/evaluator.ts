import { GoogleGenerativeAI } from "@google/generative-ai";
import { JUDGE_PROMPT } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function evaluateAnalysis(
  resume: string,
  jd: string,
  analysis: string,
) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
  const prompt = JUDGE_PROMPT(resume, jd, analysis);
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text().match(/\{[\s\S]*\}/)?.[0] || "{}");
}
