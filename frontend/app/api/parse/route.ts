import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import mammoth from "mammoth";
import { createClient } from "@/services/supabase/server";
import { logSystemEvent } from "@/services/supabase/logger";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx");
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

    await supabase
      .from("profiles")
      .upsert({ id: user.id, resume_text: text, updated_at: new Date().toISOString() });

    return NextResponse.json({
      text,
      isLatex: !isPdf && !isDocx,
    });
  } catch (error: unknown) {
    await logSystemEvent({
      level: "ERROR",
      source: "API_PARSE",
      message: "File parsing failed",
      details: { error: (error as Error).message, fileName: file.name, fileType: file.type },
    });
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 });
  }
}
