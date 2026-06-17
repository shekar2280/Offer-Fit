import { createClient } from "@/services/supabase/server";

export type LogLevel = "ERROR" | "WARN" | "INFO";

export async function logSystemEvent({
  level,
  source,
  message,
  details = {},
  userId
}: {
  level: LogLevel;
  source: string;
  message: string;
  details?: unknown;
  userId?: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("system_logs").insert({
      level,
      source,
      message,
      details,
      user_id: userId
    });
  } catch {
  }
}
