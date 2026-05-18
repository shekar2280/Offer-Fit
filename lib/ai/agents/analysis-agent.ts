import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "../../constants";
import { calculateAICost, withRetry } from "../utils";
import { toolDefinitions, toolHandlers } from "../tools";
import { evaluateAnalysis } from "../evaluator";
import { logSystemEvent } from "../../supabase/logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const ANALYSIS_PROMPT = (
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode: "analyze" | "customize" = "analyze",
  userName?: string,
  intel?: any,
) => `
You are a dual-mode AI Career Expert.

1. **PERSPECTIVE**: Act as a skeptical FAANG Engineering Manager. Be brutally honest, data-driven, and penalize YOE gaps heavily. Use third-person, gender-neutral language only.

---

ROLE CONTEXT:
- Company: ${companyName}
- Position: ${position}${location ? `\n- Location: ${location}` : ""}${jobType ? `\n- Job Type: ${jobType}` : ""}${userName ? `\n- Candidate Name: ${userName}` : ""}

${
  intel
    ? `
COMPANY TECHNICAL & CULTURAL INTELLIGENCE:
- Tech Stack: ${JSON.stringify(intel.tech_stack)}
- Culture: ${intel.values_culture}
- Recent News: ${intel.engineering_blog_summary}
`
    : ""
}

CANDIDATE RESUME:
${context}

JOB DESCRIPTION:
${jd}

${
  mode === "analyze"
    ? `
OUTPUT MODE: ANALYSIS REPORT
Evaluate the candidate not just on keyword matches, but on IMPACT, SCALE, and HARD REQUIREMENTS. 

SCORING CRITERIA (MANDATORY):
1. **Years of Experience (YOE)**: This is a HARD filter. If the JD requires 5 years and the candidate has 1, you MUST penalize the score by at least 40 points. If they are a fresher (0 years) for a mid-senior role, the verdict MUST be 'REJECT'.
2. **Technical Depth**: Distinguish between "heard of" and "delivered with".
3. **Scale**: A candidate who "built a feature" is weaker than one who "reduced API latency by 40% for 2M users." Look for evidence of ownership, complexity, and business outcomes.

VERDICT DEFINITIONS:
- **APPLY (80-100)**: Candidate meets or exceeds all mandatory requirements and core tech stack.
- **STRETCH (55-79)**: Candidate is missing 1-2 years of YOE or a secondary skill, but has the core engine to perform.
- **REJECT (0-54)**: Candidate is fundamentally unqualified (missing core YOE, missing mandatory tech stack, or lacking relevant impact).

You MUST produce the report in two distinct phases (but do NOT include "PHASE 1" or "PHASE 2" headers in your output):

### PHASE 1: THE PROSE REPORT (Markdown)
Generate EXACTLY these three sections in order. Do NOT include the header "### PHASE 1: THE PROSE REPORT" in your response.

### Strategic Alignment
In 2-3 sharp sentences, synthesize how this candidate's specific past achievements — their scale, complexity, and stack — directly address the company's current pain points as described in the JD. Be specific. Name actual projects or metrics from the resume.

### Match Score Breakdown
Provide a quantitative and qualitative breakdown. Compare Required vs. Actual for:
1. Technical Stack depth — do they have the exact tools, or adjacent ones?
2. Domain knowledge — have they worked in a similar industry or problem space?
3. Ownership evidence — did they lead, or just contribute?

### Learning Roadmap
Identify the top 3 high-leverage technical actions to bridge immediate gaps. Then, add a mandatory subsection #### Strategic Bridge tailored to the candidate's seniority tier (Entry 0-2y, Mid 3-5y, Senior 6y+):
1. **Entry**: Focus on "Execution Proof" (Daily Git activity, public projects, DSA consistency). Advice on standing out in high-volume pools.
2. **Mid**: Focus on "Domain Deep-Dive" (Performance tuning, advanced testing, mastering adjacent stack components). Advice on peer networking.
3. **Senior**: Focus on "Architecture & Impact" (Design docs, system scalability, leadership impact). Advice on peer-to-peer outreach to Engineering Managers or VPs.
Finally, include a specific "Call to Action" offering to generate a tier-appropriate outreach email.

