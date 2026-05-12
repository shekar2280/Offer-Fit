import { GoogleGenerativeAI } from "@google/generative-ai";
import { ANALYSIS_PROMPT, JUDGE_CORRECTION_PROMPT, STRATEGY_PROMPT } from "./prompts";
import { toolDefinitions, toolHandlers } from "./tools";
import { evaluateAnalysis, evaluateResumeAudit } from "./evaluator";
import { GEMINI_MODELS, MODEL_PRICING } from "../constants";
import { logSystemEvent } from "../supabase/logger";
import { calculateAICost } from "./utils";
import { getCompanyIntel, upsertCompanyIntel } from "../supabase/intel";
import { performSearch } from "./tools";
import { RESEARCH_DISTILLATION_PROMPT } from "./prompts";
import { SupabaseClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AgenticAnalysisResult {
  markdown: string;
  data: any;
  toolUsed: string;
  usage: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  estimated_cost: number;
}

export async function runAgenticAnalysis(
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode?: "analyze" | "customize",
  bypassJudge: boolean = false,
  userName?: string,
  intel?: any,
  strategy?: any 
): Promise<AgenticAnalysisResult> {
  let response;
  let finalToolCalls: string[] = [];
  let totalUsage = {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    totalTokenCount: 0
  };
  let totalCost = 0;

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
        mode,
        userName,
        intel,
        strategy
      );

      let result = await chat.sendMessage(prompt);
      response = result.response;

      if (response.usageMetadata) {
        totalUsage.promptTokenCount += response.usageMetadata.promptTokenCount || 0;
        totalUsage.candidatesTokenCount += response.usageMetadata.candidatesTokenCount || 0;
        totalUsage.totalTokenCount += response.usageMetadata.totalTokenCount || 0;
        totalCost += calculateAICost(modelId, response.usageMetadata);
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
          totalCost += calculateAICost(modelId, response.usageMetadata);
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
      usage: totalUsage,
      estimated_cost: totalCost
    };
  }

  const evaluation = await evaluateAnalysis(context, jd, markdown);
  
  if (evaluation.usage) {
    totalUsage.promptTokenCount += evaluation.usage.promptTokenCount || 0;
    totalUsage.candidatesTokenCount += evaluation.usage.candidatesTokenCount || 0;
    totalUsage.totalTokenCount += evaluation.usage.totalTokenCount || 0;
    totalCost += evaluation.estimated_cost || 0;
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
          totalCost += calculateAICost(modelName, correctedResponse.usageMetadata);
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
          if (cData.verdict && cData.verdict.toString().trim().toUpperCase() === "REJECT") {
            cData.outreach_email = "";
          }
          data = cData;
          markdown = cText.replace(cText.substring(cStartIndex, cEndIndex + jsonEndMarker.length), "").trim();
        } catch (e) {}
      }
    }
  }

  if (data && data.verdict && data.verdict.toString().trim().toUpperCase() === "REJECT") {
    data.outreach_email = "";
  }

  return {
    markdown,
    data,
    toolUsed: finalToolCalls.join(", ") || "none",
    usage: totalUsage,
    estimated_cost: totalCost
  };
}

export async function runResearchAgent(
  supabase: SupabaseClient,
  companyName: string
) {
  const cachedIntel = await getCompanyIntel(supabase, companyName);
  if (cachedIntel) {
    return cachedIntel;
  }

  const searchQueries = [
    `${companyName} engineering tech stack and backend tools 2024 2025`,
    `${companyName} company values engineering culture mission`,
    `${companyName} recent engineering blog posts and technical challenges`
  ];

  const searchPromises = searchQueries.map(q => performSearch(q));
  const results = await Promise.all(searchPromises);
  const rawData = JSON.stringify(results.flat());

  const prompt = RESEARCH_DISTILLATION_PROMPT(companyName, rawData);
  
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let distilledData = { tech_stack: {}, values_culture: "", engineering_blog_summary: "", is_startup: false };
      const jsonStartMarker = "===JSON_START===";
      const jsonEndMarker = "===JSON_END===";
      const startIndex = text.indexOf(jsonStartMarker);
      const endIndex = text.indexOf(jsonEndMarker);

      if (startIndex !== -1 && endIndex !== -1) {
        const jsonStr = text.substring(startIndex + jsonStartMarker.length, endIndex).trim();
        try {
          distilledData = JSON.parse(jsonStr);
        } catch (e) {}
      }

      const savedIntel = await upsertCompanyIntel(supabase, {
        company_name: companyName,
        ...distilledData
      });

      return savedIntel;
    } catch (error: any) {
      continue;
    }
  }
  
  return await upsertCompanyIntel(supabase, {
    company_name: companyName,
    tech_stack: {},
    values_culture: "Intelligence research skipped due to model availability.",
    engineering_blog_summary: "",
    is_startup: true
  });
}

export async function runStrategyAgent(
  companyName: string,
  position: string,
  resume: string,
  jd: string,
  intel: any
) {
  const prompt = STRATEGY_PROMPT(companyName, position, resume, jd, intel);
  
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      let strategy = { strategy_pillars: [], key_keywords_to_inject: [], culture_vibe: "" };
      const jsonStartMarker = "===JSON_START===";
      const jsonEndMarker = "===JSON_END===";
      const startIndex = text.indexOf(jsonStartMarker);
      const endIndex = text.indexOf(jsonEndMarker);

      if (startIndex !== -1 && endIndex !== -1) {
        const jsonStr = text.substring(startIndex + jsonStartMarker.length, endIndex).trim();
        try {
          strategy = JSON.parse(jsonStr);
        } catch (e) {}
      }

      return strategy;
    } catch (error: any) {
      continue;
    }
  }

  return { 
    strategy_pillars: ["Focus on core technical alignment and impact metrics."], 
    key_keywords_to_inject: [], 
    culture_vibe: "Professional and impact-oriented" 
  };
}

export async function runMultiStepCustomization(
  supabase: SupabaseClient,
  companyName: string,
  position: string,
  resumeText: string,
  jd: string,
  location?: string,
  jobType?: string,
  userName?: string
) {
  const intel = await runResearchAgent(supabase, companyName);
  const strategy = await runStrategyAgent(companyName, position, resumeText, jd, intel);
  const draftResults = await runAgenticAnalysis(
    companyName,
    position,
    resumeText,
    jd,
    location,
    jobType,
    "customize",
    true,
    userName,
    intel,
    strategy
  );

  const audit = await evaluateResumeAudit(resumeText, draftResults.markdown);

  return {
    ...draftResults,
    strategy,
    intel,
    audit
  };
}
