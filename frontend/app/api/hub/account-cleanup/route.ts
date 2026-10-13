import { NextResponse } from "next/server";
import {
  authenticated,
  dbCheck,
  failure,
  getCredential,
  HubError,
  readJson,
} from "@/lib/hub/server";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const expectedOrigin = new URL(process.env.OFFERFIT_APP_URL || request.url)
      .origin;
    if (request.headers.get("origin") !== expectedOrigin)
      throw new HubError("Invalid request origin.", 403);
    const { db, user } = await authenticated();
    const body = await readJson(request, 1024);
    if (body.confirmation !== "DELETE MY ACCOUNT")
      throw new HubError("Account deletion must be confirmed.");
    const { error: tableError } = await db
      .from("hub_resumes")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (tableError?.code === "42P01" || tableError?.code === "PGRST205")
      return NextResponse.json({ ok: true });
    dbCheck(tableError);
    const credential = await getCredential(user.id, "gmail");
    if (credential) {
      const revoke = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: credential.secret }),
        signal: AbortSignal.timeout(10000),
      });
      if (!revoke.ok && revoke.status !== 400)
        throw new HubError(
          "Google could not revoke Gmail access. Disconnect it in Settings and retry.",
          502,
        );
    }
    // Revoke local credentials first so in-flight workers cannot commit new email data.
    const { error: purgeError } = await db.rpc("hub_purge_own_data");
    dbCheck(purgeError);
    for (let batch = 0; batch < 100; batch++) {
      const { data: files, error } = await db.storage
        .from("hub-resumes")
        .list(user.id, { limit: 100, offset: 0 });
      dbCheck(error);
      if (!files?.length) return NextResponse.json({ ok: true });
      const paths = files.map((file) => `${user.id}/${file.name}`);
      const { error: removeError } = await db.storage
        .from("hub-resumes")
        .remove(paths);
      dbCheck(removeError);
    }
    throw new HubError(
      "Some files still need cleanup. Retry account deletion to continue.",
      409,
    );
  } catch (error) {
    return failure(error);
  }
}
