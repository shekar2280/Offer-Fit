import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { embedAndStore } from "@/lib/supabase/rag";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const parsedResult = await extractText(arrayBuffer);

    const text = Array.isArray(parsedResult.text)
      ? parsedResult.text.join("\n")
      : parsedResult.text;
    const totalPages = parsedResult.totalPages;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: analysis, error: insertError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        resume_text: text,
        short_title: file.name.replace(".pdf", ""),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    await embedAndStore(supabase, analysis.id, text);

    return NextResponse.json({
      text: text,
      total: totalPages,
      analysisId: analysis.id,
    });
  } catch (error) {
    console.error("PDF Parsing/Indexing Error:", error);
    return NextResponse.json(
      { error: "Failed to parse or index PDF" },
      { status: 500 },
    );
  }
}
