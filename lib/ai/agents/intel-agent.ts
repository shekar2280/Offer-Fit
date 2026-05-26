import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "@/config/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const INTEL_PROMPT = (
  companyName: string,
  position: string,
  location?: string
) => `
You are a Company Research Analyst. Your task is to provide factual data about ${companyName} for a ${position} role.

### MANDATORY SALARY LOGIC:
1. **REGION LOCK**: You MUST anchor compensation to the job's location: ${location || "the target country"}.
2. **India Enforcement**: If Location is "India", use ₹ (Rupees) and "LPA" (e.g., 15 LPA). USD is strictly FORBIDDEN.
3. **USA Enforcement**: If Location is "USA", use $ (USD) and "Yearly".

Output the following JSON block EXACTLY as shown:

===JSON_START===
{
  "salary_insight": { "range": "<e.g. 8-15 LPA>", "currency": "<INR|USD>", "seniority": "<Junior|Mid|Senior>" },
  "company_cheat_sheet": "<3-5 concise bullet points about ${companyName}: mission, recent news, tech stack, culture, what they value in candidates. Format as newline-separated bullet points starting with •>",
  "culture_traits": ["trait1", "trait2", "trait3"]
}
===JSON_END===
`;

export async function runIntelAgent(
  companyName: string,
  position: string,
  location?: string
) {
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const prompt = INTEL_PROMPT(companyName, position, location);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const jsonStartMarker = "===JSON_START===";
      const jsonEndMarker = "===JSON_END===";
      const startIndex = text.indexOf(jsonStartMarker);
      const endIndex = text.indexOf(jsonEndMarker);

      if (startIndex !== -1 && endIndex !== -1) {
        let jsonStr = text.substring(startIndex + jsonStartMarker.length, endIndex).trim();
        if (jsonStr.includes("```json")) {
          jsonStr = jsonStr.replace(/```json\s?/, "").replace(/```/, "").trim();
        } else if (jsonStr.includes("```")) {
          jsonStr = jsonStr.replace(/```\s?/, "").replace(/```/, "").trim();
        }
        return JSON.parse(jsonStr);
      }
    } catch {
      continue;
    }
  }
  return { 
    salary_insight: { range: "Competitive", currency: "INR", seniority: "Mid" },
    company_cheat_sheet: "• High-growth tech company\n• Values innovation and impact",
    culture_traits: ["Innovative", "Fast-paced"]
  };
}
