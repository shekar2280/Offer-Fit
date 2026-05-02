import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { messages, companyName, position, resumeText, goal, analysisId } = await req.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileContext = "";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (profile) {
      profileContext = `CANDIDATE BASELINE: ${profile.hire_pitch || "Standard profile"}.`;
    }
  }

  const jd = messages[messages.length - 1].content;
  const context = resumeText || (user ? await getRelevantContext(supabase, user.id, jd) : "");
  
  const isLatex = context?.includes("\\documentclass") || context?.includes("\\section{");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  if (goal === 'optimize' && isLatex) {
    const optimizePrompt = `
      ROLE: Elite LaTeX Surgeon.
      TASK: Optimize the provided LaTeX resume source for the JD below.
      
      JD:
      ${jd}
      
      LATEX SOURCE:
      ${context}

      INSTRUCTIONS:
      1. Keep EXACT same LaTeX structure and styling.
      2. Rewrite 3-5 critical bullet points to align with JD.
      3. Return ONLY raw LaTeX code. No markdown.
    `;
    const result = await model.generateContent(optimizePrompt);
    return new Response(result.response.text());
  }

  const masterPrompt = `
    ROLE: Elite Technical Hiring Manager & Career Strategist.
    CONTEXT: ${companyName} | ${position}
    CANDIDATE RESUME: ${context}
    TARGET JD: ${jd}
    ${profileContext}

    TASK: Perform a deep-dive analysis. 
    
    OUTPUT FORMAT:
    1. Start with a detailed, brutal markdown analysis (at least 400 words). Focus on tactical gaps and strategic fit.
    2. End with the delimiter: "---METADATA---"
    3. Finally, return a single valid JSON object with the following structure:
    {
      "verdict": "APPLY | STRETCH | PASS",
      "matchScore": number (0-100),
      "atsScore": number (0-100),
      "keywordDensity": number (0-100),
      "matchedSkills": ["Skill 1", "Skill 2"...],
      "missingSkills": ["Gap 1", "Gap 2"...],
      "strengths": ["Strength 1", "Strength 2"...],
      "weaknesses": ["Weakness 1", "Weakness 2"...],
      "bulletSuggestions": ["Original Bullet -> Rewritten Bullet"...],
      "salaryInsight": { "range": "...", "currency": "...", "seniority": "..." },
      "redFlags": ["..."],
      "interviewQuestions": [{"q": "...", "intent": "..."}],
      "outreachEmail": "..."
    }
  `;

  const startTime = Date.now();

  try {
    const result = await model.generateContentStream(masterPrompt);
    
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullText = "";
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          controller.enqueue(encoder.encode(chunkText));
        }

        const duration = Date.now() - startTime;
        
        try {
          const parts = fullText.split("---METADATA---");
          const markdown = parts[0].trim();
          const jsonStr = parts[1]?.trim() || "{}";
          const data = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || "{}");

          if (analysisId) {
            await supabase.from("analyses").update({
              analysis_result: markdown,
              ats_score: data.atsScore,
              keyword_density: data.keywordDensity,
              matched_skills: data.matchedSkills,
              missing_skills: data.missingSkills,
              salary_insight: data.salaryInsight,
              red_flags: data.redFlags,
              interview_questions: data.interviewQuestions,
              outreach_email: data.outreachEmail,
              response_time_ms: duration,
              strengths: data.strengths,
              weaknesses: data.weaknesses,
              bullet_suggestions: data.bulletSuggestions
            }).eq("id", analysisId);
          }
        } catch (e) {
          console.error("Error parsing/saving final metadata:", e);
        }
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Unified Analysis Error:", error);
    return new Response(JSON.stringify({ error: "Analysis failed" }), { status: 500 });
  }
}
