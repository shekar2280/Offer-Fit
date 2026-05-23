import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logSystemEvent } from "@/lib/supabase/logger";
import { withRetry } from "@/lib/ai/utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
        return NextResponse.json({ error: "Missing context" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

    const prompt = `
You are an ATS (Applicant Tracking System) engine and keyword analyst.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

TASK: Analyze the resume against the JD. Return ONLY valid JSON — no markdown, no code fences, no commentary.

Extract:
1. atsScore: integer 0-100. How many of the JD's critical keywords/skills appear verbatim or with strong semantic equivalence in the resume.
2. matchedSkills: array of up to 12 specific skills/technologies/tools that appear in BOTH the JD and resume. Short labels only (e.g. "React", "TypeScript", "REST APIs").
3. missingSkills: array of up to 12 critical skills/technologies/tools mentioned in the JD that are ABSENT from the resume. Short labels only.
4. keywordDensity: integer 0-100. How well the resume's language mirrors the JD's terminology and phrasing.

Return exactly this shape:
{
  "atsScore": 72,
  "keywordDensity": 65,
  "matchedSkills": ["React", "TypeScript", "Node.js"],
  "missingSkills": ["GraphQL", "AWS Lambda", "Kubernetes"]
}
`;

    try {
        const result = await withRetry(() => model.generateContent(prompt));
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
    } catch (err: unknown) {
        await logSystemEvent({
            level: "ERROR",
            source: "API_INSIGHTS",
            message: "ATS insights generation failed",
            details: { error: (err as Error).message }
        });
        return NextResponse.json({ atsScore: 0, keywordDensity: 0, matchedSkills: [], missingSkills: [] });
    }
}
