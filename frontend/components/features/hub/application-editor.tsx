"use client";
import { useState, type FormEvent } from "react";
import {
  type Application,
  type ApplicationStatus,
  type Resume,
  localDate,
  statuses,
} from "@/lib/hub/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "./modal";
import { JobCapture } from "./job-capture";
const selectClass =
  "w-full rounded-lg border border-white/15 bg-[#101820] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const day = (value: string | null | undefined) =>
  value
    ? /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : localDate(new Date(value))
    : "";
export function ApplicationEditor({
  application,
  resumes,
  busy,
  preview,
  close,
  onSubmit,
}: {
  application: Partial<Application>;
  resumes: Resume[];
  busy: boolean;
  preview: boolean;
  close: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [draft, setDraft] = useState(application);
  const change = (name: keyof Application, value: string) =>
    setDraft((previous) => ({ ...previous, [name]: value }));
  return (
    <Modal
      title={application.id ? "Update application" : "Save an opportunity"}
      close={close}
    >
      {!application.id && (
        <JobCapture
          disabled={preview || busy}
          onCapture={(job) => setDraft((previous) => ({ ...previous, ...job }))}
        />
      )}
      <form onSubmit={onSubmit}>
        <fieldset disabled={busy} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={draft.company || ""}
                onChange={(e) => change("company", e.target.value)}
                maxLength={160}
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={draft.role || ""}
                onChange={(e) => change("role", e.target.value)}
                maxLength={200}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="job_url">Role URL (the specific opening)</Label>
            <Input
              id="job_url"
              name="job_url"
              type="url"
              value={draft.job_url || ""}
              onChange={(e) => change("job_url", e.target.value)}
              maxLength={2048}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={draft.location || ""}
                onChange={(e) => change("location", e.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="status">Application status</Label>
              <select
                id="status"
                name="status"
                className={selectClass}
                value={draft.status || "saved"}
                onChange={(e) =>
                  change("status", e.target.value as ApplicationStatus)
                }
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="applied_at">
                Applied date (after submission)
              </Label>
              <Input
                type="date"
                id="applied_at"
                name="applied_at"
                value={day(draft.applied_at)}
                onChange={(e) => change("applied_at", e.target.value)}
                max={localDate()}
              />
            </div>
            <div>
              <Label htmlFor="next_action_at">Next action date</Label>
              <Input
                type="date"
                id="next_action_at"
                name="next_action_at"
                value={day(draft.next_action_at)}
                onChange={(e) => change("next_action_at", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="resume_id">Resume used</Label>
            <select
              className={selectClass}
              id="resume_id"
              name="resume_id"
              value={draft.resume_id || ""}
              onChange={(e) => change("resume_id", e.target.value)}
            >
              <option value="">Not selected</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="jd">Job description</Label>
            <textarea
              className={`${selectClass} min-h-32 resize-y`}
              id="jd"
              name="jd"
              value={draft.jd || ""}
              onChange={(e) => change("jd", e.target.value)}
              maxLength={30000}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              className={`${selectClass} min-h-24 resize-y`}
              id="notes"
              name="notes"
              value={draft.notes || ""}
              onChange={(e) => change("notes", e.target.value)}
              maxLength={10000}
            />
          </div>
          <p className="text-xs text-white/40">
            Choose Applied only after submitting. Resume generation and role
            capture stay separate from submission.
          </p>
          <Button disabled={busy}>
            {busy ? "Saving…" : "Save application"}
          </Button>
        </fieldset>
      </form>
    </Modal>
  );
}
