import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jd } = body;

        if (!jd) {
            return NextResponse.json({ error: "Missing job description" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        const response = await fetch(`${backendUrl}/extract-pillars`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.BACKEND_API_KEY || "",
            },
            body: JSON.stringify({
                jd: body.jd
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Backend error: ${response.status} ${errText}`);
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to extract pillars" }, { status: 500 });
    }
}
