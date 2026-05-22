import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { logSystemEvent } from "@/lib/supabase/logger";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const isPdf = file.type === "application/pdf";
    let text = "";
    
    if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const parsedResult = await extractText(arrayBuffer);
        text = Array.isArray(parsedResult.text)
            ? parsedResult.text.join("\n")
            : parsedResult.text;
    } else {
        text = await file.text();
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileUpdate: Record<string, unknown> = { 
        id: user.id,
        updated_at: new Date().toISOString() 
    };
    if (isPdf) profileUpdate.resume_text = text;
    else profileUpdate.latex_source = text;

    await supabase.from("profiles").upsert(profileUpdate);

    return NextResponse.json({
      text: text,
      isLatex: !isPdf
    });
  } catch (error: unknown) {
    await logSystemEvent({
      level: "ERROR",
      source: "API_PARSE",
      message: "File parsing failed",
      details: { error: (error as Error).message, fileName: file.name, fileType: file.type }
    });
    return NextResponse.json(
      { error: "Failed to parse file" },
      { status: 500 },
    );
  }
}
