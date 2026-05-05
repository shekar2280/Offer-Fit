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

    const { data: usage, error: usageError } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const now = new Date();
    let dailyCount = usage?.daily_count || 0;
    let hourlyCount = usage?.hourly_count || 0;
    const lastRequest = usage?.last_request_at ? new Date(usage.last_request_at) : new Date(0);

    if (now.getTime() - lastRequest.getTime() > 24 * 60 * 60 * 1000) {
      dailyCount = 0;
      hourlyCount = 0;
    } else if (now.getTime() - lastRequest.getTime() > 60 * 60 * 1000) {
      hourlyCount = 0;
    }

    if (dailyCount >= 20) {
      return new Response(JSON.stringify({ error: "Daily quota reached (20/day)." }), { status: 429 });
    }
    if (hourlyCount >= 5) {
      return new Response(JSON.stringify({ error: "Hourly limit exceeded (5/hr)." }), { status: 429 });
    }

    await supabase.from("user_usage").upsert({
      user_id: user.id,
      daily_count: dailyCount + 1,
      hourly_count: hourlyCount + 1,
      last_request_at: now.toISOString()
    });

    const jd = messages[messages.length - 1].content;
    const context = resumeText || (await getRelevantContext(supabase, user.id, jd));

    const { markdown, data, toolUsed } = await runAgenticAnalysis(
      companyName,
      position,
      context,
      jd,
      location,
      jobType,
      mode
    );

    if (analysisId) {
      await supabase
        .from("analyses")
        .update({
          analysis_result: markdown,
          match_score: data.match_score,
          verdict: data.verdict,
          ats_score: data.ats_score,
          keyword_density: data.keyword_density,
          matched_skills: data.matched_skills,
          missing_skills: data.missing_skills,
          salary_insight: data.salary_insight,
          red_flags: data.red_flags,
          interview_questions: data.interview_questions,
          outreach_email: data.outreach_email,
          customized_latex: data.tailored_latex,
        })
        .eq("id", analysisId);
    }

    return new Response(JSON.stringify({ analysis: markdown, metadata: data, toolUsed }));
  } catch (error) {
    console.error("Agentic Analysis Error:", error);
    return new Response(JSON.stringify({ error: "Analysis failed" }), { status: 500 });
  }
}
