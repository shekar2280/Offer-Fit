import { GoogleGenerativeAI } from "@google/generative-ai";
import { toolDefinitions, toolHandlers } from "./tools";
import { evaluateAnalysis } from "./evaluator";
import { ANALYSIS_PROMPT, JUDGE_CORRECTION_PROMPT } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AnalysisData {
  match_score?: number;
  verdict?: "APPLY" | "STRETCH" | "PASS";
  ats_score?: number;
  keyword_density?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  salary_insight?: { range: string; currency: string; seniority: string };
  red_flags?: string[];
  interview_questions?: { q: string; intent: string }[];
  outreach_email?: string;
  tailored_latex?: string;
}

export async function runAgenticAnalysis(
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode?: "analyze" | "customize"
): Promise<{ markdown: string; data: AnalysisData; toolUsed: string }> {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const chat = model.startChat();
  const prompt = ANALYSIS_PROMPT(
    companyName,
    position,
    context,
    jd,
    location,
    jobType,
    mode
  );

  let result = await chat.sendMessage(prompt);
  let response = result.response;
  let iteration = 0;
  const MAX_ITERATIONS = 3;

  const finalToolCalls: string[] = [];

  while (response.functionCalls() && iteration < MAX_ITERATIONS) {
    iteration++;
    const functionCalls = response.functionCalls();
    if (!functionCalls) break;

    const functionResponses = [];
    for (const call of functionCalls) {
      const handler = toolHandlers[call.name as keyof typeof toolHandlers];
      if (handler) {
        finalToolCalls.push(call.name);
        const output = await (handler as any)(call.args);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: output,
          },
        });
      }
    }

    const nextResult = await chat.sendMessage(functionResponses);
    response = nextResult.response;
  }

  const parseResponse = (text: string): { markdown: string; data: AnalysisData } => {
    let markdown = text;
    let data: AnalysisData = {};
    
    const parts = text.split("---METADATA---");
    if (parts.length > 1) {
      markdown = parts[0].trim();
      const jsonStr = parts[1].trim();
      try {
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) data = JSON.parse(match[0]);
      } catch (e) {
        console.error("Failed to parse metadata JSON from split:", e);
      }
    } else {
      try {
        const match = text.match(/\{[\s\S]*\}$/);
        if (match) {
          data = JSON.parse(match[0]);
          markdown = text.substring(0, match.index).trim();
        }
      } catch (e) {
        console.error("Fallback JSON parse failed:", e);
      }
    }
    return { markdown, data };
  };

  let { markdown, data } = parseResponse(response.text());

  const evaluation = await evaluateAnalysis(context, jd, markdown);

  if (!evaluation.passed) {
    const correctionResult = await chat.sendMessage(
      JUDGE_CORRECTION_PROMPT(evaluation.score, evaluation.critique),
    );
    const corrected = parseResponse(correctionResult.response.text());
    markdown = corrected.markdown;
    data = corrected.data;
  }

  return {
    markdown,
    data,
    toolUsed: finalToolCalls.join(", ") || "none",
  };
}
