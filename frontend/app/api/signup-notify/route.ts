import { NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email, user_name } = await req.json();

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Email is required" },
      { status: 400 },
    );
  }

  const hashed_email = crypto
    .createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");

  const supabaseAdmin = createAdminClient();

  const { error: dbError } = await supabaseAdmin
    .from("historical_users")
    .insert({ hashed_email });

  if (dbError) {
    if (dbError.code === "23505") {
      return NextResponse.json({
        success: true,
        message: "User already registered historically",
      });
    }

    console.error("Database error inserting historical user:", dbError);
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 },
    );
  }

  const DISCORD_SIGNUP_WEBHOOK_URL = process.env.DISCORD_SIGNUP_WEBHOOK_URL;

  if (!DISCORD_SIGNUP_WEBHOOK_URL) {
    return NextResponse.json(
      { success: false, error: "Signup Webhook URL not configured" },
      { status: 500 },
    );
  }

  const discordPayload = {
    embeds: [
      {
        title: "🎉 New Signup: OfferFit",
        color: 3066993,
        fields: [
          { name: "User", value: user_name || "Unknown", inline: true },
          { name: "Email", value: email || "No email", inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(DISCORD_SIGNUP_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });
  } catch (webhookError) {
    console.error("Failed to notify discord:", webhookError);
  }

  return NextResponse.json({
    success: true,
    message: "New user recorded and notified",
  });
}
