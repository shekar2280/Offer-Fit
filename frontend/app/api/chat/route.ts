import { createClient } from "@/services/supabase/server";
import { getRelevantContext } from "@/services/supabase/rag";
import {
  runAnalysisAgent,
  runMultiStepCustomization,
  runResearchAgent,
  AgenticAnalysisResult
} from "@/lib/ai/agent";
import { logSystemEvent } from "@/services/supabase/logger";
import { PLAN_QUOTAS, PlanType, getMidnightISTResetMs } from "@/config/constants";

import { AnalysisResult } from "@/types";
import { checkRateLimit, getCache, setCache } from "@/services/redis";
import { createHash } from "crypto";

function makeSSE(controller: ReadableStreamDefaultController) {
  const encoder = new TextEncoder();
  return {
    send(data: object) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    },
    close() {
      controller.close();
    },
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages,
    companyName,
    position,
    resumeText,
    analysisId,
    location,
    jobType,
    mode,
    bypassJudge,
  } = body;

  const testSecret = (
    body.testSecret ||
    req.headers.get("x-test-secret") ||
    ""
  ).trim();
  const serverSecret = (process.env.NEXT_PUBLIC_BENCHMARK_SECRET || "").trim();
  const isTestMode = testSecret !== "" && testSecret === serverSecret;

  const stream = new ReadableStream({
    async start(controller) {
      const sse = makeSSE(controller);

      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user && !isTestMode) {
          await logSystemEvent({
            level: "ERROR",
            source: "AUTH_FAILURE",
            message: "Unauthorized API access attempt",
            details: { mode }
          });
          sse.send({ type: "error", error: "Unauthorized" });
          sse.close();
          return;
        }

        const jd = messages[messages.length - 1].content;
        const context =
          resumeText ||
          (await getRelevantContext(
            supabase,
            user?.id || "benchmark_test_id",
            jd,
          ));

        const jdHash = createHash("sha256").update(context + jd + mode).digest("hex");
        const cacheKey = `report:${user?.id || "benchmark"}:${jdHash}`;
        const cachedReport = (await getCache(cacheKey)) as { markdown?: string; metadata?: unknown; toolUsed?: string } | null;

        if (cachedReport) {
          sse.send({
            type: "progress",
            step: 5,
            message: "Restoring report from cache...",
          });
          sse.send({
            type: "result",
            analysis: cachedReport.markdown,
            metadata: cachedReport.metadata,
            toolUsed: cachedReport.toolUsed || "none",
          });
          sse.close();
          return;
        }

        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("plan_type")
            .eq("id", user.id)
            .maybeSingle();

          const plan: PlanType = (profileData?.plan_type as PlanType) || "free";
          const userQuota = PLAN_QUOTAS[plan];
          const resetMs = getMidnightISTResetMs();
          const resetHours = Math.ceil(resetMs / 1000 / 60 / 60);

          const dailyLimitCheck = await checkRateLimit(
            `rate:daily:${user.id}`,
            userQuota,
          );
          if (!dailyLimitCheck.success) {
            await logSystemEvent({
              level: "WARN",
              source: "QUOTA_EXHAUSTED",
              message: "Daily quota reached for user",
              userId: user.id,
              details: { limit: userQuota, plan }
            });
            sse.send({
              type: "error",
              error: `Daily quota reached (${userQuota}/day on ${plan} plan). Resets at midnight IST — in ~${resetHours}h.`,
            });
            sse.close();
            return;
          }

          supabase.rpc("increment_user_usage", { p_user_id: user.id }).then(() => {
            logSystemEvent({
              level: "INFO",
              source: "QUOTA_CHARGED",
              message: `Charged 1 credit for ${mode}`,
              userId: user.id,
              details: { mode, jdHash }
            });
          });
        }

        sse.send({
          type: "progress",
          step: 1,
          message: "Loading resume context...",
        });


        sse.send({
          type: "progress",
          step: 2,
          message:
            mode === "customize"
              ? "Reading master resume..."
              : "Analyzing job description...",
        });

        const agentMode: "analyze" | "customize" =
          mode === "customize" ? "customize" : "analyze";
        const userName =
          user?.user_metadata?.full_name || user?.user_metadata?.name;

        let result: AgenticAnalysisResult;

        if (mode === "customize") {
          sse.send({
            type: "progress",
            step: 3,
            message: "Tailoring experience sections...",
          });

          let fetchedPillars = null;
          if (analysisId) {
            const { data } = await supabase.from("analyses").select("jd_pillars").eq("id", analysisId).single();
            if (data?.jd_pillars) {
                fetchedPillars = data.jd_pillars;
            }
          }

          result = await runMultiStepCustomization(
            supabase,
            companyName,
            position,
            context,
            jd,
            location,
            jobType,
            userName,
            fetchedPillars
          );
        } else {
          sse.send({
            type: "progress",
            step: 3,
            message: "Researching company intel...",
          });

          const researchResult = await runResearchAgent(
            supabase,
            companyName,
            position,
            location
          );

          sse.send({
            type: "progress",
            step: 4,
            message: "Matching skills & keywords...",
          });

          const analysisResult = await runAnalysisAgent(
            companyName,
            position,
            context,
            jd,
            location,
            jobType,
            "analyze",
            bypassJudge,
            userName,
            researchResult
          );

          const intelData = {
            salary_insight: researchResult.salary_insight,
            company_cheat_sheet: researchResult.company_cheat_sheet,
            culture_traits: researchResult.culture_traits
          };

          const totalPromptTokens = (researchResult.usage?.promptTokenCount || 0) + (analysisResult.usage?.promptTokenCount || 0);
          const totalCandidatesTokens = (researchResult.usage?.candidatesTokenCount || 0) + (analysisResult.usage?.candidatesTokenCount || 0);
          const totalTokenCount = (researchResult.usage?.totalTokenCount || 0) + (analysisResult.usage?.totalTokenCount || 0);
          const totalCost = (researchResult.estimated_cost || 0) + (analysisResult.estimated_cost || 0);

          result = { 
            ...analysisResult, 
            data: { ...(analysisResult.data as Record<string, unknown>), ...intelData },
            intel: researchResult,
            usage: {
              promptTokenCount: totalPromptTokens,
              candidatesTokenCount: totalCandidatesTokens,
              totalTokenCount: totalTokenCount
            },
            estimated_cost: totalCost
          };
        }

        const {
          markdown,
          data,
          toolUsed,
          usage,
          estimated_cost,
          intel: finalIntel,
          strategy,
          audit,
          personaLabel,
        } = result;

        sse.send({
          type: "progress",
          step: 5,
          message:
            mode === "customize"
              ? "Refining LaTeX output..."
              : "Computing match score...",
        });


        const parsedData = data as Partial<AnalysisResult>;

        let existingTokens = 0;
        let existingCost = 0;

        if (analysisId && user) {
          const { data: existingAnalysis } = await supabase
            .from("analyses")
            .select("total_tokens, estimated_cost")
            .eq("id", analysisId)
            .single();

          existingTokens = Number(existingAnalysis?.total_tokens || 0);
          existingCost = Number(existingAnalysis?.estimated_cost || 0);

          if (agentMode === "customize") {
            await supabase
              .from("analyses")
              .update({
                customized_latex: markdown,
                total_tokens: existingTokens + (usage?.totalTokenCount || 0),
                estimated_cost: existingCost + (estimated_cost || 0),
                intel_id: finalIntel?.id || null,
                customization_strategy: strategy || null,
                audit_report: audit || null,
                status: "completed"
              })
              .eq("id", analysisId);
          } else {
            const updatePayload: Record<string, unknown> = {
              match_score: parsedData.match_score || 0,
              verdict: parsedData.verdict || "REJECT",
              ats_score: parsedData.ats_score || 0,
              keyword_density: parsedData.keyword_density || 0,
              matched_skills: parsedData.matched_skills || [],
              missing_skills: parsedData.missing_skills || [],
              salary_insight: parsedData.salary_insight || null,
              red_flags: parsedData.red_flags || [],
              interview_questions: parsedData.interview_questions || [],
              outreach_email: parsedData.outreach_email || "",
              culture_fit_score: parsedData.culture_fit_score ?? null,
              company_cheat_sheet: parsedData.company_cheat_sheet || null,
              culture_traits: parsedData.culture_traits || [],
              total_tokens: existingTokens + (usage?.totalTokenCount || 0),
              estimated_cost: existingCost + (estimated_cost || 0),
              analysis_result: markdown,
              intel_id: finalIntel?.id || null,
              status: "completed"
            };
            await supabase
              .from("analyses")
              .update(updatePayload)
              .eq("id", analysisId);
          }
        }

        sse.send({
          type: "progress",
          step: 5,
          message: "Finalizing report...",
        });

        const metadata =
          agentMode === "customize"
            ? {
                total_tokens: existingTokens + (usage?.totalTokenCount || 0),
                estimated_cost: existingCost + (estimated_cost || 0),
                intel: finalIntel || null,
                strategy: strategy || null,
                audit: audit || null,
              }
            : {
                match_score: parsedData.match_score || 0,
                verdict: parsedData.verdict || "REJECT",
                ats_score: parsedData.ats_score || 0,
                keyword_density: parsedData.keyword_density || 0,
                matched_skills: parsedData.matched_skills || [],
                missing_skills: parsedData.missing_skills || [],
                salary_insight: parsedData.salary_insight || null,
                red_flags: parsedData.red_flags || [],
                interview_questions: parsedData.interview_questions || [],
                outreach_email: parsedData.outreach_email || "",
                culture_fit_score: parsedData.culture_fit_score ?? null,
                company_cheat_sheet: parsedData.company_cheat_sheet || null,
                culture_traits: parsedData.culture_traits || [],
                total_tokens: existingTokens + (usage?.totalTokenCount || 0),
                estimated_cost: existingCost + (estimated_cost || 0),
                intel: finalIntel || null,
              };

        await setCache(cacheKey, { markdown, metadata, toolUsed }, 86400);

        sse.send({
          type: "result",
          analysis: markdown,
          metadata: { ...metadata, personaLabel: personaLabel || null },
          toolUsed,
        });

        sse.close();
      } catch (error: unknown) {
        await logSystemEvent({
          level: "ERROR",
          source: "API_CHAT",
          message: (error as Error).message || "Analysis failed",
          details: { error },
        });

        if (analysisId) {
          const supabase = await createClient();
          await supabase
            .from("analyses")
            .update({ status: "failed" })
            .eq("id", analysisId);
        }

        sse.send({ type: "error", error: "Analysis failed" });
        sse.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

