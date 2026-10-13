import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { dbCheck, failure, HubError } from "@/lib/hub/server";
import { parseResumeUpload } from "@/lib/hub/uploads";

export async function POST(req: NextRequest) {
  try {
    const expectedOrigin=new URL(process.env.OFFERFIT_APP_URL||req.url).origin;
    if(req.headers.get("origin")&&req.headers.get("origin")!==expectedOrigin)throw new HubError("Invalid request origin.",403);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new HubError("Unauthorized", 401);
    }
    const { text, ext } = await parseResumeUpload(req);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, resume_text: text, updated_at: new Date().toISOString() });
    dbCheck(error);

    return NextResponse.json({
      text,
      isLatex: ext === "tex" || text.includes("\\documentclass"),
    });
  } catch (error: unknown) {
    return failure(error);
  }
}
