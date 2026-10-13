import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { sealSecret, openSecret } from "./vault";

export class HubError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function appOrigin(request: Request): string {
  const configured = process.env.OFFERFIT_APP_URL;
  if (configured) {
    const url = new URL(configured);
    if (
      url.username ||
      url.password ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    )
      throw new HubError("Configure a valid HTTPS application origin.", 503);
    return url.origin;
  }
  if (process.env.NODE_ENV === "production")
    throw new HubError(
      "OFFERFIT_APP_URL must be configured before enabling integrations.",
      503,
    );
  return new URL(request.url).origin;
}
export function checkOrigin(request: Request) {
  if (request.headers.get("origin") !== appOrigin(request))
    throw new HubError("This action must be performed from OfferFit.", 403);
}
export async function authenticated(request?: Request) {
  if (request) checkOrigin(request);
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HubError("Sign in to continue.", 401);
  return { db, user };
}
export async function limited(
  db: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
) {
  const { data, error } = await db.rpc("hub_consume_limit", {
    p_bucket: bucket,
  });
  if (error)
    throw new HubError(
      "Job hub database setup is required. See the deployment guide.",
      503,
    );
  if (!data)
    throw new HubError(
      "You have reached this action's limit. Try again later.",
      429,
    );
}
export async function readJson(
  request: Request,
  maxBytes = 65536,
): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HubError("Send JSON content.", 415);
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new HubError("Request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new HubError("Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new HubError("Request is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new HubError("Invalid JSON request.");
  }
}
export function field(
  value: unknown,
  name: string,
  max: number,
  required = false,
): string {
  if (value === undefined || value === null) {
    if (required) throw new HubError(`${name} is required.`);
    return "";
  }
  if (typeof value !== "string" || value.length > max)
    throw new HubError(`${name} must be text of at most ${max} characters.`);
  const text = value.trim();
  if (required && !text) throw new HubError(`${name} is required.`);
  return text;
}
export function uuid(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new HubError("Invalid record ID.");
  return value;
}
export function dbCheck(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "23505")
    throw new HubError(
      "This job is already saved. Open the existing application.",
      409,
    );
  if (error.code === "42P01" || error.code === "PGRST205")
    throw new HubError(
      "Job hub database setup is required. See the deployment guide.",
      503,
    );
  throw new HubError("Could not save or load this record. Please retry.", 500);
}
export function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof HubError
          ? error.message
          : "This operation could not be completed. Please retry.",
    },
    {
      status: error instanceof HubError ? error.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
function encryptionKey() {
  const key = Buffer.from(process.env.OFFERFIT_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32)
    throw new HubError("The server encryption key is not configured.", 503);
  return key;
}
export function encrypt(value: string, userId: string, kind: string) {
  return sealSecret(value, encryptionKey(), userId, kind);
}
export function decrypt(value: string, userId: string, kind: string) {
  const key = encryptionKey();
  try {
    return openSecret(value, key, userId, kind);
  } catch {
    throw new HubError("Reconnect this integration.", 409);
  }
}
export async function getCredential(userId: string, kind: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("hub_credentials")
    .select("secret, metadata, updated_at")
    .eq("user_id", userId)
    .eq("kind", kind)
    .maybeSingle();
  dbCheck(error);
  return data
    ? {
        secret: decrypt(data.secret, userId, kind),
        metadata: data.metadata as Record<string, unknown>,
        updatedAt: data.updated_at as string,
      }
    : null;
}
export async function updateCredentialMetadata(
  userId: string,
  kind: string,
  metadata: Record<string, unknown>,
  expectedVersion: string,
) {
  const { data, error } = await createAdminClient()
    .from("hub_credentials")
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("updated_at", expectedVersion)
    .select("kind")
    .maybeSingle();
  dbCheck(error);
  if (!data)
    throw new HubError(
      "This integration changed while syncing. Refresh and retry.",
      409,
    );
}
export async function saveCredential(
  userId: string,
  kind: string,
  secret: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await createAdminClient()
    .from("hub_credentials")
    .upsert({
      user_id: userId,
      kind,
      secret: encrypt(secret, userId, kind),
      metadata,
      updated_at: new Date().toISOString(),
    });
  dbCheck(error);
}
