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

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash-lite"
];

export async function runAgenticAnalysis(
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode?: "analyze" | "customize"
): Promise<{ markdown: string; data: AnalysisData; toolUsed: string }> {
  let response;
  let finalToolCalls: string[] = [];

  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
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
      response = result.response;
      
      let iteration = 0;
      const MAX_ITERATIONS = 3;

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
      
      if (response) break;
    } catch (error) {
      console.error(`Model ${modelId} failed, trying next...`);
      continue;
    }
  }

  if (!response) throw new Error("All AI models failed to respond.");

  const parseResponse = (text: string): { markdown: string; data: AnalysisData } => {
    let markdown = text;
    let data: AnalysisData = {};
    
    try {
      const jsonStartMarker = "===JSON_START===";
      const jsonEndMarker = "===JSON_END===";
      const startIndex = text.indexOf(jsonStartMarker);
      const endIndex = text.indexOf(jsonEndMarker);

      if (startIndex !== -1 && endIndex !== -1) {
        let jsonStr = text.substring(startIndex + jsonStartMarker.length, endIndex).trim();
        
        try {
          data = JSON.parse(jsonStr);
        } catch (parseError) {
          console.warn("Standard JSON parse failed, attempting sanitization...");
          const sanitized = jsonStr
            .replace(/\n/g, "\\n")
            .replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, "\\\\");
          data = JSON.parse(sanitized);
        }
        
        markdown = text.replace(text.substring(startIndex, endIndex + jsonEndMarker.length), "").trim();
      } else {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
          markdown = text.replace(jsonMatch[0], "").trim();
        }
      }
    } catch (e) {
      console.error("JSON Parse failed:", e);
    }
    
    return { markdown, data };
  };

  let { markdown, data } = parseResponse(response.text());

  if (mode === "customize") {
    return {
      markdown,
      data,
      toolUsed: finalToolCalls.join(", ") || "none",
    };
  }

  const evaluation = await evaluateAnalysis(context, jd, markdown);

  if (!evaluation.passed) {
    const correctionModels = ["gemini-2.5-pro", "gemini-2.5-flash-lite"];
    for (const modelId of correctionModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const chat = model.startChat();
        const correctionResult = await chat.sendMessage(
          JUDGE_CORRECTION_PROMPT(evaluation.score, evaluation.critique)
        );
        const corrected = parseResponse(correctionResult.response.text());
        markdown = corrected.markdown;
        data = corrected.data;
        break;
      } catch (e) {
        console.error(`Correction failed with ${modelId}, using original.`);
      }
    }
  }

  return {
    markdown,
    data,
    toolUsed: finalToolCalls.join(", ") || "none",
  };
}
