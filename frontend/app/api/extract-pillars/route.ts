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

        const { data: result, error } = await supabase.functions.invoke("backend-proxy", {
            body: {
                path: "/extract-pillars",
                method: "POST",
                payload: {
                    jd: body.jd
                }
            }
        });

        if (error) {
            return NextResponse.json({ error: error.message || "Failed to extract pillars" }, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to extract pillars" }, { status: 500 });
    }
}
