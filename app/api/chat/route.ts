import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";
import { runAgenticAnalysis } from "@/lib/ai/agent";

export async function POST(req: Request) {
  try {
    const { messages, companyName, position, resumeText, analysisId, location, jobType, mode } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: usage } = await supabase
      .from("user_usage")
      .select("daily_count, hourly_count, last_request_at")
      .eq("user_id", user.id)
      .single();

    const now = new Date();
    const lastRequest = usage?.last_request_at ? new Date(usage.last_request_at) : new Date(0);
    const msSinceLast = now.getTime() - lastRequest.getTime();

    const daily_count = msSinceLast > 86400000 ? 0 : (usage?.daily_count || 0);
    const hourly_count = msSinceLast > 3600000 ? 0 : (usage?.hourly_count || 0);

    if (daily_count >= 20) {
      return new Response(JSON.stringify({ error: "Daily quota reached (20/day)." }), { status: 429 });
    }
    if (hourly_count >= 5) {
      return new Response(JSON.stringify({ error: "Hourly limit exceeded (5/hr)." }), { status: 429 });
    }

    await supabase.from("user_usage").upsert({
      user_id: user.id,
      daily_count: daily_count + 1,
      hourly_count: hourly_count + 1,
      last_request_at: now.toISOString()
    }, { onConflict: "user_id" });

    const jd = messages[messages.length - 1].content;
    const context = resumeText || (await getRelevantContext(supabase, user.id, jd));

    const agentMode: "analyze" | "customize" = mode === "customize" ? "customize" : "analyze";

    const { markdown, data, toolUsed } = await runAgenticAnalysis(
      companyName,
      position,
      context,
      jd,
      location,
      jobType,
      agentMode
    );

    if (analysisId) {
      const updatePayload: Record<string, any> = {
        match_score: data.match_score || 0,
        verdict: data.verdict || "PASS",
        ats_score: data.ats_score || 0,
        keyword_density: data.keyword_density || 0,
        matched_skills: data.matched_skills || [],
        missing_skills: data.missing_skills || [],
        salary_insight: data.salary_insight || null,
        red_flags: data.red_flags || [],
        interview_questions: data.interview_questions || [],
        outreach_email: data.outreach_email || "",
      };

      if (agentMode === "customize") {
        updatePayload.customized_latex = data.tailored_latex || markdown;
      } else {
        updatePayload.analysis_result = markdown;
      }

      const { error: updateError } = await supabase
        .from("analyses")
        .update(updatePayload)
        .eq("id", analysisId);

      if (updateError) {
        console.error("Database update failed:", updateError);
      }
    }

    return new Response(JSON.stringify({
      analysis: markdown,
      metadata: {
        match_score: data.match_score || 0,
        verdict: data.verdict || "PASS",
        ats_score: data.ats_score || 0,
        keyword_density: data.keyword_density || 0,
        matched_skills: data.matched_skills || [],
        missing_skills: data.missing_skills || [],
        salary_insight: data.salary_insight || null,
        red_flags: data.red_flags || [],
        interview_questions: data.interview_questions || [],
        outreach_email: data.outreach_email || "",
      },
      toolUsed
    }));
  } catch (error) {
    console.error("Agentic Analysis Error:", error);
    return new Response(JSON.stringify({ error: "Analysis failed" }), { status: 500 });
  }
}
