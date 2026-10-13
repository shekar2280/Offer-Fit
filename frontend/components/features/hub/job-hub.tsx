"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarCheck,
  Check,
  ChevronRight,
  Flame,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "./modal";
import { ApplicationEditor } from "./application-editor";
import { Navbar } from "@/components/layout/navbar";
import { useAnalysis } from "@/components/providers/analysis-provider";
import {
  checkinStreak,
  isFollowUpDue,
  localDate,
  normalizeJobUrl,
  statuses,
  type Application,
  type Draft,
  type EmailUpdate,
  type Resume,
} from "@/lib/hub/domain";
import { CompanyDirectory } from "./company-directory";
import { ExtensionSync } from "./extension-sync";
import { ProjectEvidence } from "./project-evidence";
import { BackgroundSync } from "./background-sync";

type View =
  "today" | "applications" | "companies" | "resumes" | "outreach" | "settings";
export interface HubData {
  applications: Application[];
  resumes: Resume[];
  drafts: Draft[];
  emails: EmailUpdate[];
  checkins: { local_date: string }[];
  events: {
    id: string;
    application_id: string;
    new_status: string;
    created_at: string;
  }[];
  integrations: {
    gemini: boolean;
    gmail: {
      email: string;
      last_sync_at?: string;
      next_page?: string;
      background_sync?: boolean;
      background_error?: string | null;
    } | null;
    gmailConfigured: boolean;
    backgroundConfigured: boolean;
  };
  timezone: string;
}
const views: { id: View; label: string; icon: typeof Mail }[] = [
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "applications", label: "Applications", icon: BriefcaseBusiness },
  { id: "companies", label: "Companies", icon: Search },
  { id: "resumes", label: "Resumes", icon: FileText },
  { id: "outreach", label: "Outreach", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings2 },
];
const panel = "rounded-2xl border border-white/[0.08] bg-[#101820]/50 p-5";
const selectClass =
  "w-full rounded-lg border border-white/15 bg-[#101820] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const textClass = `${selectClass} min-h-28 resize-y`;
async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    path,
    body instanceof FormData
      ? { method: "POST", body }
      : body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : { cache: "no-store" },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "This action failed. Please retry.");
  return data;
}
function pretty(value: string) {
  return value.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
function date(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
      })
    : "—";
}

