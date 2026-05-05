import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embedAndStore } from "@/lib/supabase/rag";
import { logSystemEvent } from "@/lib/supabase/logger";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing required text" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await embedAndStore(supabase, user.id, text);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await logSystemEvent({
      level: "ERROR",
      source: "API_INDEX",
      message: "RAG indexing failed",
      details: { error: error.message }
    });
    return NextResponse.json({ error: "Failed to index context" }, { status: 500 });
  }
}
