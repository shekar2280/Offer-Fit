"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  ScanText,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { isFollowUpDue, terminalStatuses } from "@/lib/hub/domain";
import type { HubData } from "@/components/features/hub/job-hub";
import type { HistoryAnalysisItem } from "@/types";

const panel = "rounded-2xl border border-white/[0.08] bg-[#101820]/40";
const action =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

export function DashboardOverview({
  user,
  hubEnabled,
}: {
  user: User;
  hubEnabled: boolean;
}) {
  const history = useQuery({
    queryKey: ["dashboard-history", user.id],
    queryFn: async () => {
      const db = createClient();
      const [recent, tailored] = await Promise.all([
        db
          .from("analyses")
          .select("id,company_name,position,created_at", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(5),
        db
          .from("analyses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .not("customized_latex", "is", null)
          .neq("customized_latex", ""),
      ]);
      if (recent.error || tailored.error)
        throw new Error("Saved analyses could not be loaded.");
      return {
        recent: recent.data as HistoryAnalysisItem[],
        total: recent.count ?? 0,
        tailored: tailored.count ?? 0,
      };
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });
  const profile = useQuery({
    queryKey: ["dashboard-profile", user.id],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("profiles")
        .select("resume_text")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw new Error("Resume readiness could not be loaded.");
      return Boolean(data?.resume_text?.trim());
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });
  const hub = useQuery<HubData>({
    queryKey: ["job-hub"],
    queryFn: async () => {
      const response = await fetch("/api/hub", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Applications could not be loaded.");
      return data;
    },
    enabled: hubEnabled,
    retry: false,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });
  const applications = hub.data?.applications ?? [];
  const due = applications.filter((application) => isFollowUpDue(application));
  const active = applications.filter(
    (application) => !terminalStatuses.includes(application.status),
  );
  const username =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";
  const historyValue = (value?: number) =>
    history.isPending ? "…" : history.isError ? "—" : String(value ?? 0);
  const hubValue = (value: number) =>
    !hubEnabled || hub.isError ? "—" : hub.isPending ? "…" : String(value);

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">
            Your career workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next move, {username}.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
            Turn a promising role into a prepared application. Assess your fit,
            refine your resume, and keep your next steps in view.
          </p>
        </div>
        <Link
          href="/analyze"
          className={`${action} shrink-0 bg-primary text-black hover:bg-primary/90`}
        >
          <Sparkles className="h-4 w-4" />
          New analysis
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>

      <section
        aria-label="Workspace metrics"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          {
            label: "Completed analyses",
            value: historyValue(history.data?.total),
            hint: "Saved fit assessments",
            icon: ScanText,
          },
          {
            label: "Tailored analyses",
            value: historyValue(history.data?.tailored),
            hint: "With a saved LaTeX output",
            icon: FileText,
          },
          {
            label: "Active opportunities",
            value: hubValue(active.length),
            hint: "Saved through offer stages",
            icon: BriefcaseBusiness,
          },
          {
            label: "Follow-ups due",
            value: hubValue(due.length),
            hint: "Based on recorded application dates",
            icon: Clock3,
          },
        ].map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className={`${panel} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-2 text-white/55">
              <span className="text-xs sm:text-sm">{label}</span>
              <Icon className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <p className="mt-4 text-3xl font-semibold" aria-live="polite">
              {value}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/35">{hint}</p>
          </div>
        ))}
      </section>

      <section
        aria-label="Prepare an application"
        className="grid gap-4 md:grid-cols-2"
      >
        {[
          {
            href: "/analyze",
            step: "01 / Understand the role",
            title: "Find your fit",
            description:
              "Compare your resume with a job description. Review matched skills, gaps, and the reasoning behind your fit assessment.",
            label: "Analyze a job description",
            icon: ScanText,
          },
          {
            href: "/customize",
            step: "02 / Make your evidence count",
            title: "Tailor with confidence",
            description:
              "Build a role-specific resume from your experience and project evidence, then review the integrity audit before exporting.",
            label: "Open tailoring studio",
            icon: FileText,
          },
        ].map(({ href, step, title, description, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`${panel} group p-6 transition-colors hover:border-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:p-8`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary">{step}</span>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/45">
              {description}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm text-primary">
              {label}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className={`${panel} p-5 sm:p-6`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Recent analyses</h2>
            <Link
              href="/history"
              className="text-sm text-primary hover:underline"
            >
              View history
            </Link>
          </div>
          {history.isPending ? (
            <p role="status" className="py-8 text-sm text-white/45">
              Loading your saved work…
            </p>
          ) : history.isError ? (
            <div role="alert" className="py-5 text-sm text-white/55">
              <p>{history.error.message}</p>
              <button
                onClick={() => void history.refetch()}
                className="mt-3 text-primary underline"
              >
                Retry
              </button>
            </div>
          ) : history.data?.recent.length ? (
            <ul className="divide-y divide-white/[0.06]">
              {history.data.recent.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/analyze?id=${encodeURIComponent(item.id)}`}
                    className="flex items-center justify-between gap-4 rounded-lg py-4 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-primary"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.position || "Resume analysis"}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/45">
                        {item.company_name || "Company not specified"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-white/40">
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8">
              <p className="text-sm text-white/65">
                Your first analysis starts here.
              </p>
              <p className="mt-2 text-sm leading-6 text-white/40">
                Choose a role and compare it with your resume. Your completed
                work will appear in this list.
              </p>
              <Link
                href="/analyze"
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                Run your first analysis →
              </Link>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className={`${panel} p-5 sm:p-6`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Your next steps</h2>
              <Link
                href="/hub"
                className="text-sm text-primary hover:underline"
              >
                Open tracker
              </Link>
            </div>
            {!hubEnabled ? (
              <p className="text-sm leading-6 text-white/45">
                Application summaries are not enabled for this deployment. Open
                the tracker to check its availability.
              </p>
            ) : hub.isPending ? (
              <p role="status" className="text-sm text-white/45">
                Loading application updates…
              </p>
            ) : hub.isError ? (
              <div role="alert">
                <p className="text-sm text-white/65">
                  Application summaries are unavailable.
                </p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  {hub.error.message} You can continue analyzing and tailoring
                  resumes.
                </p>
                <button
                  onClick={() => void hub.refetch()}
                  className="mt-3 text-sm text-primary underline"
                >
                  Retry connection
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm leading-6 text-white/45">
                  {due.length
                    ? `${due.length} recorded applications need a follow-up.`
                    : "No follow-ups are due based on your recorded dates."}
                </p>
                <ul className="mt-3 space-y-2">
                  {due.slice(0, 3).map((application) => (
                    <li key={application.id}>
                      <Link
                        href="/hub?view=applications"
                        className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] p-3 text-sm hover:bg-white/[0.06]"
                      >
                        <span className="min-w-0 truncate">
                          {application.company} · {application.role}
                        </span>
                        <Clock3 className="h-4 w-4 shrink-0 text-primary" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/hub?view=applications"
                  className="mt-4 inline-block text-sm text-primary hover:underline"
                >
                  {applications.length
                    ? "Review your pipeline →"
                    : "Save your first role →"}
                </Link>
                {applications.length >= 500 && (
                  <p className="mt-3 text-xs text-white/35">
                    Summaries cover the 500 most recently updated opportunities.
                  </p>
                )}
              </>
            )}
          </section>
          <section className={`${panel} p-5 sm:p-6`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-medium">Resume readiness</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/45">
              {profile.isPending
                ? "Checking your saved resume…"
                : profile.isError
                  ? profile.error.message
                  : profile.data
                    ? "Your resume text is saved. Keep your profile and project evidence current for your next analysis."
                    : "Add your resume to your profile to give every analysis a reliable starting point."}
            </p>
            {profile.isError && (
              <button
                onClick={() => void profile.refetch()}
                className="mt-3 block text-sm text-primary underline"
              >
                Retry readiness check
              </button>
            )}
            <Link
              href="/profile"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Review profile & evidence →
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