export function JobHub({
  initialView = "today",
  username = "User",
  preview = false,
}: {
  initialView?: View;
  username?: string;
  preview?: boolean;
}) {
  const router = useRouter();
  const queries = useQueryClient();
  const { setAnalysisData } = useAnalysis();
  const [view, setView] = useState<View>(initialView);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Application> | null>(null);
  const [active, setActive] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [key, setKey] = useState("");
  const [draftApp, setDraftApp] = useState("");
  const [draftResume, setDraftResume] = useState("");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [generatedResume, setGeneratedResume] = useState("");
  const [changes, setChanges] = useState<string[]>([]);
  const [kind, setKind] = useState("email");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const query = useQuery<HubData>({
    queryKey: ["job-hub"],
    queryFn: () => api<HubData>("/api/hub"),
    retry: false,
    staleTime: 15000,
    enabled: !preview,
    refetchOnWindowFocus: true,
    refetchInterval: preview ? false : 60000,
  });
  const data = query.data;
  const refresh = async () => {
    await queries.invalidateQueries({ queryKey: ["job-hub"] });
  };
  const run = async (fn: () => Promise<unknown>, message?: string) => {
    if (preview) {
      toast.info("Sample preview. Writes are disabled.");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await refresh();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };
  const today = localDate();
  const checked = data?.checkins.some((c) => c.local_date === today);
  const due = data?.applications.filter((a) => isFollowUpDue(a)) || [];
  const open = (next: View) => {
    setView(next);
    setSearch("");
    setFilter("all");
    router.replace(`${preview ? "/dev-preview" : "/hub"}?view=${next}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("view");
    if (views.some((v) => v.id === selected)) setView(selected as View);
    const result = params.get("gmail");
    if (result)
      toast[result === "connected" ? "success" : "error"](
        result === "connected"
          ? "Gmail connected."
          : "Gmail connection failed. Check consent and server configuration.",
      );
  }, []);
  useEffect(() => {
    if (!data) return;
    const receive = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.type !== "FROM_EXTENSION" ||
        event.data?.action !== "JOB_DATA_RESPONSE"
      )
        return;
      const job = event.data.data;
      if (
        !job ||
        typeof job.company !== "string" ||
        typeof job.role !== "string" ||
        typeof job.url !== "string"
      )
        return;
      if (
        job.company.length > 160 ||
        job.role.length > 200 ||
        job.url.length > 2048 ||
        (job.description?.length || 0) > 30000
      )
        return;
      let normalized: string;
      try {
        normalized = normalizeJobUrl(job.url);
      } catch {
        return;
      }
      const existing = data.applications.find(
        (a) => a.normalized_url === normalized,
      );
      if (existing) {
        setActive(existing);
        setView("applications");
        toast.info(
          `Already tracked: ${pretty(existing.status)}. Review or update this application.`,
        );
      } else {
        setEditing({
          company: job.company,
          role: job.role,
          job_url: job.url,
          jd: job.description || "",
          location: job.location || "",
          status: "saved",
        });
      }
      window.postMessage(
        { type: "FROM_WEB_APP", action: "ACK_JOB_DATA" },
        window.location.origin,
      );
    };
    window.addEventListener("message", receive);
    window.postMessage(
      { type: "FROM_WEB_APP", action: "REQUEST_JOB_DATA" },
      window.location.origin,
    );
    return () => window.removeEventListener("message", receive);
  }, [data]);

  const startAnalysis = (app: Application, mode: "analysis" | "customize") => {
    setAnalysisData({
      id: null,
      companyName: app.company,
      position: app.role,
      jd: app.jd,
      location: app.location,
      jobType: "",
    });
    router.push(mode === "analysis" ? "/analyze" : "/customize");
  };
  const saveApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (
      editing?.applied_at &&
      values.applied_at === localDate(new Date(editing.applied_at))
    )
      values.applied_at = editing.applied_at;
    if (
      editing?.next_action_at &&
      values.next_action_at === localDate(new Date(editing.next_action_at))
    )
      values.next_action_at = editing.next_action_at;
    void run(async () => {
      await api("/api/hub", {
        ...values,
        action: "save_application",
        id: editing?.id,
        revision: editing?.revision,
        last_contact_at: editing?.last_contact_at,
      });
      setEditing(null);
      setActive(null);
    }, "Application saved.");
  };
  const applicationList =
    data?.applications.filter(
      (a) =>
        `${a.company} ${a.role} ${a.location}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "all" ||
          (filter === "due" ? isFollowUpDue(a) : a.status === filter)),
    ) || [];

  const applicationRows = (items: Application[]) =>
    items.length ? (
      <div className="divide-y divide-white/[0.06]">
        {items.map((app) => (
          <button
            key={app.id}
            className="w-full text-left py-4 flex items-center gap-4 hover:bg-white/[0.025] rounded-xl px-3 focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => setActive(app)}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
              {app.company.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{app.role}</p>
              <p className="text-xs text-white/45 truncate mt-1">
                {app.company} · {app.location || "Location unspecified"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs rounded-full bg-white/5 border border-white/10 px-2.5 py-1">
                {pretty(app.status)}
              </span>
              <p
                className={`text-xs mt-2 ${isFollowUpDue(app) ? "text-primary" : "text-white/40"}`}
              >
                {isFollowUpDue(app)
                  ? "Follow-up due"
                  : app.applied_at
                    ? `Applied ${date(app.applied_at)}`
                    : `Saved ${date(app.created_at)}`}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </button>
        ))}
      </div>
    ) : (
      <div className="py-12 text-center">
        <BriefcaseBusiness className="mx-auto w-8 h-8 text-primary/60 mb-4" />
        <p className="text-white/70">
          {search || filter !== "all"
            ? "No matching applications."
            : "Your next opportunity starts here."}
        </p>
        <p className="text-sm text-white/40 mt-2">
          Save a role to track its resume, outreach, and replies together.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar username={username} showMenuButton={false} />
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row">
        <aside className="md:w-56 md:shrink-0 md:sticky md:top-[68px] md:h-[calc(100vh-68px)] p-4 border-b md:border-b-0 md:border-r border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 px-3 py-3 hidden md:block">
            Your career workspace
          </p>
          <nav
            aria-label="Career workspace"
            className="flex md:flex-col gap-1 overflow-x-auto"
          >
            {views.map((v) => (
              <button
                key={v.id}
                aria-current={view === v.id ? "page" : undefined}
                onClick={() => open(v.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm shrink-0 transition ${view === v.id ? "bg-primary/10 text-primary border border-primary/15" : "text-white/50 hover:bg-white/5 border border-transparent"}`}
              >
                <v.icon className="w-4 h-4" />
                {v.label}
              </button>
            ))}
          </nav>
          <div className="hidden md:block mt-8 px-3 text-xs text-white/35 leading-6">
            <p className="text-white/65">Built for your first role</p>
            <p>Frontend · Backend · Full-stack</p>
            <p>Python · AI · GenAI</p>
            <p>India + eligible remote</p>
            <Link href="/analyze" className="flex gap-2 text-primary mt-4">
              Analyze a resume <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link href="/profile" className="block hover:text-primary">
              Profile & GitHub evidence
            </Link>
            <Link href="/history" className="block hover:text-primary">
              Analysis history
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-w-0 p-5 sm:p-8">
          <div className="flex justify-between gap-4 items-start mb-8">
            <div>
              <p className="text-primary text-xs uppercase tracking-[0.2em] mb-2">
                OfferFit · Daily momentum
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {view === "today"
                  ? "Make your next move."
                  : views.find((v) => v.id === view)?.label}
              </h1>
              <p className="text-sm text-white/45 mt-3">
                {view === "today"
                  ? "Your applications, resumes, and next steps. One place to come back to."
                  : "Keep every opportunity connected to the work you put into it."}
              </p>
            </div>
            <Button
              aria-label="Save a role"
              className="rounded-xl shrink-0"
              onClick={() => setEditing({ status: "saved" })}
            >
              <Plus /> <span className="hidden sm:inline">Save a role</span>
            </Button>
          </div>
          {query.isLoading && (
            <div
              className={`${panel} animate-pulse py-16 text-white/50`}
              role="status"
            >
              Loading your workspace…
            </div>
          )}
          {query.error && (
            <div role="alert" className={`${panel} border-primary/30`}>
              <p>{query.error.message}</p>
              <p className="mt-3 text-sm text-white/45">
                Existing Analyze and Customize remain available. The new hub
                requires its additive database migration and server
                configuration.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => void query.refetch()}
              >
                Retry
              </Button>
            </div>
          )}
          {data && (
            <>
              {view === "today" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Applications in motion",
                        value: data.applications.filter((a) =>
                          [
                            "applied",
                            "acknowledged",
                            "assessment",
                            "interview",
                            "offer",
                          ].includes(a.status),
                        ).length,
                        icon: BriefcaseBusiness,
                      },
                      {
                        label: "Follow-ups due",
                        value: due.length,
                        icon: Mail,
                      },
                      {
                        label: "Day streak",
                        value: checkinStreak(
                          data.checkins.map((c) => c.local_date),
                          today,
                        ),
                        icon: Flame,
                      },
                      {
                        label: "Applied today",
                        value: data.applications.filter(
                          (a) =>
                            a.applied_at &&
                            localDate(new Date(a.applied_at)) === today,
                        ).length,
                        icon: CalendarCheck,
                      },
                    ].map((item) => (
                      <div key={item.label} className={panel}>
                        <item.icon className="text-primary w-5 h-5 mb-5" />
                        <p className="text-3xl font-semibold">{item.value}</p>
                        <p className="text-xs text-white/45 mt-2">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div
                    className={`${panel} flex flex-wrap items-center justify-between gap-5 border-primary/20 bg-gradient-to-r from-primary/[0.07] to-transparent`}
                  >
                    <div>
                      <h2 className="font-medium">A small step, every day.</h2>
                      <p className="text-sm text-white/45 mt-2">
                        Review replies, follow up, and prepare one suitable
                        application.
                      </p>
                    </div>
                    <Button
                      disabled={busy || checked}
                      onClick={() =>
                        void run(
                          () => api("/api/hub", { action: "checkin" }),
                          "Today's check-in recorded.",
                        )
                      }
                    >
                      {checked ? (
                        <>
                          <Check /> Checked in today
                        </>
                      ) : (
                        <>
                          <CalendarCheck /> Daily check-in
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="grid xl:grid-cols-2 gap-6">
                    <section className={panel}>
                      <div className="flex justify-between">
                        <h2 className="font-medium">Your next follow-ups</h2>
                        <button
                          onClick={() => {
                            open("applications");
                            setFilter("due");
                          }}
                          className="text-xs text-primary"
                        >
                          View all
                        </button>
                      </div>
                      {due.length ? (
                        applicationRows(due.slice(0, 5))
                      ) : (
                        <p className="py-10 text-sm text-white/40">
                          Nothing overdue. Silence beyond 10 days will appear
                          here.
                        </p>
                      )}
                    </section>
                    <section className={panel}>
                      <div className="flex justify-between">
                        <h2 className="font-medium">Recruiter replies</h2>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || !data.integrations.gmail}
                          onClick={() =>
                            void run(async () => {
                              const result = await api<{
                                examined: number;
                                hasMore: boolean;
                              }>("/api/hub/gmail", { action: "sync" });
                              toast.success(
                                `Checked ${result.examined} messages.${result.hasMore ? " Sync again to continue." : " Review matching replies below."}`,
                              );
                            })
                          }
                        >
                          <RefreshCw /> Sync Gmail
                        </Button>
                      </div>
                      <p className="text-sm text-white/45 mt-4">
                        {data.emails.length
                          ? `${data.emails.length} replies need review.`
                          : data.integrations.gmail
                            ? "No pending updates. Sync to check candidate messages from the last 90 days."
                            : "Connect Gmail in Settings to bring application replies into this workspace."}
                      </p>
                      <button
                        className="text-primary text-sm mt-4"
                        onClick={() =>
                          open(
                            data.integrations.gmail
                              ? "applications"
                              : "settings",
                          )
                        }
                      >
                        Review updates <span aria-hidden>→</span>
                      </button>
                    </section>
                  </div>
                  <section className={panel}>
                    <h2 className="font-medium mb-3">Recent opportunities</h2>
                    {applicationRows(data.applications.slice(0, 5))}
                  </section>
                </div>
              )}
              {view === "applications" && (
                <div className="space-y-6">
                  {data.emails.length > 0 && (
                    <section className={panel}>
                      <h2 className="font-medium mb-4">
                        Email updates to review
                      </h2>
                      <p className="text-xs text-white/40 mb-4">
                        Suggestions use email snippets, can be wrong, and never
                        update status without your review.
                      </p>
                      {data.emails.map((email) => (
                        <article
                          key={email.id}
                          className="border-t border-white/10 py-4"
                        >
                          <p className="text-sm font-medium">{email.subject}</p>
                          <p className="text-xs text-white/40 mt-1">
                            {data.applications.find(
                              (a) => a.id === email.application_id,
                            )?.company || "Ambiguous application match"}{" "}
                            · {date(email.received_at)} ·{" "}
                            {email.proposed_status
                              ? `Suggested: ${pretty(email.proposed_status)}`
                              : "Unclassified reply"}
                          </p>
                          <p className="text-sm text-white/60 mt-3">
                            {email.evidence}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <a
                              target="_blank"
                              rel="noopener noreferrer"
                              href={`https://mail.google.com/mail/u/${encodeURIComponent(email.mailbox || "0")}/#all/${encodeURIComponent(email.message_id)}`}
                              className="text-xs text-primary p-2"
                            >
                              Read in Gmail ↗
                            </a>
                            <Button
                              size="sm"
                              disabled={
                                busy ||
                                !email.application_id ||
                                !email.proposed_status
                              }
                              onClick={() =>
                                void run(
                                  () =>
                                    api("/api/hub", {
                                      action: "resolve_email",
                                      id: email.id,
                                      resolution: "applied",
                                    }),
                                  "Status updated.",
                                )
                              }
                            >
                              Apply suggestion
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  () =>
                                    api("/api/hub", {
                                      action: "resolve_email",
                                      id: email.id,
                                      resolution: "dismissed",
                                    }),
                                  "Update dismissed.",
                                )
                              }
                            >
                              Dismiss
                            </Button>
                          </div>
                        </article>
                      ))}
                    </section>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Input
                      aria-label="Search applications"
                      placeholder="Search company, role, or location…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="max-w-md"
                    />
                    <select
                      aria-label="Filter status"
                      className={`${selectClass} sm:w-52`}
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      <option value="due">Follow-up due · 10+ days</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {pretty(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <section className={panel}>
                    {applicationRows(applicationList)}
                  </section>
                  <p className="text-xs text-white/35">
                    Showing up to the latest 500 applications. Status changes
                    are recorded in each role&apos;s timeline.
                  </p>
                </div>
              )}
              {view === "companies" && (
                <CompanyDirectory
                  applications={data.applications}
                  onSave={(company) => setEditing({ company, status: "saved" })}
                />
              )}
              {view === "resumes" && (
                <div className="space-y-6">
                  <section className={panel}>
                    <h2 className="font-medium">
                      Your source resume, safely kept.
                    </h2>
                    <p className="text-sm text-white/45 mt-2">
                      Upload DOCX, PDF, TXT, or TEX (up to 5 MB). Originals stay
                      private. Tailored drafts are saved as separate versions.
                    </p>
                    <form
                      className="flex flex-wrap gap-3 mt-5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        void run(
                          () => api("/api/hub/resumes", form),
                          "Resume uploaded.",
                        );
                      }}
                    >
                      <Input
                        name="name"
                        placeholder="Resume name"
                        aria-label="Resume name"
                        maxLength={160}
                        required
                        className="sm:w-64"
                      />
                      <Input
                        name="file"
                        type="file"
                        accept=".docx,.pdf,.txt,.tex"
                        aria-label="Resume file"
                        required
                        className="sm:w-80"
                      />
                      <Button disabled={busy}>Upload resume</Button>
                    </form>
                    <details className="mt-6">
                      <summary className="text-sm text-primary cursor-pointer">
                        Or save resume text
                      </summary>
                      <form
                        className="space-y-3 mt-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void run(async () => {
                            await api("/api/hub", {
                              action: "save_resume",
                              name: resumeName,
                              content: resumeContent,
                            });
                            setResumeName("");
                            setResumeContent("");
                          }, "Resume saved.");
                        }}
                      >
                        <Input
                          placeholder="Resume name"
                          aria-label="Text resume name"
                          maxLength={160}
                          value={resumeName}
                          onChange={(e) => setResumeName(e.target.value)}
                          required
                        />
                        <textarea
                          className={textClass}
                          aria-label="Resume text"
                          maxLength={60000}
                          value={resumeContent}
                          onChange={(e) => setResumeContent(e.target.value)}
                          required
                        />
                        <Button disabled={busy}>Save text resume</Button>
                      </form>
                    </details>
                  </section>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {data.resumes.map((resume) => (
                      <article className={panel} key={resume.id}>
                        <h2 className="font-medium">{resume.name}</h2>
                        <p className="text-xs text-white/40 mt-2">
                          {date(resume.created_at)} ·{" "}
                          {resume.parent_id
                            ? "Tailored draft"
                            : "Source resume"}{" "}
                          ·{" "}
                          {
                            data.applications.filter(
                              (a) => a.resume_id === resume.id,
                            ).length
                          }{" "}
                          linked applications
                        </p>
                        <details className="mt-4">
                          <summary className="text-primary text-sm cursor-pointer">
                            Preview text
                          </summary>
                          <pre className="text-xs text-white/60 whitespace-pre-wrap max-h-72 overflow-auto mt-4">
                            {resume.content}
                          </pre>
                        </details>
                        <div className="flex flex-wrap gap-3 mt-5">
                          {resume.file_path && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  const result = await api<{ url: string }>(
                                    `/api/hub/resumes?id=${resume.id}`,
                                  );
                                  window.location.assign(result.url);
                                })
                              }
                            >
                              Download original
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              setDraftResume(resume.id);
                              setGeneratedResume("");setSubject("");setEmailBody("");
                              open("outreach");
                              setKind("tailor");
                            }}
                          >
                            Tailor for a role
                          </Button>
                          <a
                            className="text-xs text-primary p-2"
                            href={`/api/hub/resumes/export?id=${resume.id}`}
                          >
                            Download DOCX
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                  {!data.resumes.length && (
                    <p className="text-sm text-white/40">
                      Add a source resume to start generating outreach and
                      tailored drafts.
                    </p>
                  )}
                </div>
              )}
              {view === "outreach" && (
                <div className="space-y-6">
                  <section className={panel}>
                    <h2 className="font-medium">
                      Make it specific. Keep it truthful.
                    </h2>
                    <p className="text-sm text-white/45 mt-2">
                      Gemini uses your selected resume and job description.
                      Review every claim before sending or saving.
                    </p>
                    <div className="grid md:grid-cols-3 gap-3 my-5">
                      <select
                        className={selectClass}
                        aria-label="Application for generation"
                        disabled={busy}
                        value={draftApp}
                        onChange={(e) => {
                          setDraftApp(e.target.value);
                          setSubject("");
                          setEmailBody("");
                          setGeneratedResume("");
                        }}
                      >
                        <option value="">Choose a role</option>
                        {data.applications.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.company} · {a.role}
                          </option>
                        ))}
                      </select>
                      <select
                        className={selectClass}
                        aria-label="Resume for generation"
                        disabled={busy}
                        value={draftResume}
                        onChange={(e) => {
                          setDraftResume(e.target.value);
                          setGeneratedResume("");
                          setSubject("");
                          setEmailBody("");
                        }}
                      >
                        <option value="">Choose a resume</option>
                        {data.resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className={selectClass}
                        aria-label="Generation type"
                        disabled={busy}
                        value={kind}
                        onChange={(e) => {
                          setKind(e.target.value);
                          setGeneratedResume("");
                          setSubject("");
                          setEmailBody("");
                        }}
                      >
                        <option value="email">Cold email</option>
                        <option value="followup">Follow-up email</option>
                        <option value="tailor">Tailored resume draft</option>
                      </select>
                    </div>
                    <ProjectEvidence
                      preview={preview}
                      disabled={busy}
                      selected={selectedProjects}
                      onChange={(ids) => {
                        setSelectedProjects(ids);
                        setGeneratedResume("");
                        setSubject("");
                        setEmailBody("");
                      }}
                    />
                    <Button
                      disabled={
                        busy ||
                        !draftApp ||
                        !draftResume ||
                        !data.integrations.gemini
                      }
                      onClick={() =>
                        void run(async () => {
                          const result = await api<{
                            subject: string;
                            body: string;
                            content: string;
                            changes: string[];
                            warnings: string[];
                          }>("/api/hub/generate", {
                            application_id: draftApp,
                            resume_id: draftResume,
                            kind,
                            project_ids: selectedProjects,
                          });
                          if (kind === "tailor") {
                            setGeneratedResume(result.content);
                            setChanges([
                              ...result.changes,
                              ...result.warnings.map((w) => `Review: ${w}`),
                            ]);
                          } else {
                            setSubject(result.subject);
                            setEmailBody(result.body);
                          }
                        })
                      }
                    >
                      <Sparkles /> {busy ? "Working…" : "Generate with Gemini"}
                    </Button>
                    {!data.integrations.gemini && (
                      <button
                        className="text-sm text-primary ml-4"
                        onClick={() => open("settings")}
                      >
                        Add your API key
                      </button>
                    )}
                    {generatedResume && (
                      <div className="mt-6 space-y-4">
                        <p className="text-sm text-primary">
                          Review this draft against your original. AI edits are
                          not verified facts.
                        </p>
                        <ul className="text-xs text-white/60 list-disc ml-4 space-y-1">
                          {changes.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                        <textarea
                          aria-label="Review tailored resume"
                          disabled={busy}
                          className={`${textClass} min-h-96`}
                          value={generatedResume}
                          maxLength={60000}
                          onChange={(e) => setGeneratedResume(e.target.value)}
                        />
                        <Button
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await api("/api/hub/resumes/version", {
                                parent_id: draftResume,
                                application_id: draftApp,
                                content: generatedResume,
                              });
                              setGeneratedResume("");
                            }, "Reviewed resume version saved.")
                          }
                        >
                          Save reviewed version
                        </Button>
                      </div>
                    )}
                    {subject && kind !== "tailor" && (
                      <div className="mt-6 space-y-4">
                        <Input
                          aria-label="Email subject"
                          disabled={busy}
                          maxLength={300}
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                        <textarea
                          aria-label="Email body"
                          disabled={busy}
                          className={`${textClass} min-h-64`}
                          maxLength={12000}
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                        />
                        <Button
                          disabled={busy || !draftApp}
                          onClick={() =>
                            void run(async () => {
                              await api("/api/hub", {
                                action: "save_draft",
                                application_id: draftApp,
                                subject,
                                body: emailBody,
                              });
                              setSubject("");
                              setEmailBody("");
                            }, "Draft saved.")
                          }
                        >
                          Save edited draft
                        </Button>
                      </div>
                    )}
                  </section>
                  {data.drafts.map((draft) => (
                    <article key={draft.id} className={panel}>
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <h2 className="font-medium">{draft.subject}</h2>
                          <p className="text-xs text-white/40 mt-2">
                            {
                              data.applications.find(
                                (a) => a.id === draft.application_id,
                              )?.company
                            }{" "}
                            ·{" "}
                            {draft.sent_at
                              ? `Recorded sent ${date(draft.sent_at)}`
                              : "Draft · not sent"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void navigator.clipboard
                                .writeText(
                                  `Subject: ${draft.subject}\n\n${draft.body}`,
                                )
                                .then(
                                  () => toast.success("Copied."),
                                  () =>
                                    toast.error(
                                      "Could not copy. Select the text below.",
                                    ),
                                )
                            }
                          >
                            Copy
                          </Button>
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-white/15 p-2 text-xs text-primary"
                          >
                            Compose in Gmail ↗
                          </a>
                          <Button
                            size="sm"
                            disabled={busy || Boolean(draft.sent_at)}
                            onClick={() =>
                              void run(
                                () =>
                                  api("/api/hub", {
                                    action: "mark_sent",
                                    id: draft.id,
                                  }),
                                "Sent date recorded.",
                              )
                            }
                          >
                            I sent this
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-white/65 whitespace-pre-wrap mt-5">
                        {draft.body}
                      </p>
                    </article>
                  ))}
                </div>
              )}
              {view === "settings" && (
                <div className="space-y-6 max-w-3xl">
                  <section className={panel}>
                    <div className="flex gap-3 items-center">
                      <ShieldCheck className="text-primary w-5 h-5" />
                      <h2 className="font-medium">Your Gemini API key</h2>
                    </div>
                    <p className="text-sm text-white/45 mt-3">
                      {data.integrations.gemini
                        ? "Key connected. Replace or remove it below."
                        : "Add your key for cold emails and reviewed resume drafts."}{" "}
                      Keys are encrypted on the server and never returned to the
                      browser. Existing Analyze/Customize still use the
                      deployment&apos;s AI configuration.
                    </p>
                    <form
                      className="flex flex-wrap gap-3 mt-5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const pendingKey = key;
                        setKey("");
                        void run(
                          () =>
                            api("/api/hub/settings", {
                              action: "save_key",
                              key: pendingKey,
                            }),
                          "Gemini key saved.",
                        );
                      }}
                    >
                      <Input
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        aria-label="Gemini API key"
                        placeholder="Paste your Gemini key"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        maxLength={200}
                        required
                        className="sm:w-80"
                      />
                      <Button disabled={busy}>Save key</Button>
                      {data.integrations.gemini && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void run(
                              () =>
                                api("/api/hub/settings", {
                                  action: "remove_key",
                                }),
                              "Key removed.",
                            )
                          }
                        >
                          Remove key
                        </Button>
                      )}
                    </form>
                  </section>
                  <section className={panel}>
                    <h2 className="font-medium flex gap-3">
                      <Mail className="text-primary w-5 h-5" />
                      Gmail application replies
                    </h2>
                    <p className="text-sm text-white/45 mt-3">
                      Read-only access. Candidate messages from the last 90 days
                      are matched to saved companies. Only snippets are
                      retained; email content is not sent to Gemini. Review
                      suggested status changes in Applications.
                    </p>
                    {data.integrations.gmail ? (
                      <>
                        <p className="text-sm text-primary mt-4">
                          Connected: {data.integrations.gmail.email}
                        </p>
                        <p className="text-xs text-white/40 mt-2">
                          Last successful batch:{" "}
                          {data.integrations.gmail.last_sync_at
                            ? new Date(
                                data.integrations.gmail.last_sync_at,
                              ).toLocaleString("en-IN", {
                                timeZone: "Asia/Kolkata",
                              })
                            : "Not synced yet"}
                          .{" "}
                          {data.integrations.gmail.next_page
                            ? "More messages remain to scan."
                            : ""}
                        </p>
                        <div className="flex gap-3 mt-5">
                          <Button
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                const result = await api<{
                                  examined: number;
                                  hasMore: boolean;
                                }>("/api/hub/gmail", { action: "sync" });
                                toast.success(
                                  `Checked ${result.examined} messages.${result.hasMore ? " More remain; continue sync." : " Batch complete."}`,
                                );
                              })
                            }
                          >
                            {data.integrations.gmail.next_page
                              ? "Continue sync"
                              : "Sync replies"}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void run(
                                () =>
                                  api("/api/hub/gmail", {
                                    action: "disconnect",
                                  }),
                                "Gmail disconnected. Retained suggestions remain in Applications.",
                              )
                            }
                          >
                            Disconnect & revoke
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Button
                          className="mt-5"
                          disabled={busy || !data.integrations.gmailConfigured}
                          onClick={() =>
                            void run(async () => {
                              const result = await api<{ url: string }>(
                                "/api/hub/gmail/connect",
                                {},
                              );
                              window.location.assign(result.url);
                            })
                          }
                        >
                          Connect Gmail
                        </Button>
                        {!data.integrations.gmailConfigured && (
                          <p className="text-xs text-primary mt-3">
                            Deployment setup needed: Google OAuth credentials,
                            app origin, and server encryption key.
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-white/35 mt-5">
                      Use manual Sync now, or opt into background checks below
                      after the deployment scheduler is configured. Email
                      sending stays manual.
                    </p>
                  </section>
                  <section className={panel}>
                    <h2 className="font-medium">Daily rhythm</h2>
                    <p className="text-sm text-white/45 mt-3">
                      Timezone: Asia/Kolkata. Check-ins count once per calendar
                      day. Follow-ups appear after more than 10 days without
                      substantive contact; no response never means rejection.
                    </p>
                    <Link
                      className="text-sm text-primary block mt-4"
                      href="/profile"
                    >
                      Manage profile and GitHub project evidence →
                    </Link>
                  </section>
                </div>
              )}
              {view === "settings" && !preview && (
                <ExtensionSync applications={data.applications} />
              )}
              {view === "settings" && data.integrations.gmail && !preview && (
                <BackgroundSync
                  enabled={Boolean(data.integrations.gmail.background_sync)}
                  configured={data.integrations.backgroundConfigured}
                  error={data.integrations.gmail.background_error}
                  onRefresh={refresh}
                />
              )}
            </>
          )}
        </main>
      </div>
      {editing && (
        <ApplicationEditor
          application={editing}
          resumes={data?.resumes || []}
          busy={busy}
          preview={preview}
          close={() => {
            if (!busy) setEditing(null);
          }}
          onSubmit={saveApplication}
        />
      )}
      {active && (
        <Modal
          title={`${active.company} · ${active.role}`}
          close={() => setActive(null)}
        >
          <div className="space-y-5">
            <div className="flex gap-3 flex-wrap text-sm">
              <span className="text-primary">{pretty(active.status)}</span>
              <span className="text-white/40">{active.location}</span>
              {isFollowUpDue(active) && (
                <span className="text-primary">Follow-up due</span>
              )}
            </div>
            <p className="text-xs text-white/40">
              Applied {date(active.applied_at)} · Resume:{" "}
              {data?.resumes.find((r) => r.id === active.resume_id)?.name ||
                "Not recorded"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setEditing(active);
                  setActive(null);
                }}
              >
                Update details / status
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => startAnalysis(active, "analysis")}
              >
                Analyze
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => startAnalysis(active, "customize")}
              >
                Customize
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setDraftApp(active.id);
                  setDraftResume(active.resume_id || "");
                  setSubject("");
                  setEmailBody("");
                  setGeneratedResume("");
                  setKind(isFollowUpDue(active) ? "followup" : "email");
                  setActive(null);
                  open("outreach");
                }}
              >
                Draft outreach
              </Button>
              {active.job_url && (
                <a
                  className="text-sm text-primary p-2"
                  href={active.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open job ↗
                </a>
              )}
            </div>
            <details>
              <summary className="text-sm text-white/65 cursor-pointer">
                Job description
              </summary>
              <p className="text-sm text-white/50 whitespace-pre-wrap mt-3">
                {active.jd || "Add a job description to improve tailoring."}
              </p>
            </details>
            {active.notes && (
              <p className="text-sm text-white/60 whitespace-pre-wrap">
                {active.notes}
              </p>
            )}
            <section>
              <h3 className="text-sm font-medium mb-3">Status timeline</h3>
              <ol className="space-y-3">
                {data?.events
                  .filter((e) => e.application_id === active.id)
                  .map((e) => (
                    <li key={e.id} className="text-xs flex gap-4">
                      <span className="text-white/35">
                        {date(e.created_at)}
                      </span>
                      <span>{pretty(e.new_status)}</span>
                    </li>
                  ))}
              </ol>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
