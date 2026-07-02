import { NextResponse } from "next/server";
import { createAdminClient } from "@/services/supabase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email, user_name } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
  }

  // Compute MD5 hash of email
  const hashed_email = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");

  const supabaseAdmin = createAdminClient();

  // Try to insert the user into historical_users
  const { error: dbError } = await supabaseAdmin
    .from("historical_users")
    .insert({ hashed_email });

  if (dbError) {
    // If it fails with duplicate key (code 23505), this means they have signed up before.
    // In that case, we silently return success without sending the discord alert.
    if (dbError.code === "23505") {
      return NextResponse.json({ success: true, message: "User already registered historically" });
    }
    
    // For other DB errors, log and return error
    console.error("Database error inserting historical user:", dbError);
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  // If insert was successful, they are a brand new historical user!
  // Send Discord Webhook
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
        color: 3066993, // Green
        fields: [
          { name: "User", value: user_name || "Unknown", inline: true },
          { name: "Email", value: email || "No email", inline: true }
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

  return NextResponse.json({ success: true, message: "New user recorded and notified" });
}
