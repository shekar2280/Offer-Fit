import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  appOrigin,
  authenticated,
  HubError,
  saveCredential,
} from "@/lib/hub/server";
import { createAdminClient } from "@/services/supabase/admin";
import { dbCheck } from "@/lib/hub/server";

export async function GET(request: NextRequest) {
  let destination: URL;
  try {
    destination = new URL("/hub?view=settings", appOrigin(request));
  } catch {
    return NextResponse.json(
      { error: "Configure the application origin." },
      { status: 503 },
    );
  }
  try {
    const { user } = await authenticated();
    const params = request.nextUrl.searchParams;
    const expected = Buffer.from(
      request.cookies.get("offerfit_gmail_state")?.value || "",
    );
    const actual = Buffer.from(`${user.id}:${params.get("state") || ""}`);
    if (
      !expected.length ||
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    )
      throw new HubError("Invalid OAuth state.");
    if (params.get("error") || !params.get("code"))
      throw new HubError("Gmail permission was not granted.");
    const verifier = request.cookies.get("offerfit_gmail_verifier")?.value;
    if (!verifier || !/^[A-Za-z0-9_-]{43}$/.test(verifier))
      throw new HubError("Invalid OAuth verifier.");
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
      throw new HubError("Gmail configuration missing.");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: params.get("code")!,
        code_verifier: verifier,
        grant_type: "authorization_code",
        redirect_uri: `${destination.origin}/api/hub/gmail/callback`,
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw new HubError("Google token exchange failed.");
    const tokens = await response.json();
    if (
      !tokens.refresh_token ||
      !tokens.access_token ||
      !String(tokens.scope)
        .split(" ")
        .includes("https://www.googleapis.com/auth/gmail.readonly")
    )
      throw new HubError("Grant read-only mailbox access to connect.");
    const profileResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      },
    );
    if (!profileResponse.ok)
      throw new HubError("Cannot read the connected Gmail profile.");
    const profile = await profileResponse.json();
    if (
      typeof profile.emailAddress !== "string" ||
      profile.emailAddress.length > 254 ||
      !profile.emailAddress.includes("@")
    )
      throw new HubError("Invalid mailbox profile.");
    await saveCredential(user.id, "gmail", tokens.refresh_token, {
      email: profile.emailAddress,
      connected_at: new Date().toISOString(),
      last_sync_at: null,
      background_sync: false,
    });
    const { error: jobError } = await createAdminClient()
      .from("hub_mailbox_jobs")
      .upsert({
        user_id: user.id,
        next_run_at: new Date().toISOString(),
        lease_until: null,
        lease_token: null,
        last_error_code: null,
      });
    dbCheck(jobError);
    destination.searchParams.set("gmail", "connected");
  } catch {
    destination.searchParams.set("gmail", "failed");
  }
  const response = NextResponse.redirect(destination);
  response.cookies.set("offerfit_gmail_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/hub/gmail",
    maxAge: 0,
  });
  response.cookies.set("offerfit_gmail_verifier", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/hub/gmail",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
