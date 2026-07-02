import { createClient } from "@/services/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      
      // Check if user is newly created (within last 60 seconds) for Discord webhook (OAuth signups)
      const now = new Date();
      const createdAt = new Date(data.user.created_at);
      const isNewUser = (now.getTime() - createdAt.getTime()) < 60000;

      if (isNewUser && data.user.email) {
        try {
          await fetch(`${origin}/api/signup-notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.user.email,
              user_name: data.user.user_metadata?.full_name || "Unknown"
            }),
          });
        } catch (e) {
          console.error("Failed to call signup-notify API", e);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?error=Could not exchange auth code for session`);
}