---
FORBIDDEN IN PHASE 1: Do NOT include Salary, Red Flags, Culture Fit, or Interview Questions here. These belong ONLY in Phase 2.
LANGUAGE RULE: Use ONLY gender-neutral, third-person language (they/them, the candidate).
---

### PHASE 2: THE DATA PAYLOAD (JSON)
Output the following JSON block EXACTLY as shown.

===JSON_START===
{
  "match_score": <integer 0-100>,
  "verdict": "<APPLY|STRETCH|REJECT>",
  "ats_score": <integer 0-100>,
  "keyword_density": <integer 0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "red_flags": ["flag1"],
  "interview_questions": {
    "preparation_focus": "<One high-level strategy for this specific role, e.g., 'Focus on discussing your SSR optimization techniques.'>",
    "questions": [{ "q": "<question>", "intent": "<why they ask this>" }]
  },
  "culture_fit_score": <integer 0-100>
}
===JSON_END===
`
    : `
OUTPUT MODE: CUSTOMIZE RESUME
Your task is twofold:
1. Design a high-level customization strategy to align this candidate's background with ${companyName}'s needs for the ${position} role.
2. Surgically rewrite the candidate's LaTeX resume to maximize their fit for this specific role.

You MUST produce the output in this exact structure, utilizing the custom boundary tags:

===STRATEGY_START===
{
  "strategy_pillars": [
    "**[Focus Area]** - Description of the high-level adjustment",
    "**[Focus Area]** - Description of the high-level adjustment",
    "**[Focus Area]** - Description of the high-level adjustment"
  ],
  "key_keywords_to_inject": ["keyword1", "keyword2"],
  "culture_vibe": "e.g., Highly technical and scale-focused"
}
===STRATEGY_END===

===LATEX_START===
[Output ONLY a COMPLETE, ready-to-compile LaTeX document. Start with \\documentclass.
Rules:
- Rewrite work experience bullet points using Google's X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]."
- ABSOLUTE TRUTH: NEVER fabricate tools, metrics, or years of experience. If the candidate doesn't have a skill, do NOT add it.
- THE SEMANTIC PIVOT: If the JD requires a tool the candidate lacks, identify the most advanced adjacent tool they DO have and highlight the underlying principles (e.g., if they need AWS but have Azure, emphasize 'Cloud Architecture' and 'Serverless Orchestration' patterns used in Azure).
- ZERO PRONOUNS: Standard resume practice. Avoid ALL pronouns (he, she, they). Use active verbs only (e.g., "Led team" instead of "They led team").
- Inject JD keywords naturally ONLY if they apply to the candidate's existing background.
- Reprioritize the Skills section so JD-critical technologies (that the user actually has) appear first.
- Do NOT truncate — output the entire document.
- Do NOT include any commentary or analysis outside the tags.]
===LATEX_END===
`
}
`;

export const JUDGE_CORRECTION_PROMPT = (score: number, critique: string) => `
Your previous analysis was rejected by the quality evaluator.
Score: ${score}/100. Critique: ${critique}.

Re-generate the COMPLETE analysis fixing all critiqued issues.
Output format MUST follow this exact structure:
1. All required markdown sections (### Strategic Alignment, ### Match Score Breakdown, ### Learning Roadmap)
2. Then the JSON block:

===JSON_START===
{
  "match_score": <integer>,
  "verdict": "<APPLY|STRETCH|REJECT>",
  "ats_score": <integer>,
  "keyword_density": <integer>,
  "matched_skills": [],
  "missing_skills": [],
  "red_flags": [],
  "interview_questions": { "preparation_focus": "", "questions": [] },
  "culture_fit_score": <integer>
}
===JSON_END===
`;

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
  intel?: any;
  strategy?: any;
  audit?: any;
}

