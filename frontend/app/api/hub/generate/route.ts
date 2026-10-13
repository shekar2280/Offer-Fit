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
import { generate } from "@/lib/hub/gemini";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const body = await readJson(request);
    const applicationId = uuid(body.application_id);
    const resumeId = uuid(body.resume_id);
    const [app, resume, profile] = await Promise.all([
      db
        .from("hub_applications")
        .select("company,role,jd,location")
        .eq("user_id", user.id)
        .eq("id", applicationId)
        .maybeSingle(),
      db
        .from("hub_resumes")
        .select("name,content")
        .eq("user_id", user.id)
        .eq("id", resumeId)
        .maybeSingle(),
      db
        .from("profiles")
        .select("full_name,portfolio_url,linkedin")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    dbCheck(app.error);
    dbCheck(resume.error);
    dbCheck(profile.error);
    if (!app.data || !resume.data)
      throw new HubError("Select a saved application and resume.", 404);
    if (
      body.kind !== "email" &&
      body.kind !== "followup" &&
      body.kind !== "tailor"
    )
      throw new HubError("Invalid generation mode.");
    const projectIds = body.project_ids || [];
    if (!Array.isArray(projectIds) || projectIds.length > 5)
      throw new HubError("Select at most five projects.");
    let projectEvidence: unknown[] = [];
    if (projectIds.length) {
      const { data: projects, error } = await db
        .from("project_intelligence")
        .select("id,project_name,context,features_built,tech_stack,evidence")
        .eq("user_id", user.id)
        .in("id", projectIds.map(uuid));
      dbCheck(error);
      if (projects?.length !== new Set(projectIds).size)
        throw new HubError("Selected project not found.", 404);
      if (JSON.stringify(projects).length > 40000)
        throw new HubError(
          "Project evidence is too large. Select fewer projects.",
        );
      projectEvidence = projects;
    }
    await limited(db, "ai");
    // Only user-provided source facts are transmitted; mailbox data is excluded.
    const context = {
      job: app.data,
      resume: resume.data.content,
      approvedProjectEvidence: projectEvidence,
      profile: profile.data,
      tone: field(body.tone, "Tone", 100) || "Warm, concise, specific",
      experience: "0 years; do not claim professional tenure",
    };
    const instruction =
      body.kind === "tailor"
        ? 'Suggest a truthful role-tailored resume as plain text. Return {"content": string, "changes": string[], "warnings": string[]}. Preserve employers, dates, degrees, facts, and measurable claims. Reorder and rephrase existing evidence only. This is a draft requiring review, not a verified final resume.'
        : `Write a ${body.kind === "followup" ? "polite follow-up about an application" : "short cold email about this role"} grounded in the resume. Return {"subject": string, "body": string}. Keep body under 180 words. Use a neutral greeting when recipient is unknown. Include relevant portfolio links only when supplied. Do not fabricate company research or imply the user applied unless the user confirms it.`;
    const result = await generate(user.id, instruction, context);
    if (body.kind === "tailor") {
      return NextResponse.json(
        {
          content: field(result.content, "Generated resume", 60000, true),
          changes: Array.isArray(result.changes)
            ? result.changes.filter((x) => typeof x === "string").slice(0, 30)
            : [],
          warnings: Array.isArray(result.warnings)
            ? result.warnings.filter((x) => typeof x === "string").slice(0, 30)
            : [],
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      {
        subject: field(result.subject, "Generated subject", 300, true),
        body: field(result.body, "Generated email", 12000, true),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
