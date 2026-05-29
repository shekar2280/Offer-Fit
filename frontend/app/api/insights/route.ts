import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { logSystemEvent } from "@/services/supabase/logger";

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

    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

    try {
        const response = await fetch(`${backendUrl}/insights`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeText, jobDescription }),
        });

        if (!response.ok) {
            throw new Error(`Backend Error: ${response.status}`);
        }
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: unknown) {
        await logSystemEvent({
            level: "ERROR",
            source: "API_INSIGHTS",
            message: "ATS insights generation failed via Python backend",
            details: { error: (err as Error).message }
        });
        return NextResponse.json({ atsScore: 0, keywordDensity: 0, matchedSkills: [], missingSkills: [] });
    }
}
