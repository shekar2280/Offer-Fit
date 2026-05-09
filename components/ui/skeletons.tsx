import React from "react";

export function SkeletonBar({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`skeleton-shimmer rounded-lg bg-white/[0.04] ${className}`}
    />
  );
}

export function SkeletonBlock({
  className = "",
  style = {},
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`skeleton-shimmer rounded-[1.5rem] bg-white/[0.04] ${className}`}
    />
  );
}

export function MatchHeaderSkeleton() {
  return (
    <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-3 flex justify-center lg:justify-start">
          <div className="skeleton-shimmer w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-white/[0.04]" />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <SkeletonBar className="w-24 h-3" />
          <SkeletonBar className="w-56 h-10" />
          <SkeletonBar className="w-40 h-10" />
          <SkeletonBar className="w-48 h-5 mt-2" />
          <SkeletonBar className="w-32 h-3" />
        </div>

        <div className="lg:col-span-3 flex flex-col items-end gap-4">
          <SkeletonBar className="w-8 h-3" />
          <SkeletonBlock className="w-28 h-10" />
          <div className="flex gap-2 mt-2">
            <SkeletonBlock className="w-20 h-7" />
            <SkeletonBlock className="w-16 h-7" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-5 h-full flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start gap-4">
        <SkeletonBar className="w-20 h-3" />
        <SkeletonBar className="w-12 h-8" />
      </div>
      <div className="space-y-3">
        <SkeletonBar className="w-full h-1" />
        <SkeletonBar className="w-24 h-3" />
      </div>
    </div>
  );
}

export function ScoreMetricsSkeleton() {
  return (
    <>
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </>
  );
}

export function CompanyIntelligenceSkeleton() {
  return (
    <div className="relative overflow-hidden bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-6">
          <SkeletonBlock className="w-36 h-8" />
          <SkeletonBar className="w-16 h-14" />
          <div className="flex flex-wrap gap-2">
            {[80, 64, 96, 72].map((w, i) => (
              <SkeletonBlock key={i} style={{ width: w }} className="h-7" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-8 space-y-6">
          <SkeletonBar className="w-40 h-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBar key={i} className="w-full h-5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkillsViewSkeleton() {
  return (
    <div className="space-y-12 py-4">
      {[0, 1].map((section) => (
        <div key={section} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-6 bg-white/10" />
            <SkeletonBar className="w-32 h-3" />
          </div>
          <div className="flex flex-wrap gap-3">
            {[90, 70, 110, 80, 95, 65].map((w, i) => (
              <SkeletonBlock key={i} style={{ width: w }} className="h-9" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalysisReportSkeleton() {
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between py-3">
        <SkeletonBar className="w-32 h-5" />
        <div className="flex gap-2">
          <SkeletonBlock className="w-28 h-9" />
          <SkeletonBlock className="w-28 h-9" />
        </div>
      </div>

      <div className="bg-black/60 border border-primary/20 rounded-[2.5rem] p-6 md:p-8 space-y-10">
        <MatchHeaderSkeleton />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreMetricsSkeleton />
        </div>

        <CompanyIntelligenceSkeleton />
        <SkillsViewSkeleton />

        <div className="border-t border-white/5 pt-8 space-y-4">
          {[100, 85, 92, 70, 88, 60].map((w, i) => (
            <SkeletonBar key={i} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CustomizeReportSkeleton() {
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between py-3">
        <SkeletonBar className="w-32 h-5" />
        <SkeletonBlock className="w-28 h-9" />
      </div>
      <div className="bg-black/60 border border-primary/20 rounded-[2.5rem] p-6 md:p-8 space-y-8">
        <div className="space-y-4">
          <SkeletonBar className="w-48 h-16" />
          <SkeletonBar className="w-40 h-12" />
          <SkeletonBar className="w-56 h-6" />
        </div>
        <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-8 space-y-3 min-h-[400px]">
          {Array.from({ length: 18 }, (_, i) => (
            <SkeletonBar
              key={i}
              className="h-3.5"
              style={{ width: `${55 + Math.sin(i * 1.7) * 35}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HistoryCardSkeleton() {
  return (
    <div
      className="rounded-[2rem] p-6 flex flex-col justify-between min-h-[220px]"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.4) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-9 h-9" />
          <SkeletonBar className="w-20 h-3" />
        </div>
        <SkeletonBar className="w-3/4 h-6" />
        <SkeletonBar className="w-1/2 h-4" />
      </div>
      <div className="space-y-2.5 mt-6">
        <SkeletonBlock className="w-full h-11" />
        <SkeletonBlock className="w-full h-11" />
      </div>
    </div>
  );
}

export function HistoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }, (_, i) => (
        <HistoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
