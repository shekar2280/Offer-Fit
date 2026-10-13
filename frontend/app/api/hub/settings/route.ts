import { NextResponse } from "next/server";
import {
  authenticated,
  dbCheck,
  failure,
  field,
  HubError,
  limited,
  readJson,
  saveCredential,
} from "@/lib/hub/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const body = await readJson(request, 2048);
    await limited(db, "write");
    if (body.action === "remove_key") {
      const { error } = await createAdminClient()
        .from("hub_credentials")
        .delete()
        .eq("user_id", user.id)
        .eq("kind", "gemini");
      dbCheck(error);
    } else if (body.action === "save_key") {
      const key = field(body.key, "Gemini key", 200, true);
      if (!/^[A-Za-z0-9_-]{20,200}$/.test(key))
        throw new HubError("Invalid API key format.");
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
        {
          headers: { "x-goog-api-key": key },
          signal: AbortSignal.timeout(10000),
          cache: "no-store",
        },
      );
      if (!response.ok)
        throw new HubError(
          "Gemini could not validate this key. Check its restrictions and API access.",
          400,
        );
      await saveCredential(user.id, "gemini", key);
    } else throw new HubError("Unknown settings action.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
