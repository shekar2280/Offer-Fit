import React from "react";
import { DollarSign } from "lucide-react";
import { AnalysisInsights } from "../types";

interface MatchHeaderProps {
    score: number;
    verdict: string;
    position: string;
    companyName: string;
    isAnalyzing: boolean;
    insights: AnalysisInsights | null;
    strokeColorClass: string;
    verdictColorClass: string;
    bgColorClass: string;
}

export function MatchHeader({
    score,
    verdict,
    position,
    companyName,
    isAnalyzing,
    insights,
    strokeColorClass,
    verdictColorClass,
    bgColorClass
}: MatchHeaderProps) {
    return (
        <div className="relative overflow-hidden bg-white/[0.02] border border-primary/10 rounded-[2.5rem] p-6 md:p-8 group/header shadow-2xl">
            <div data-html2canvas-ignore className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none group-hover/header:bg-primary/20 transition-all duration-1000" />
            <div data-html2canvas-ignore className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                <div className="lg:col-span-3 flex justify-center lg:justify-start">
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center scale-110">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-110" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" className="fill-none stroke-white/5 stroke-[1]" />
                            <circle cx="50" cy="50" r="46" className={`fill-none stroke-[3] transition-all duration-1000 ${isAnalyzing ? 'stroke-primary/20 animate-pulse' : strokeColorClass}`} strokeDasharray={`${score * 2.89} 289`} strokeLinecap="round" />
                        </svg>
                        <div className="flex flex-col items-center">
                            {isAnalyzing && !insights ? (
                                <div className="h-12 w-16 bg-white/5 animate-pulse rounded-lg" />
                            ) : (
                                <span className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{score}</span>
                            )}
                            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/20 mt-1">Match</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                    <div className="space-y-3">
                        <div className="flex items-center justify-center lg:justify-start gap-4">
                            <div className="h-px w-12 bg-primary/40" />
                            <span className="text-[11px] font-mono uppercase tracking-[0.5em] text-primary font-black">
                                Match Summary
                            </span>
                        </div>
                        <h1 className="font-heading text-6xl md:text-8xl font-black text-white tracking-tight leading-[0.95]">
                            Hiring<br />
                            <span className="text-primary italic font-light">
                                Probability.
                            </span>
                        </h1>
                    </div>
                    <div className="flex flex-col space-y-2">
                        {isAnalyzing && !position ? (
                            <div className="h-6 w-48 bg-white/5 animate-pulse rounded mt-2" />
                        ) : (
                            <p className="text-white/60 text-lg font-medium tracking-tight">
                                {position}
                            </p>
                        )}
                        {isAnalyzing && !companyName ? (
                            <div className="h-4 w-32 bg-white/5 animate-pulse rounded mt-1" />
                        ) : (
                            <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
                                Target: {companyName}
                            </p>
                        )}
                        {!isAnalyzing && insights?.toolUsed && insights.toolUsed.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-3 justify-center lg:justify-start">
                                {insights.toolUsed.map((tool, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[9px] font-mono uppercase tracking-widest">
                                            {tool.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center space-y-6">
                    {isAnalyzing && !insights ? (
                        <div className="h-10 w-32 bg-white/5 animate-pulse rounded-full mb-2" />
                    ) : null}
                    <div className="flex flex-col items-center lg:items-end gap-3">
                        <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/20">Final Verdict</span>
                        {isAnalyzing && !insights ? (
                            <div className="h-10 w-24 bg-white/5 animate-pulse rounded-xl" />
                        ) : (
                            <div className={`relative px-6 py-2.5 rounded-xl border backdrop-blur-2xl transition-all duration-500 hover:scale-105 shadow-xl ${bgColorClass}`}>
                                <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                                <span className={`text-sm font-black uppercase tracking-[0.3em] drop-shadow-sm ${verdictColorClass}`}>
                                    {verdict}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
