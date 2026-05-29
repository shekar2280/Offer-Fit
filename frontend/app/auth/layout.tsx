"use client";

import { useState } from "react";

const SUBTEXTS = {
  Compare: "Instantly analyze your resume against any target job description. Uncover critical matching keywords, formatting flaws, and role alignment metrics in real-time.",
  Optimize: "Fine-tune your resume with high-impact, AI-driven recommendations. Bridge critical skill gaps, elevate bullet points, and perfectly align with ATS filtering systems.",
  "Get Hired": "Generate tailored, impact-focused resumes and cover letters. Stand out to recruiters, pass automated screens, and secure maximum job offers."
} as const;

type TabType = keyof typeof SUBTEXTS;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("Compare");

  return (
    <div className="min-h-screen w-full flex font-sans overflow-hidden">

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#f2aa4c] via-[#f2aa4c] to-[#d9821e] flex-col justify-center p-14 xl:p-20 relative overflow-hidden select-none shrink-0 animate-in fade-in duration-500">

        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.08),transparent_70%)] pointer-events-none" />

        <div className="absolute -bottom-12 -right-12 w-[340px] h-[480px] bg-white/[0.08] rounded-2xl rotate-[12deg] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/10 pointer-events-none p-7 space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
          <div className="w-1/3 h-4 bg-black/15 rounded-sm" />
          <div className="w-full h-px bg-black/5" />
          <div className="space-y-2">
            <div className="w-full h-2 bg-black/10 rounded-sm" />
            <div className="w-5/6 h-2 bg-black/10 rounded-sm" />
            <div className="w-4/5 h-2 bg-black/10 rounded-sm" />
          </div>
          <div className="h-px w-full bg-black/5" />
          <div className="space-y-2">
            <div className="w-2/3 h-3.5 bg-black/15 rounded-sm" />
            <div className="w-full h-2 bg-black/10 rounded-sm" />
            <div className="w-11/12 h-2 bg-black/10 rounded-sm" />
          </div>
          <div className="h-px w-full bg-black/5" />
          <div className="space-y-2">
            <div className="w-1/2 h-3.5 bg-black/15 rounded-sm" />
            <div className="w-3/4 h-2 bg-black/10 rounded-sm" />
          </div>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="space-y-6">
            {(["Compare", "Optimize", "Get Hired"] as TabType[]).map((word) => (
              <h2
                key={word}
                onMouseEnter={() => setActiveTab(word)}
                className={`text-[4.5rem] xl:text-[5.5rem] font-black leading-none tracking-tighter transition-all duration-300 cursor-default select-none origin-left hover:translate-x-3 ${activeTab === word ? "text-white scale-[1.01]" : "text-black hover:text-white"
                  }`}
              >
                {word}.
              </h2>
            ))}
          </div>

          <div key={activeTab} className="max-w-md space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-sm font-semibold text-black/75 leading-relaxed min-h-[60px]">
              {SUBTEXTS[activeTab]}
            </p>

          </div>
        </div>

      </div>

      <div className="flex-1 bg-[#0a0a0a] flex flex-col justify-center items-center min-h-screen px-8 md:px-16 py-12 relative">

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f2aa4c]/20 to-transparent pointer-events-none" />

        <main className="w-full max-w-[400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>

      </div>

    </div>
  );
}
