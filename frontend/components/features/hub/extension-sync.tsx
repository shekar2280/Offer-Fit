"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { type Application } from "@/lib/hub/domain";
export function ExtensionSync({
  applications,
}: {
  applications: Application[];
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.type !== "FROM_EXTENSION" ||
        event.data?.action !== "WORKSPACE_SYNCED"
      )
        return;
      if (timeout.current) clearTimeout(timeout.current);
      setBusy(false);
      setMessage(
        "Contact profile and application reminders synced to the extension.",
      );
    };
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);
  const sync = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/hub/extension-profile", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Cannot load contact profile.");
      window.postMessage(
        {
          type: "FROM_WEB_APP",
          action: "SYNC_WORKSPACE",
          data: {
            profile: data.profile,
            applications: applications.map((a) => ({
              job_url: a.job_url,
              company: a.company,
              role: a.role,
              status: a.status,
            })),
          },
        },
        window.location.origin,
      );
      timeout.current = setTimeout(() => {
        setBusy(false);
        setMessage(
          "No extension response. Install/reload OfferFit 1.1 and refresh this page. The configured OfferFit origin must match this site.",
        );
      }, 4000);
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    }
  };
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#101820]/50 p-5 mt-6 max-w-3xl">
      <h2 className="font-medium">Website + extension</h2>
      <p className="text-sm text-white/45 mt-3">
        Sync contact details and a local application-status snapshot for
        duplicate reminders. The extension stores this data locally; it receives
        no Gmail tokens or API keys. Contact autofill runs only on your request.
        Refresh this snapshot after changing statuses; reminders expire after
        seven days.
      </p>
      <div className="flex flex-wrap gap-3 mt-5">
        <Button disabled={busy} onClick={() => void sync()}>
          Sync profile & applications
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.postMessage(
              { type: "FROM_WEB_APP", action: "CLEAR_WORKSPACE" },
              window.location.origin,
            );
            setMessage("Requested removal of local extension data.");
          }}
        >
          Clear extension data
        </Button>
      </div>
      <p role="status" className="text-xs text-primary mt-3">
        {message}
      </p>
    </section>
  );
}
