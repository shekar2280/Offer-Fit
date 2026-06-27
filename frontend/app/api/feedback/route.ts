import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message, email, user_name } = await req.json();

  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

  if (!DISCORD_WEBHOOK_URL) {
    return NextResponse.json(
      { success: false, error: "Webhook URL not configured" },
      { status: 500 },
    );
  }

  const discordPayload = {
    embeds: [
      {
        title: "🔔 New Feedback: OfferFit",
        color: 15903308,
        fields: [
          { name: "User", value: user_name || "Unknown", inline: true },
          { name: "Email", value: email || "No email", inline: true },
          { name: "Message", value: message },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discordPayload),
  });

  return NextResponse.json({ success: true });
}
