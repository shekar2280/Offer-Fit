import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/services/supabase/admin";
import { dbCheck, failure, getCredential, HubError } from "@/lib/hub/server";
import { syncMailbox } from "@/lib/hub/gmail-sync";
export const maxDuration = 300;
export async function GET(request: Request) {
  try {
    if (
      process.env.OFFERFIT_BACKGROUND_SYNC_ENABLED !== "true" ||
      !process.env.CRON_SECRET
    )
      throw new HubError("Background synchronization is disabled.", 503);
    const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
    const actual = Buffer.from(request.headers.get("authorization") || "");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      throw new HubError("Unauthorized.", 401);
    const admin = createAdminClient();
    const { error: cleanupError } = await admin
      .from("hub_limits")
      .delete()
      .lt("window_start", new Date(Date.now() - 2 * 86400000).toISOString());
    dbCheck(cleanupError);
    const { data: jobs, error } = await admin.rpc("hub_claim_mailboxes");
    dbCheck(error);
    const outcomes = await Promise.all(
      ((jobs as { user_id: string; lease_token: string }[]) || []).map(
        async (job) => {
          let hasMore = false;
          let errorCode: string | null = null;
          try {
            const credential = await getCredential(job.user_id, "gmail");
            if (credential?.metadata.background_sync === true)
              hasMore = (await syncMailbox(admin, job.user_id, credential))
                .hasMore;
          } catch (error) {
            errorCode =
              error instanceof HubError && error.status === 409
                ? "reconnect_or_retry"
                : "sync_failed";
          }
          const { error: updateError } = await admin
            .from("hub_mailbox_jobs")
            .update({
              lease_until: null,
              lease_token: null,
              last_error_code: errorCode,
              next_run_at: new Date(
                Date.now() + (hasMore && !errorCode ? 15 : 60) * 60000,
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", job.user_id)
            .eq("lease_token", job.lease_token);
          dbCheck(updateError);
          return errorCode ? "failed" : "completed";
        },
      ),
    );
    return NextResponse.json(
      {
        processed: outcomes.length,
        failed: outcomes.filter((o) => o === "failed").length,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
