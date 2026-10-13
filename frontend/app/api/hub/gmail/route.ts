import { NextResponse } from "next/server";
import {
  authenticated,
  dbCheck,
  failure,
  getCredential,
  HubError,
  limited,
  readJson,
  updateCredentialMetadata,
} from "@/lib/hub/server";
import { createAdminClient } from "@/services/supabase/admin";
import { syncMailbox } from "@/lib/hub/gmail-sync";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const body = await readJson(request, 1024);
    await limited(db, "gmail");
    const credential = await getCredential(user.id, "gmail");
    if (!credential) throw new HubError("Connect Gmail first.", 409);
    if (body.action === "background") {
      if (typeof body.enabled !== "boolean")
        throw new HubError("Invalid sync preference.");
      if (
        body.enabled &&
        (process.env.OFFERFIT_BACKGROUND_SYNC_ENABLED !== "true" ||
          !process.env.CRON_SECRET)
      )
        throw new HubError(
          "Configure and verify the mailbox scheduler first.",
          503,
        );
      await updateCredentialMetadata(
        user.id,
        "gmail",
        { ...credential.metadata, background_sync: body.enabled },
        credential.updatedAt,
      );
      return NextResponse.json({ ok: true });
    }
    if (body.action === "disconnect") {
      const revoke = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: credential.secret }),
        signal: AbortSignal.timeout(10000),
      });
      if (!revoke.ok && revoke.status !== 400)
        throw new HubError(
          "Google could not revoke access. Retry or revoke it in your Google account.",
          502,
        );
      const { error } = await createAdminClient()
        .from("hub_credentials")
        .delete()
        .eq("user_id", user.id)
        .eq("kind", "gmail");
      dbCheck(error);
      const { error: jobError } = await createAdminClient()
        .from("hub_mailbox_jobs")
        .delete()
        .eq("user_id", user.id);
      dbCheck(jobError);
      return NextResponse.json({ ok: true });
    }
    if (body.action !== "sync") throw new HubError("Invalid Gmail action.");
    const result = await syncMailbox(db, user.id, credential);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
