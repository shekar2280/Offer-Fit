import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import {
  appOrigin,
  authenticated,
  failure,
  HubError,
  limited,
} from "@/lib/hub/server";

export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    await limited(db, "write");
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.OFFERFIT_ENCRYPTION_KEY
    )
      throw new HubError(
        "Gmail is not configured on this deployment. See the deployment guide.",
        503,
      );
    const origin = appOrigin(request);
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${origin}/api/hub/gmail/callback`,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();
    const response = NextResponse.json({ url: url.toString() });
    response.cookies.set("offerfit_gmail_state", `${user.id}:${state}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/hub/gmail",
      maxAge: 600,
    });
    response.cookies.set("offerfit_gmail_verifier", verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/hub/gmail",
      maxAge: 600,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
