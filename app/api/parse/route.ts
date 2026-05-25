import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { logSystemEvent } from "@/lib/supabase/logger";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const parseMode = formData.get("parseMode") || "analysis";

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx");
    let text = "";
    
    if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const parsedResult = await extractText(arrayBuffer);
        text = Array.isArray(parsedResult.text)
            ? parsedResult.text.join("\n")
            : parsedResult.text;
    } else if (isDocx) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsedResult = await mammoth.extractRawText({ buffer });
        text = parsedResult.value;
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

    if (isPdf) {
        profileUpdate.resume_text = text;
    } else if (isDocx) {
        if (parseMode === "customize") {
            profileUpdate.latex_source = text;
        } else {
            profileUpdate.resume_text = text;
            profileUpdate.latex_source = text;
        }
    } else {
        profileUpdate.latex_source = text;
    }

    await supabase.from("profiles").upsert(profileUpdate);

    return NextResponse.json({
      text: text,
      isLatex: !isPdf && !isDocx
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
