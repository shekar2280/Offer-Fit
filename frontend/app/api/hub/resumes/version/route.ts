import { NextResponse } from "next/server";
import {
  authenticated,
  dbCheck,
  failure,
  field,
  HubError,
  limited,
  readJson,
  uuid,
} from "@/lib/hub/server";
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const body = await readJson(request, 250000);
    await limited(db, "write");
    const parentId = uuid(body.parent_id);
    const applicationId = uuid(body.application_id);
    const [parent, application] = await Promise.all([
      db
        .from("hub_resumes")
        .select("name")
        .eq("id", parentId)
        .eq("user_id", user.id)
        .maybeSingle(),
      db
        .from("hub_applications")
        .select("company,role")
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    dbCheck(parent.error);
    dbCheck(application.error);
    if (!parent.data || !application.data)
      throw new HubError("Source resume or application not found.", 404);
    const { data, error } = await db
      .from("hub_resumes")
      .insert({
        user_id: user.id,
        parent_id: parentId,
        name: `${application.data.company} · ${application.data.role} (reviewed draft)`.slice(
          0,
          160,
        ),
        content: field(body.content, "Resume", 60000, true),
      })
      .select("id")
      .single();
    dbCheck(error);
    if (!data) throw new HubError("Could not save the resume version.", 500);
    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
