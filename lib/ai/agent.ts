import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYSIS_PROMPT, JUDGE_CORRECTION_PROMPT } from "./prompts";
import { toolDefinitions, toolHandlers } from "./tools";
import { evaluateAnalysis } from "./evaluator";
import { GEMINI_MODELS } from "../constants";
import { logSystemEvent } from "../supabase/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runAgenticAnalysis(
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode?: "analyze" | "customize",
  bypassJudge: boolean = false
) {
  let response;
  let finalToolCalls: string[] = [];
  let totalUsage = {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    totalTokenCount: 0
  };

  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        tools: [{ functionDeclarations: Object.values(toolDefinitions) }],
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

      if (response.usageMetadata) {
        totalUsage.promptTokenCount += response.usageMetadata.promptTokenCount || 0;
        totalUsage.candidatesTokenCount += response.usageMetadata.candidatesTokenCount || 0;
        totalUsage.totalTokenCount += response.usageMetadata.totalTokenCount || 0;
      }
      
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

        if (response.usageMetadata) {
          totalUsage.promptTokenCount += response.usageMetadata.promptTokenCount || 0;
          totalUsage.candidatesTokenCount += response.usageMetadata.candidatesTokenCount || 0;
          totalUsage.totalTokenCount += response.usageMetadata.totalTokenCount || 0;
        }
      }
      
      if (response) break;
    } catch (error: any) {
      await logSystemEvent({
        level: "WARN",
        source: "AGENT_AI",
        message: `Model ${modelId} failed`,
        details: { error: error.message }
      });
      continue;
    }
  }

  if (!response) throw new Error("All AI models failed to respond.");

  const text = response.text();
  let markdown = text;
  let data: any = {};

  const jsonStartMarker = "===JSON_START===";
  const jsonEndMarker = "===JSON_END===";
  const startIndex = text.indexOf(jsonStartMarker);
  const endIndex = text.indexOf(jsonEndMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    let jsonStr = text.substring(startIndex + jsonStartMarker.length, endIndex).trim();
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      try {
        const sanitized = jsonStr.replace(/\n/g, "\\n").replace(/\\(?!"|\\|\/|b|f|n|r|t|u)/g, "\\\\");
        data = JSON.parse(sanitized);
      } catch (secondError) {
        throw secondError;
      }
    }
    markdown = text.replace(text.substring(startIndex, endIndex + jsonEndMarker.length), "").trim();
  } else {
    const jsonMatch = text.match(/===JSON_START===\s*(\{[\s\S]*\})\s*===JSON_END===/);
    if (jsonMatch) {
      try {
        data = JSON.parse(jsonMatch[1]);
        markdown = text.replace(jsonMatch[0], "").trim();
      } catch (e) {}
    }
  }

  if (mode === "customize" || bypassJudge) {
    return {
      markdown,
      data,
      toolUsed: finalToolCalls.join(", ") || "none",
      usage: totalUsage
    };
  }

  const evaluation = await evaluateAnalysis(context, jd, markdown);
  
  if (evaluation.usage) {
    totalUsage.promptTokenCount += evaluation.usage.promptTokenCount || 0;
    totalUsage.candidatesTokenCount += evaluation.usage.candidatesTokenCount || 0;
    totalUsage.totalTokenCount += evaluation.usage.totalTokenCount || 0;
  }

  if (!evaluation.passed) {
    let correctedResponse = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const cModel = genAI.getGenerativeModel({ model: modelName });
        const cResult = await cModel.generateContent(
          JUDGE_CORRECTION_PROMPT(evaluation.score, evaluation.critique)
        );
        correctedResponse = cResult.response;
        
        if (correctedResponse.usageMetadata) {
          totalUsage.promptTokenCount += correctedResponse.usageMetadata.promptTokenCount || 0;
          totalUsage.candidatesTokenCount += correctedResponse.usageMetadata.candidatesTokenCount || 0;
          totalUsage.totalTokenCount += correctedResponse.usageMetadata.totalTokenCount || 0;
        }
        break;
      } catch (e) {}
    }

    if (correctedResponse) {
      const cText = correctedResponse.text();
      const cStartIndex = cText.indexOf(jsonStartMarker);
      const cEndIndex = cText.indexOf(jsonEndMarker);

      if (cStartIndex !== -1 && cEndIndex !== -1) {
        let cJsonStr = cText.substring(cStartIndex + jsonStartMarker.length, cEndIndex).trim();
        try {
          const cData = JSON.parse(cJsonStr);
          data = cData;
          markdown = cText.replace(cText.substring(cStartIndex, cEndIndex + jsonEndMarker.length), "").trim();
        } catch (e) {}
      }
    }
  }

  return {
    markdown,
    data,
    toolUsed: finalToolCalls.join(", ") || "none",
    usage: totalUsage
  };
}
