"use client";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { companies } from "@/lib/hub/companies";
import { type Application } from "@/lib/hub/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const panel = "rounded-2xl border border-white/[0.08] bg-[#101820]/50 p-5";
const selectClass =
  "rounded-lg border border-white/15 bg-[#101820] px-3 py-2 text-sm focus:ring-2 focus:ring-primary";
export function CompanyDirectory({
  applications,
  onSave,
}: {
  applications: Application[];
  onSave: (name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [signal, setSignal] = useState("all");
  const [shown, setShown] = useState(24);
  const tracked = new Set(applications.map((a) => a.company.toLowerCase()));
  const filtered = companies.filter(
    (c) =>
      `${c.name} ${c.sector} ${c.location || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (category === "all" || c.category === category) &&
      (signal === "all" ||
        (signal === "recent-yc" && c.yc_batch?.includes("2026")) ||
        (signal === "funded" &&
          c.funding_date &&
          Date.now() - Date.parse(c.funding_date) <= 180 * 86400000) ||
        (signal === "tracked" && tracked.has(c.name.toLowerCase()))),
  );
  return (
    <div className="space-y-5">
      <section className={`${panel} border-primary/20`}>
        <h2 className="font-medium">Find your first engineering role</h2>
        <p className="text-sm text-white/45 mt-2">
          Source-checked career destinations. Review each role for 0-YOE
          experience and India eligibility. A funding announcement or YC batch
          does not establish fresher hiring.
        </p>
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-primary">
          <a
            href="https://www.ycombinator.com/jobs/role/all/india"
            target="_blank"
            rel="noopener noreferrer"
          >
            YC India jobs ↗
          </a>
          <a
            href="https://www.ycombinator.com/companies/location/india/hiring"
            target="_blank"
            rel="noopener noreferrer"
          >
            YC India hiring directory ↗
          </a>
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/35" />
          <Input
            className="pl-9"
            aria-label="Search companies"
            placeholder="Company, sector, or location…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShown(24);
            }}
          />
        </div>
        <select
          aria-label="Company category"
          className={selectClass}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setShown(24);
          }}
        >
          <option value="all">All categories</option>
          {[...new Set(companies.map((c) => c.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          className={selectClass}
          aria-label="Company signal"
          value={signal}
          onChange={(e) => {
            setSignal(e.target.value);
            setShown(24);
          }}
        >
          <option value="all">All signals</option>
          <option value="recent-yc">YC 2026 batches</option>
          <option value="funded">Funding announced · last 180 days</option>
          <option value="tracked">Already tracked</option>
        </select>
      </div>
      <p className="text-xs text-white/40">
        {filtered.length} of {companies.length} destinations ·{" "}
        {Math.min(shown, filtered.length)} shown
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.slice(0, shown).map((c) => (
          <article key={c.id} className={`${panel} flex flex-col`}>
            <div className="flex justify-between gap-2">
              <h2 className="font-semibold">{c.name}</h2>
              <span className="text-[10px] text-primary rounded-full bg-primary/10 px-2 py-1 shrink-0 self-start">
                {c.category}
              </span>
            </div>
            <p className="text-sm text-white/45 mt-3 flex-1">{c.sector}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {c.yc_batch && (
                <span className="text-xs text-primary">YC {c.yc_batch}</span>
              )}
              {tracked.has(c.name.toLowerCase()) && (
                <span className="text-xs text-white/60">
                  Application tracked
                </span>
              )}
            </div>
            {c.funding_date && c.funding_source && (
              <a
                className="text-xs text-primary mt-3"
                href={c.funding_source}
                target="_blank"
                rel="noopener noreferrer"
              >
                Funding announcement · {c.funding_date} ↗
              </a>
            )}
            <p className="text-xs text-white/35 mt-4">
              Checked {c.checked_at} · {c.verification}
            </p>
            <p className="text-xs text-white/35 mt-1">{c.hiring_note}</p>
            <div className="flex gap-3 mt-5 pt-4 border-t border-white/5">
              <a
                className="text-primary text-sm flex gap-1 items-center"
                href={c.careers_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Careers <ArrowUpRight className="w-4 h-4" />
              </a>
              <button
                className="ml-auto text-sm text-white/55 hover:text-primary"
                onClick={() => onSave(c.name)}
              >
                Save a role
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="text-sm text-white/50 py-12 text-center">
          No companies match these filters. Try a broader search.
        </p>
      )}
      {shown < filtered.length && (
        <Button variant="outline" onClick={() => setShown(shown + 24)}>
          Show 24 more
        </Button>
      )}
    </div>
  );
}
