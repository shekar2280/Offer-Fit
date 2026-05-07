import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";
import { runAgenticAnalysis } from "@/lib/ai/agent";
import { logSystemEvent } from "@/lib/supabase/logger";

export async function POST(req: Request) {
  try {
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
    const serverSecret = (
      process.env.NEXT_PUBLIC_BENCHMARK_SECRET || ""
    ).trim();
    const isTestMode = testSecret !== "" && testSecret === serverSecret;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isTestMode) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
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

      if (daily_count >= 50) {
        return new Response(
          JSON.stringify({ error: "Daily quota reached (50/day)." }),
          { status: 429 },
        );
      }
      if (hourly_count >= 20) {
        return new Response(
          JSON.stringify({ error: "Hourly limit exceeded (20/hr)." }),
          { status: 429 },
        );
      }

      await supabase.from("user_usage").upsert(
        {
          user_id: user.id,
          daily_count: daily_count + 1,
          hourly_count: hourly_count + 1,
          last_request_at: now.toISOString(),
        },
        { onConflict: "user_id" },
      );
    }

    const jd = messages[messages.length - 1].content;
    const context =
      resumeText ||
      (await getRelevantContext(supabase, user?.id || "benchmark_test_id", jd));

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

    const agentMode: "analyze" | "customize" =
      mode === "customize" ? "customize" : "analyze";

    const userName =
      user?.user_metadata?.full_name || user?.user_metadata?.name;

    const { markdown, data, toolUsed, usage } = await runAgenticAnalysis(
      companyName,
      position,
      context,
      jd,
      location,
      jobType,
      agentMode,
      bypassJudge,
      userName,
    );

    const inputCost = (usage?.promptTokenCount || 0) * (0.075 / 1000000);
    const outputCost = (usage?.candidatesTokenCount || 0) * (0.3 / 1000000);
    const totalCost = inputCost + outputCost;

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
        estimated_cost: totalCost,
      },
    });

    if (analysisId && user) {
      if (agentMode === "customize") {
        await supabase
          .from("analyses")
          .update({
            customized_latex: markdown,
            total_tokens: usage?.totalTokenCount || 0,
            estimated_cost: totalCost,
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
          estimated_cost: totalCost,
          analysis_result: markdown,
        };

        await supabase
          .from("analyses")
          .update(updatePayload)
          .eq("id", analysisId);
      }
    }

    return new Response(
      JSON.stringify({
        analysis: markdown,
        metadata:
          agentMode === "customize"
            ? null
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
                estimated_cost: totalCost,
              },
        toolUsed,
      }),
    );
  } catch (error: any) {
    await logSystemEvent({
      level: "ERROR",
      source: "API_CHAT",
      message: error.message || "Analysis failed",
      details: { error },
    });
    return new Response(JSON.stringify({ error: "Analysis failed" }), {
      status: 500,
    });
  }
}
