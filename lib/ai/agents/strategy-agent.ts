import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "@/config/constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const STRATEGY_PROMPT = (
  companyName: string,
  position: string,
  resumeText: string,
  jd: string
) => `
You are a Resume Strategy Architect. Your goal is to design a high-level customization strategy for a candidate applying to ${companyName} for the ${position} role.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jd}

Output the following JSON block EXACTLY as shown:

===JSON_START===
{
  "strategy_pillars": [
    "**[Focus Area]** - How we will change the resume",
    "**[Focus Area]** - How we will change the resume",
    "**[Focus Area]** - How we will change the resume"
  ],
  "key_keywords_to_inject": ["keyword1", "keyword2"],
  "culture_vibe": "e.g., Highly technical and scale-focused"
}
===JSON_END===
`;

export async function runStrategyAgent(
  companyName: string,
  position: string,
  resumeText: string,
  jd: string
) {
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const prompt = STRATEGY_PROMPT(companyName, position, resumeText, jd);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let strategy = { strategy_pillars: [], key_keywords_to_inject: [], culture_vibe: "" };
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
        try {
          strategy = JSON.parse(jsonStr);
        } catch {}
      }

      return strategy;
    } catch {
      continue;
    }
  }

  return { 
    strategy_pillars: [
      "Surgically align technical skills with the Job Description's core requirements.",
      "Quantify impact using X-Y-Z metrics to demonstrate ownership and scale.",
      "Optimize keyword density for ATS systems while maintaining natural readability."
    ], 
    key_keywords_to_inject: [], 
    culture_vibe: "Professional and impact-oriented" 
  };
}
