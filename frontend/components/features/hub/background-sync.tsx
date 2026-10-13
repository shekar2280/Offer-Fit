"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export function BackgroundSync({
  enabled,
  configured,
  error,
  onRefresh,
}: {
  enabled: boolean;
  configured: boolean;
  error?: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/hub/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "background", enabled: !enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await onRefresh();
      toast.success(
        enabled
          ? "Background sync disabled."
          : "Background sync enabled. Replies still need your review.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update preference.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101820]/50 p-5 mt-6 max-w-3xl">
      <h2 className="font-medium">Background Gmail checks</h2>
      <p className="text-sm text-white/45 mt-3">
        With your consent, the deployed scheduler checks candidate application
        replies periodically, even while this page is closed. Matching snippets
        appear in Applications for review. This does not send emails or apply
        suggested outcomes automatically.
      </p>
      <Button
        className="mt-5"
        variant="outline"
        disabled={busy || (!configured && !enabled)}
        onClick={() => void toggle()}
      >
        {enabled ? "Disable background checks" : "Enable background checks"}
      </Button>
      {!configured && (
        <p className="text-xs text-primary mt-3">
          The deployment owner must configure and verify the protected scheduler
          before this can be enabled.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-primary mt-3">
          Last background check failed. Try manual sync; reconnect if requested.
        </p>
      )}
    </section>
  );
}
