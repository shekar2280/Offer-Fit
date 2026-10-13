import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  authenticated,
  dbCheck,
  failure,
  HubError,
  limited,
  uuid,
} from "@/lib/hub/server";
import { parseResumeUpload } from "@/lib/hub/uploads";

export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    await limited(db, "upload");
    const { name, ext, buffer, text } = await parseResumeUpload(request);
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const mime =
      ext === "pdf"
        ? "application/pdf"
        : ext === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "text/plain";
    const { error: storageError } = await db.storage
      .from("hub-resumes")
      .upload(path, buffer, { contentType: mime, upsert: false });
    dbCheck(storageError);
    const { error } = await db
      .from("hub_resumes")
      .insert({ user_id: user.id, name, content: text, file_path: path });
    if (error) {
      await db.storage.from("hub-resumes").remove([path]);
      dbCheck(error);
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
export async function GET(request: Request) {
  try {
    const { db, user } = await authenticated();
    const id = uuid(new URL(request.url).searchParams.get("id"));
    const { data, error } = await db
      .from("hub_resumes")
      .select("file_path")
      .eq("user_id", user.id)
      .eq("id", id)
      .maybeSingle();
    dbCheck(error);
    if (!data?.file_path || !data.file_path.startsWith(`${user.id}/`))
      throw new HubError("Original file not found.", 404);
    const { data: signed, error: signError } = await db.storage
      .from("hub-resumes")
      .createSignedUrl(data.file_path, 60, { download: true });
    dbCheck(signError);
    return NextResponse.json(
      { url: signed?.signedUrl },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
