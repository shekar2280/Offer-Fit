"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Application } from "@/lib/hub/domain";
export function JobCapture({
  onCapture,
  disabled = false,
}: {
  onCapture: (job: Partial<Application>) => void;
  disabled?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const capture = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/hub/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const job = await response.json();
      if (!response.ok) throw new Error(job.error);
      onCapture(job);
      setMessage(
        "Role details extracted. Review the fields below before saving.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not extract job details.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-xl border border-primary/20 p-4 mb-6">
      <p className="text-sm font-medium">Start with the job link</p>
      <p className="text-xs text-white/45 mt-2">
        Read public job metadata to fill the role fields below. For blocked
        sites, use the extension or paste details.
      </p>
      <div className="flex flex-wrap gap-3 mt-3">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={2048}
          aria-label="Job link to parse"
          placeholder="https://company.com/jobs/your-role"
          className="flex-1 min-w-48"
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy || !url}
          onClick={() => void capture()}
        >
          {busy ? "Reading page…" : "Parse URL & fill details"}
        </Button>
      </div>
      <p role="status" className="text-xs text-primary mt-3">
        {message}
      </p>
    </section>
  );
}
