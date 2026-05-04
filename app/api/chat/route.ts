import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";
import { runAgenticAnalysis } from "@/lib/ai/agent";

export async function POST(req: Request) {
  try {
    const { messages, companyName, position, resumeText, analysisId, location, jobType } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const jd = messages[messages.length - 1].content;
    const context = resumeText || (await getRelevantContext(supabase, user.id, jd));

    const { markdown, data, toolUsed } = await runAgenticAnalysis(
      companyName,
      position,
      context,
      jd,
      location,
      jobType
    );

    if (analysisId) {
      await supabase
        .from("analyses")
        .update({
          analysis_result: markdown,
          ats_score: data.atsScore,
          keyword_density: data.keywordDensity,
          matched_skills: data.matchedSkills,
          missing_skills: data.missing_skills,
          salary_insight: data.salaryInsight,
          red_flags: data.redFlags,
          interview_questions: data.interviewQuestions,
          outreach_email: data.outreachEmail,
        })
        .eq("id", analysisId);
    }

    return new Response(JSON.stringify({ analysis: markdown, metadata: data, toolUsed }));
  } catch (error) {
    console.error("Agentic Analysis Error:", error);
    return new Response(JSON.stringify({ error: "Analysis failed" }), { status: 500 });
  }
}
