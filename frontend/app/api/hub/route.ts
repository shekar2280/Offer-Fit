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
import {
  normalizeJobUrl,
  localDate,
  statuses,
  type ApplicationStatus,
} from "@/lib/hub/domain";
import { createAdminClient } from "@/services/supabase/admin";

export async function GET() {
  try {
    const { db, user } = await authenticated();
    const results = await Promise.all([
      db
        .from("hub_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(500),
      db
        .from("hub_resumes")
        .select("id,name,content,file_path,parent_id,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("hub_drafts")
        .select("id,application_id,subject,body,sent_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      db
        .from("hub_checkins")
        .select("local_date")
        .eq("user_id", user.id)
        .order("local_date", { ascending: false })
        .limit(400),
      db
        .from("hub_email_updates")
        .select("*")
        .eq("user_id", user.id)
        .eq("resolution", "pending")
        .order("received_at", { ascending: false })
        .limit(100),
      db
        .from("hub_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    for (const result of results) dbCheck(result.error);
    const { data: credentials, error } = await createAdminClient()
      .from("hub_credentials")
      .select("kind,metadata")
      .eq("user_id", user.id);
    dbCheck(error);
    const { data: mailboxJob, error: mailboxError } = await createAdminClient()
      .from("hub_mailbox_jobs")
      .select("last_error_code,next_run_at")
      .eq("user_id", user.id)
      .maybeSingle();
    dbCheck(mailboxError);
    const gmailMetadata = credentials?.find(
      (c) => c.kind === "gmail",
    )?.metadata;
    return NextResponse.json(
      {
        applications: results[0].data,
        resumes: results[1].data,
        drafts: results[2].data,
        checkins: results[3].data,
        emails: results[4].data,
        events: results[5].data,
        integrations: {
          gemini: credentials?.some((c) => c.kind === "gemini") || false,
          gmail: gmailMetadata
            ? {
                ...gmailMetadata,
                background_error: mailboxJob?.last_error_code || null,
                next_run_at: mailboxJob?.next_run_at || null,
              }
            : null,
          gmailConfigured: Boolean(
            process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.OFFERFIT_APP_URL &&
            process.env.OFFERFIT_ENCRYPTION_KEY,
          ),
          backgroundConfigured:
            process.env.OFFERFIT_BACKGROUND_SYNC_ENABLED === "true" &&
            Boolean(process.env.CRON_SECRET),
        },
        timezone: "Asia/Kolkata",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const body = await readJson(request, 100000);
    await limited(db, "write");
    if (body.action === "checkin") {
      const { data, error } = await db.rpc("hub_checkin");
      dbCheck(error);
      return NextResponse.json({ date: data });
    }
    if (body.action === "save_application") {
      const company = field(body.company, "Company", 160, true);
      const role = field(body.role, "Role", 200, true);
      const job_url = field(body.job_url, "Job URL", 2048);
      let normalized_url: string;
      try {
        normalized_url = normalizeJobUrl(job_url);
      } catch {
        throw new HubError(
          "Enter a valid HTTP or HTTPS job URL without credentials.",
        );
      }
      const status = field(
        body.status,
        "Status",
        30,
        true,
      ) as ApplicationStatus;
      if (!statuses.includes(status)) throw new HubError("Invalid status.");
      const resume_id = body.resume_id ? uuid(body.resume_id) : null;
      if (resume_id) {
        const { data, error } = await db
          .from("hub_resumes")
          .select("id")
          .eq("user_id", user.id)
          .eq("id", resume_id)
          .maybeSingle();
        dbCheck(error);
        if (!data) throw new HubError("Resume not found.", 404);
      }
      const date = (value: unknown) => {
        if (!value) return null;
        if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
          throw new HubError("Invalid date.");
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const timestamp = new Date(`${value}T00:00:00+05:30`);
          if (
            !Number.isFinite(timestamp.getTime()) ||
            localDate(timestamp) !== value
          )
            throw new HubError("Invalid date.");
          return timestamp.toISOString();
        }
        return new Date(value).toISOString();
      };
      let applied_at = date(body.applied_at);
      if (applied_at && Date.parse(applied_at) > Date.now() + 60000)
        throw new HubError("Applied date cannot be in the future.");
      if (status === "applied" && !applied_at)
        applied_at = new Date().toISOString();
      const values = {
        company,
        role,
        job_url,
        normalized_url,
        status,
        resume_id,
        applied_at,
        jd: field(body.jd, "Job description", 30000),
        location: field(body.location, "Location", 200),
        notes: field(body.notes, "Notes", 10000),
        next_action_at: date(body.next_action_at),
        last_contact_at: date(body.last_contact_at),
      };
      if (body.id) {
        if (!Number.isInteger(body.revision) || Number(body.revision) < 0)
          throw new HubError("Reload this record before editing.");
        const { data, error } = await db
          .from("hub_applications")
          .update(values)
          .eq("id", uuid(body.id))
          .eq("user_id", user.id)
          .eq("revision", body.revision)
          .select()
          .maybeSingle();
        dbCheck(error);
        if (!data)
          throw new HubError(
            "This record changed in another tab. Refresh before saving.",
            409,
          );
        return NextResponse.json({ application: data });
      }
      const { data, error } = await db
        .from("hub_applications")
        .insert({ ...values, user_id: user.id })
        .select()
        .single();
      dbCheck(error);
      return NextResponse.json({ application: data }, { status: 201 });
    }
    if (body.action === "save_resume") {
      const { data, error } = await db
        .from("hub_resumes")
        .insert({
          user_id: user.id,
          name: field(body.name, "Resume name", 160, true),
          content: field(body.content, "Resume content", 60000, true),
        })
        .select("id")
        .single();
      dbCheck(error);
      return NextResponse.json({ resume: data }, { status: 201 });
    }
    if (body.action === "save_draft") {
      const { error } = await db.from("hub_drafts").insert({
        user_id: user.id,
        application_id: uuid(body.application_id),
        subject: field(body.subject, "Subject", 300, true),
        body: field(body.body, "Email", 12000, true),
      });
      dbCheck(error);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "mark_sent") {
      const { data, error } = await db.rpc("hub_mark_sent", {
        p_id: uuid(body.id),
      });
      dbCheck(error);
      if (!data) throw new HubError("Draft not found.", 404);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "resolve_email") {
      if (body.resolution !== "applied" && body.resolution !== "dismissed")
        throw new HubError("Invalid email resolution.");
      const { data, error } = await db.rpc("hub_resolve_email", {
        p_id: uuid(body.id),
        p_resolution: body.resolution,
      });
      dbCheck(error);
      if (!data)
        throw new HubError(
          "This update was already reviewed or its application changed. Refresh and update manually.",
          409,
        );
      return NextResponse.json({ ok: true });
    }
    throw new HubError("Unknown action.");
  } catch (error) {
    return failure(error);
  }
}
