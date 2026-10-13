import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dbCheck, HubError } from "./server";
import { createAdminClient } from "@/services/supabase/admin";
import { classifyReply } from "./domain";
export async function syncMailbox(
  db: SupabaseClient,
  userId: string,
  credential: {
    secret: string;
    metadata: Record<string, unknown>;
    updatedAt: string;
  },
) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    throw new HubError("Gmail server configuration is missing.", 503);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: credential.secret,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!tokenResponse.ok) {
    const tokenError = await tokenResponse.json().catch(() => ({}));
    if (tokenError.error === "invalid_grant")
      throw new HubError(
        "Gmail access expired. Disconnect and reconnect your account.",
        409,
      );
    throw new HubError(
      "Google could not refresh mailbox access. Retry later.",
      502,
    );
  }
  const tokens = await tokenResponse.json();
  const gmail = async (path: string) => {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/${path}`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      throw new HubError(
        "Gmail could not complete synchronization. Retry later.",
        502,
      );
    return response.json();
  };
  const query =
    "newer_than:90d -in:sent (subject:application OR subject:interview OR subject:assessment OR subject:offer OR subject:opportunity OR subject:hiring OR subject:candidacy)";
  const params = new URLSearchParams({ q: query, maxResults: "25" });
  if (typeof credential.metadata.next_page === "string")
    params.set("pageToken", credential.metadata.next_page);
  const list = await gmail(`messages?${params}`);
  const { data: applications, error } = await db
    .from("hub_applications")
    .select("id,company,role,applied_at,created_at,job_url")
    .eq("user_id", userId)
    .order("created_at")
    .limit(500);
  dbCheck(error);
  let found = 0;
  const suggestions: Record<string, unknown>[] = [];
  const messages: { id: string }[] = list.messages || [];
  // Small concurrent batches bound API usage and execution time.
  for (let start = 0; start < messages.length; start += 5) {
    const batch = await Promise.all(
      messages
        .slice(start, start + 5)
        .map((message) =>
          gmail(
            `messages/${encodeURIComponent(message.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          ),
        ),
    );
    for (const message of batch) {
      const headers: { name: string; value: string }[] =
        message.payload?.headers || [];
      const subject = (
        headers.find((h) => h.name.toLowerCase() === "subject")?.value || ""
      ).slice(0, 1000);
      const from =
        headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
      const snippet = String(message.snippet || "").slice(0, 1500);
      const received = Number(message.internalDate);
      if (!Number.isFinite(received)) continue;
      const text = `${subject} ${from} ${snippet}`.toLowerCase();
      const candidates = (applications || []).filter((app) => {
        const company = app.company.toLowerCase().trim();
        if (
          company.length < 3 ||
          received < Date.parse(app.applied_at || app.created_at) - 86400000
        )
          return false;
        const pattern = new RegExp(
          `(?:^|[^a-z0-9])${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`,
          "i",
        );
        return pattern.test(text);
      });
      if (!candidates.length) continue;
      const roleMatches = candidates.filter((app) =>
        text.includes(app.role.toLowerCase()),
      );
      const matched =
        roleMatches.length === 1
          ? roleMatches[0]
          : candidates.length === 1
            ? candidates[0]
            : null;
      suggestions.push({
        application_id: matched?.id || null,
        message_id: String(message.id),
        subject,
        evidence: snippet,
        proposed_status: classifyReply(subject, snippet),
        received_at: new Date(received).toISOString(),
      });
      found++;
    }
  }
  const { data: saved, error: saveError } = await createAdminClient().rpc(
    "hub_store_sync_batch",
    {
      p_user: userId,
      p_version: credential.updatedAt,
      p_messages: suggestions,
      p_metadata: {
        ...credential.metadata,
        last_sync_at: new Date().toISOString(),
        next_page: list.nextPageToken || null,
      },
    },
  );
  dbCheck(saveError);
  if (!saved)
    throw new HubError(
      "This Gmail connection changed while syncing. Refresh and retry.",
      409,
    );
  return {
    examined: messages.length,
    relevant: found,
    hasMore: Boolean(list.nextPageToken),
  };
}
