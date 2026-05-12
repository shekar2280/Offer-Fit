import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";
import { runAgenticAnalysis, runMultiStepCustomization, runResearchAgent } from "@/lib/ai/agent";
import { logSystemEvent } from "@/lib/supabase/logger";

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
          sse.send({ type: "error", error: "Unauthorized" });
          sse.close();
          return;
        }

        let daily_count = 0;
        let hourly_count = 0;

        if (user) {
          const { data: usage } = await supabase
            .from("user_usage")
            .select("daily_count, hourly_count, last_request_at")
            .eq("user_id", user.id)
            .single();

          const now = new Date();
          const lastRequest = usage?.last_request_at
            ? new Date(usage.last_request_at)
            : new Date(0);
          const msSinceLast = now.getTime() - lastRequest.getTime();

          daily_count = msSinceLast > 86400000 ? 0 : usage?.daily_count || 0;
          hourly_count = msSinceLast > 3600000 ? 0 : usage?.hourly_count || 0;

          if (daily_count >= 200) {
            sse.send({
              type: "error",
              error: "Daily quota reached (100/day).",
            });
            sse.close();
            return;
          }
          if (hourly_count >= 20) {
            sse.send({
              type: "error",
              error: "Hourly limit exceeded (20/hr).",
            });
            sse.close();
            return;
          }

          await supabase.from("user_usage").upsert(
            {
              user_id: user.id,
              daily_count: daily_count + 1,
              hourly_count: hourly_count + 1,
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

        await logSystemEvent({
          level: "INFO",
          source: "AGENT_CONTEXT",
          message: "Context sent to AI",
          details: {
            mode,
            context_length: context.length,
            context_preview: context.substring(0, 500),
            jd_preview: jd.substring(0, 300),
          },
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
            userName,
          );
        } else {
          sse.send({
            type: "progress",
            step: 3,
            message: "Researching company intel...",
          });

          const intel = await runResearchAgent(supabase, companyName);

          sse.send({
            type: "progress",
            step: 4,
            message: "Matching skills & keywords...",
          });

          const analysisResult = await runAgenticAnalysis(
            companyName,
            position,
            context,
            jd,
            location,
            jobType,
            "analyze",
            bypassJudge,
            userName,
            intel,
          );

          result = { ...analysisResult, intel };
        }

        const { markdown, data, toolUsed, usage, estimated_cost, intel, strategy, audit } = result;

        sse.send({
          type: "progress",
          step: 5,
          message:
            mode === "customize"
              ? "Refining LaTeX output..."
              : "Computing match score...",
        });

        await logSystemEvent({
          level: "INFO",
          source: "AGENT_OUTPUT",
          message: "AI analysis completed",
          details: {
            matched_skills: data.matched_skills,
            missing_skills: data.missing_skills,
            match_score: data.match_score,
            ats_score: data.ats_score,
            verdict: data.verdict,
            tool_used: toolUsed,
            total_tokens: usage?.totalTokenCount,
            estimated_cost: estimated_cost,
          },
        });

        if (analysisId && user) {
          if (agentMode === "customize") {
            await supabase
              .from("analyses")
              .update({
                customized_latex: markdown,
                total_tokens: usage?.totalTokenCount || 0,
                estimated_cost: estimated_cost,
                intel_id: intel?.id || null,
                customization_strategy: strategy || null,
                audit_report: audit || null,
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
              intel_id: intel?.id || null,
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
                  intel: intel || null,
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
                  intel: intel || null,
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
