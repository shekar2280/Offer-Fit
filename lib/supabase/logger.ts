import { createClient } from "./server";

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
  if (level === "ERROR") {
    console.error(`[${level}] [${source}] ${message}`, details);
  } else if (level === "WARN") {
    console.warn(`[${level}] [${source}] ${message}`, details);
  }

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