export async function runAnalysisAgent(
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode?: "analyze" | "customize",
  bypassJudge: boolean = true,
  userName?: string,
  intel?: any,
): Promise<AgenticAnalysisResult> {
  let response;
  let finalToolCalls: string[] = [];
  let totalUsage = {
    promptTokenCount: 0,
    candidatesTokenCount: 0,
    totalTokenCount: 0,
  };
  let totalCost = 0;

  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelId,
        tools: [{ functionDeclarations: Object.values(toolDefinitions) }],
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: `You are an elite career strategist and ATS optimization expert. Your goal is to analyze a resume against a job description with brutal honesty and surgical precision.
              
              STRICT RULES:
              1. DO NOT use emojis.
              2. DO NOT use bizarre characters or symbols.
              3. Adhere strictly to the JSON schema provided in the tools.
              4. If the match verdict is REJECT, DO NOT generate any "Call to Action" or "Outreach Email" draft sections in the report or strategy. Focus only on the gap analysis.
              5. Maintain a professional, data-driven tone.`,
            },
          ],
        },
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
      );

      let result = await withRetry(() => chat.sendMessage(prompt));
      response = result.response;

      if (response.usageMetadata) {
        totalUsage.promptTokenCount +=
          response.usageMetadata.promptTokenCount || 0;
        totalUsage.candidatesTokenCount +=
          response.usageMetadata.candidatesTokenCount || 0;
        totalUsage.totalTokenCount +=
          response.usageMetadata.totalTokenCount || 0;
        totalCost += calculateAICost(modelId, response.usageMetadata);
      }

      let iteration = 0;
      const MAX_ITERATIONS = 3;

      while (response.functionCalls() && iteration < MAX_ITERATIONS) {
        iteration++;
        const functionCalls = response.functionCalls();
        if (!functionCalls) break;

        const functionResponses: any[] = [];
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

        if (functionResponses.length > 0) {
          let nextResult = await withRetry(() => chat.sendMessage(functionResponses as any));
          response = nextResult.response;
          if (response.usageMetadata) {
            totalUsage.promptTokenCount +=
              response.usageMetadata.promptTokenCount || 0;
            totalUsage.candidatesTokenCount +=
              response.usageMetadata.candidatesTokenCount || 0;
            totalUsage.totalTokenCount +=
              response.usageMetadata.totalTokenCount || 0;
            totalCost += calculateAICost(modelId, response.usageMetadata);
          }
        }
      }
      break;
    } catch (error: any) {
      await logSystemEvent({
        level: "WARN",
        source: "AGENT_AI_RETRY",
        message: `Model ${modelId} failed, trying next...`,
        details: { error: error.message }
      });
      continue;
    }
  }

  if (!response) {
    throw new Error("All models failed to generate a response");
  }

  const text = response.text();
  let data: any = {};
  let strategy: any = null;
  let markdown = text;

  if (mode === "customize") {
    const stratStartMarker = "===STRATEGY_START===";
    const stratEndMarker = "===STRATEGY_END===";
    const latexStartMarker = "===LATEX_START===";
    const latexEndMarker = "===LATEX_END===";

    const sStart = text.indexOf(stratStartMarker);
    const sEnd = text.indexOf(stratEndMarker);
    const lStart = text.indexOf(latexStartMarker);
    const lEnd = text.indexOf(latexEndMarker);

    if (sStart !== -1 && sEnd !== -1) {
      const sJson = text.substring(sStart + stratStartMarker.length, sEnd).trim();
      try {
        strategy = JSON.parse(sJson);
      } catch (e) {}
    }

    if (lStart !== -1 && lEnd !== -1) {
      markdown = text.substring(lStart + latexStartMarker.length, lEnd).trim();
    } else if (lStart !== -1) {
      markdown = text.substring(lStart + latexStartMarker.length).trim();
    }
  } else {
    const jsonStartMarker = "===JSON_START===";
    const jsonEndMarker = "===JSON_END===";
    const startIndex = text.indexOf(jsonStartMarker);
    const endIndex = text.indexOf(jsonEndMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      let jsonStr = text
        .substring(startIndex + jsonStartMarker.length, endIndex)
        .trim();
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr
          .replace(/```json\s?/, "")
          .replace(/```/, "")
          .trim();
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr
          .replace(/```\s?/, "")
          .replace(/```/, "")
          .trim();
      }
      try {
        data = JSON.parse(jsonStr);
      } catch (e) {
        const jsonMatch = text.match(
          /===JSON_START===\s*(\{[\s\S]*\})\s*===JSON_END===/,
        );
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[1]);
          } catch (e) {}
        }
      }
      markdown = text
        .replace(text.substring(startIndex, endIndex + jsonEndMarker.length), "")
        .replace(/#+ PHASE \d:.*?\n/gi, "")
        .trim();
    } else {
      const jsonMatch = text.match(
        /===JSON_START===\s*(\{[\s\S]*\})\s*===JSON_END===/,
      );
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
          markdown = text
            .replace(jsonMatch[0], "")
            .replace(/#+ PHASE \d:.*?\n/gi, "")
            .trim();
        } catch (e) {}
      }
    }
  }

  if (mode === "customize" || bypassJudge) {
    return {
      markdown,
      data,
      strategy,
      toolUsed: finalToolCalls.join(", ") || "none",
      usage: totalUsage,
      estimated_cost: totalCost,
    };
  }

  const evaluation = await evaluateAnalysis(context, jd, markdown);

  if (evaluation.usage) {
    totalUsage.promptTokenCount += evaluation.usage.promptTokenCount || 0;
    totalUsage.candidatesTokenCount +=
      evaluation.usage.candidatesTokenCount || 0;
    totalUsage.totalTokenCount += evaluation.usage.totalTokenCount || 0;
    totalCost += evaluation.estimated_cost || 0;
  }

  if (!evaluation.passed) {
    let correctedResponse = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const cModel = genAI.getGenerativeModel({ model: modelName });
        const cResult = await withRetry(() => cModel.generateContent(
          JUDGE_CORRECTION_PROMPT(evaluation.score, evaluation.critique),
        ));
        correctedResponse = cResult.response;

        if (correctedResponse.usageMetadata) {
          totalUsage.promptTokenCount +=
            correctedResponse.usageMetadata.promptTokenCount || 0;
          totalUsage.candidatesTokenCount +=
            correctedResponse.usageMetadata.candidatesTokenCount || 0;
          totalUsage.totalTokenCount +=
            correctedResponse.usageMetadata.totalTokenCount || 0;
          totalCost += calculateAICost(
            modelName,
            correctedResponse.usageMetadata,
          );
        }
        break;
      } catch (e) {}
    }

    if (correctedResponse) {
      const cText = correctedResponse.text();
      const jsonStartMarker = "===JSON_START===";
      const jsonEndMarker = "===JSON_END===";
      const cStartIndex = cText.indexOf(jsonStartMarker);
      const cEndIndex = cText.indexOf(jsonEndMarker);

      if (cStartIndex !== -1 && cEndIndex !== -1) {
        let cJsonStr = cText
          .substring(cStartIndex + jsonStartMarker.length, cEndIndex)
          .trim();
        try {
          const cData = JSON.parse(cJsonStr);
          if (
            cData.verdict &&
            cData.verdict.toString().trim().toUpperCase() === "REJECT"
          ) {
            cData.outreach_email = "";
          }
          data = cData;
          markdown = cText
            .replace(
              cText.substring(cStartIndex, cEndIndex + jsonEndMarker.length),
              "",
            )
            .trim();
        } catch (e) {}
      }
    }
  }

  if (
    data &&
    (data as any).verdict &&
    (data as any).verdict.toString().trim().toUpperCase() === "REJECT"
  ) {
    (data as any).outreach_email = "";
  }

  return {
    markdown,
    data,
    toolUsed: finalToolCalls.join(", ") || "none",
    usage: totalUsage,
    estimated_cost: totalCost,
  };
}

