import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";
import {
  runAnalysisAgent,
  runMultiStepCustomization,
  runResearchAgent,
  runIntelAgent,
} from "@/lib/ai/agent";
import { logSystemEvent } from "@/lib/supabase/logger";
import { USAGE_LIMITS } from "@/lib/constants";

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

        let daily_count = 0;
        let hourly_count = 0;

        if (user) {
          const { data: usage } = await supabase
            .from("user_usage")
            .select("daily_count, hourly_count, total_count, last_request_at")
            .eq("user_id", user.id)
            .single();

          const now = new Date();
          const lastRequest = usage?.last_request_at
            ? new Date(usage.last_request_at)
            : new Date(0);
          const msSinceLast = now.getTime() - lastRequest.getTime();

          const startOfTodayUTC = Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
          );
          const startOfHourUTC = Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
          );

          const isDailyReset =
            lastRequest.getTime() < startOfTodayUTC ||
            msSinceLast > USAGE_LIMITS.DAILY_REFRESH_MS;

          const isHourlyReset =
            lastRequest.getTime() < startOfHourUTC ||
            msSinceLast > USAGE_LIMITS.HOURLY_REFRESH_MS;

          daily_count = isDailyReset ? 0 : usage?.daily_count || 0;
          hourly_count = isHourlyReset ? 0 : usage?.hourly_count || 0;
          const total_count = usage?.total_count || 0;

          if (daily_count >= USAGE_LIMITS.DAILY_QUOTA) {
            await logSystemEvent({
              level: "WARN",
              source: "QUOTA_EXHAUSTED",
              message: "Daily quota reached for user",
              userId: user.id,
              details: { count: daily_count }
            });
            sse.send({
              type: "error",
              error: `Daily quota reached (${USAGE_LIMITS.DAILY_QUOTA}/day). Your limits refresh every 24 hours.`,
            });
            sse.close();
            return;
          }
          if (hourly_count >= USAGE_LIMITS.HOURLY_QUOTA) {
            sse.send({
              type: "error",
              error: `Hourly limit exceeded (${USAGE_LIMITS.HOURLY_QUOTA}/hr). Please wait a few minutes.`,
            });
            sse.close();
            return;
          }

          await supabase.from("user_usage").upsert(
            {
              user_id: user.id,
              daily_count: daily_count + 1,
              hourly_count: hourly_count + 1,
              total_count: total_count + 1,
              last_request_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        }

        sse.send({
          type: "progress",
          step: 1,
          message: "Loading resume context...",
        });

        const jd = messages[messages.length - 1].content;
        const context =
          resumeText ||
          (await getRelevantContext(
            supabase,
            user?.id || "benchmark_test_id",
            jd,
          ));


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

        let result: any;

        if (mode === "customize") {
          sse.send({
            type: "progress",
            step: 3,
            message: "Tailoring experience sections...",
          });

          result = await runMultiStepCustomization(
            supabase,
            companyName,
            position,
            context,
            jd,
            location,
            jobType,
            userName
          );
        } else {
          sse.send({
            type: "progress",
            step: 3,
            message: "Researching company intel...",
          });

          const researchResult = await runResearchAgent(supabase, companyName);
          sse.send({
            type: "progress",
            step: 4,
            message: "Matching skills & keywords...",
          });

          const [analysisResult, intelData] = await Promise.all([
            runAnalysisAgent(
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
            ),
            runIntelAgent(companyName, position, location)
          ]);

          result = { 
            ...analysisResult, 
            data: { ...analysisResult.data, ...intelData },
            intel: researchResult 
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
        } = result;

        sse.send({
          type: "progress",
          step: 5,
          message:
            mode === "customize"
              ? "Refining LaTeX output..."
              : "Computing match score...",
        });


        if (analysisId && user) {
          if (agentMode === "customize") {
            await supabase
              .from("analyses")
              .update({
                customized_latex: markdown,
                total_tokens: usage?.totalTokenCount || 0,
                estimated_cost: estimated_cost,
                intel_id: finalIntel?.id || null,
                customization_strategy: strategy || null,
                audit_report: audit || null,
                status: "completed"
              })
              .eq("id", analysisId);
          } else {
            const updatePayload: Record<string, any> = {
              match_score: data.match_score || 0,
              verdict: data.verdict || "REJECT",
              ats_score: data.ats_score || 0,
              keyword_density: data.keyword_density || 0,
              matched_skills: data.matched_skills || [],
              missing_skills: data.missing_skills || [],
              salary_insight: data.salary_insight || null,
              red_flags: data.red_flags || [],
              interview_questions: data.interview_questions || [],
              outreach_email: data.outreach_email || "",
              culture_fit_score: data.culture_fit_score ?? null,
              company_cheat_sheet: data.company_cheat_sheet || null,
              culture_traits: data.culture_traits || [],
              total_tokens: usage?.totalTokenCount || 0,
              estimated_cost: estimated_cost,
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

        sse.send({
          type: "result",
          analysis: markdown,
          metadata:
            agentMode === "customize"
              ? {
                  total_tokens: usage?.totalTokenCount || 0,
                  estimated_cost: estimated_cost,
                  intel: finalIntel || null,
                  strategy: strategy || null,
                  audit: audit || null,
                }
              : {
                  match_score: data.match_score || 0,
                  verdict: data.verdict || "REJECT",
                  ats_score: data.ats_score || 0,
                  keyword_density: data.keyword_density || 0,
                  matched_skills: data.matched_skills || [],
                  missing_skills: data.missing_skills || [],
                  salary_insight: data.salary_insight || null,
                  red_flags: data.red_flags || [],
                  interview_questions: data.interview_questions || [],
                  outreach_email: data.outreach_email || "",
                  culture_fit_score: data.culture_fit_score ?? null,
                  company_cheat_sheet: data.company_cheat_sheet || null,
                  culture_traits: data.culture_traits || [],
                  total_tokens: usage?.totalTokenCount || 0,
                  estimated_cost: estimated_cost,
                  intel: finalIntel || null,
                },
          toolUsed,
        });

        sse.close();
      } catch (error: any) {
        await logSystemEvent({
          level: "ERROR",
          source: "API_CHAT",
          message: error.message || "Analysis failed",
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
