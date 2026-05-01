import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getRelevantContext } from "@/lib/supabase/rag";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { messages, companyName, position, resumeText, goal } = await req.json();
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

    TASK: Perform a deep-dive analysis. Return ONLY a single valid JSON object. No markdown fences.

    JSON STRUCTURE:
    {
      "verdict": "APPLY | STRETCH | PASS",
      "matchScore": number (0-100),
      "atsScore": number (0-100),
      "keywordDensity": number (0-100),
      "matchedSkills": ["Skill 1", "Skill 2"...],
      "missingSkills": ["Gap 1", "Gap 2"...],
      "salaryInsight": {
        "range": "e.g. $120k - $160k",
        "currency": "USD/INR",
        "seniority": "Junior/Mid/Senior/Staff"
      },
      "redFlags": ["Potential issue 1", "Issue 2"...],
      "interviewQuestions": [
        {"q": "Technical Question 1", "intent": "Why they ask this"},
        {"q": "Behavioral Question 2", "intent": "Context"}
      ],
      "outreachEmail": "A professional 3-paragraph cold email draft",
      "analysisResult": "Full, brutal markdown analysis text (at least 400 words) focusing on tactical gaps and strategic fit."
    }
  `;

  try {
    const result = await model.generateContent(masterPrompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found");
    return new Response(jsonMatch[0]);
  } catch (error) {
    console.error("Unified Analysis Error:", error);
    return new Response(JSON.stringify({ error: "Analysis failed" }), { status: 500 });
  }
}
