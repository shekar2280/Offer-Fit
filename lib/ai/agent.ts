import { GoogleGenerativeAI } from "@google/generative-ai";
import { toolDefinitions, toolHandlers } from "./tools";
import { evaluateAnalysis } from "./evaluator";
import { ANALYSIS_PROMPT, JUDGE_CORRECTION_PROMPT } from "./prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runAgenticAnalysis(
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const chat = model.startChat();
  const prompt = ANALYSIS_PROMPT(companyName, position, context, jd, location, jobType);

  let result = await chat.sendMessage(prompt);
  let response = result.response;
  let iteration = 0;
  const MAX_ITERATIONS = 3;
  let finalToolCalls: string[] = [];

  while (iteration < MAX_ITERATIONS) {
    const calls = response.functionCalls();
    if (!calls || calls.length === 0) break;

    iteration++;
    const functionResponses = [];

    for (const call of calls) {
      finalToolCalls.push(call.name);
      const handler = toolHandlers[call.name as keyof typeof toolHandlers];
      if (handler) {
        const toolResult = await handler(call.args as any);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        });
      }
    }

    const nextResult = await chat.sendMessage(functionResponses);
    response = nextResult.response;
  }

  let fullText = response.text();
  let parts = fullText.split("---METADATA---");
  let markdown = parts[0].trim();
  let jsonStr = parts[1]?.trim() || "{}";
  let data = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || "{}");

  const evaluation = await evaluateAnalysis(context, jd, markdown);
  
  if (!evaluation.passed) {
    const correctionResult = await chat.sendMessage(
      JUDGE_CORRECTION_PROMPT(evaluation.score, evaluation.critique)
    );
    const correctedResponse = correctionResult.response;
    const correctedText = correctedResponse.text();
    const correctedParts = correctedText.split("---METADATA---");
    markdown = correctedParts[0].trim();
    const correctedJsonStr = correctedParts[1]?.trim() || "{}";
    data = JSON.parse(correctedJsonStr.match(/\{[\s\S]*\}/)?.[0] || "{}");
  }

  return {
    markdown,
    data,
    toolUsed: finalToolCalls.join(", ") || "none"
  };
}
