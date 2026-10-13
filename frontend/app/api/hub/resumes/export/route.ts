import {
  authenticated,
  dbCheck,
  failure,
  HubError,
  uuid,
} from "@/lib/hub/server";
import { Document, Packer, Paragraph, TextRun } from "docx";

export async function GET(request: Request) {
  try {
    const { db, user } = await authenticated();
    const { data, error } = await db
      .from("hub_resumes")
      .select("name,content")
      .eq("user_id", user.id)
      .eq("id", uuid(new URL(request.url).searchParams.get("id")))
      .maybeSingle();
    dbCheck(error);
    if (!data) throw new HubError("Resume not found.", 404);
    const lines: string[] = data.content.split(/\r?\n/);
    const document = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 22 },
            paragraph: { spacing: { after: 100 } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
          },
          children: lines.map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    bold: /^[A-Z][A-Z\s&/]{2,50}$/.test(line.trim()),
                  }),
                ],
              }),
          ),
        },
      ],
    });
    const buffer = await Packer.toBuffer(document);
    const filename =
      data.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100) || "resume";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
