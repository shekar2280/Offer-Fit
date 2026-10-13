export const statuses = [
  "saved",
  "preparing",
  "applied",
  "acknowledged",
  "assessment",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "closed",
] as const;
export type ApplicationStatus = (typeof statuses)[number];
export interface Application {
  id: string;
  company: string;
  role: string;
  job_url: string;
  normalized_url: string;
  jd: string;
  location: string;
  status: ApplicationStatus;
  notes: string;
  applied_at: string | null;
  last_contact_at: string | null;
  next_action_at: string | null;
  resume_id: string | null;
  created_at: string;
  updated_at: string;
  revision: number;
}
export interface Resume {
  id: string;
  name: string;
  content: string;
  file_path: string | null;
  parent_id: string | null;
  created_at: string;
}
export interface Draft {
  id: string;
  application_id: string;
  subject: string;
  body: string;
  sent_at: string | null;
  created_at: string;
}
export interface EmailUpdate {
  id: string;
  application_id: string | null;
  message_id: string;
  mailbox: string;
  subject: string;
  proposed_status: ApplicationStatus | null;
  evidence: string;
  resolution: string;
  received_at: string;
}
export const terminalStatuses: readonly string[] = [
  "accepted",
  "rejected",
  "withdrawn",
  "closed",
];
export function normalizeJobUrl(value: string): string {
  if (!value.trim()) return "";
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("Use an HTTP or HTTPS job URL.");
  if (url.username || url.password)
    throw new Error("Job URLs cannot contain credentials.");
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|ref$|source$|trk$|tracking|referrer$|gh_src$)/i.test(key))
      url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}
export function isFollowUpDue(app: Application, now = new Date()): boolean {
  if (terminalStatuses.includes(app.status) || !app.applied_at) return false;
  if (app.next_action_at)
    return Date.parse(app.next_action_at) <= now.getTime();
  if (!["applied", "acknowledged"].includes(app.status)) return false;
  const anchor = Math.max(
    Date.parse(app.applied_at),
    app.last_contact_at ? Date.parse(app.last_contact_at) : 0,
  );
  return now.getTime() - anchor > 10 * 86400000;
}
export function localDate(now = new Date(), timezone = "Asia/Kolkata"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((key) => parts.find((p) => p.type === key)?.value)
    .join("-");
}
export function checkinStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  const cursor = new Date(`${today}T12:00:00Z`);
  if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let count = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    count++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}
export function classifyReply(
  subject: string,
  snippet: string,
): ApplicationStatus | null {
  const text = `${subject} ${snippet}`.toLowerCase();
  // Suggestions always require user review; snippets alone cannot safely establish an outcome.
  if (
    /not moving forward|unfortunately.{0,80}(proceed|application|selected)|not.{0,20}selected|regret to inform|other candidates/.test(
      text,
    )
  )
    return "rejected";
  if (/offer of employment|pleased to offer|offer letter/.test(text))
    return "offer";
  if (
    /schedule.{0,35}interview|interview invitation|invite.{0,30}interview/.test(
      text,
    )
  )
    return "interview";
  if (/coding (assessment|challenge)|take.home|online assessment/.test(text))
    return "assessment";
  if (
    /application.{0,25}received|thank you for applying|thanks for applying/.test(
      text,
    )
  )
    return "acknowledged";
  return null;
}
