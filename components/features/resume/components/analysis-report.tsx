"use client";

import React, { useEffect } from "react";
import { FileText, Target, Activity, Search, AlertCircle, DollarSign, Copy, CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnalysisReportProps {
    analysis: string;
    isAnalyzing: boolean;
    loadingStep: number;
    loadingMessages: string[];
    companyName: string;
    position: string;
    onReset: () => void;
    mode?: "analysis" | "customize";
    onSwitchMode: (newMode: "analysis" | "customize") => void;
    isHistoryMode?: boolean;
    hasCustomization?: boolean;
    insights?: { 
        matchScore?: number;
        verdict?: string;
        atsScore: number; 
        keywordDensity: number; 
        matchedSkills: string[]; 
        missingSkills: string[];
        salaryInsight?: { range: string; currency: string; seniority: string };
        redFlags?: string[];
        interviewQuestions?: { q: string; intent: string }[];
        outreachEmail?: string;
    } | null;
    serverError?: string | null;
}

export function AnalysisReport({
    analysis,
    isAnalyzing,
    loadingStep,
    loadingMessages,
    companyName,
    position,
    onReset,
    mode = "analysis",
    onSwitchMode,
    isHistoryMode = false,
    hasCustomization = false,
    insights = null,
    serverError = null
}: AnalysisReportProps) {

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [mode]);

    const matchScoreMatch = analysis.match(/OVERALL STRATEGIC MATCH:?\s*\[?(\d+)\]?%/i);
    const score = insights?.matchScore ?? (matchScoreMatch ? parseInt(matchScoreMatch[1]) : 0);

    const verdictMatch = analysis.match(/VERDICT:?\s*\[?(APPLY|STRETCH|PASS)\]/i);
    const verdict = (insights?.verdict && ["APPLY","STRETCH","PASS"].includes(insights.verdict))
        ? insights.verdict
        : (verdictMatch ? verdictMatch[1].toUpperCase() : (score > 75 ? "APPLY" : score > 50 ? "STRETCH" : "PASS"));

    const skillGaps: { label: string, score: number }[] = [];
    const skillGapSection = analysis.match(/## 🎯 SKILL GAP ANALYSIS\n([\s\S]*?)(?=\n##|$)/i);
    if (skillGapSection) {
        const lines = skillGapSection[1].split('\n');
        lines.forEach(line => {
            const m = line.match(/\*\*?(.*?)\*\*?:\s*\[?(\d+)\]?%/i);
            if (m) {
                skillGaps.push({ label: m[1], score: parseInt(m[2]) });
            }
        });
    }

    const cleanAnalysis = analysis
        .replace(/#+ VERDICT:?\s*\[?[A-Z]+\]?/i, "")
        .replace(/#+ OVERALL STRATEGIC MATCH:?\s*\[?\d+\]?%/i, "")
        .replace(/## 🎯 SKILL GAP ANALYSIS\n([\s\S]*?)(?=\n##|$)/i, "")
        .trim();

    let verdictColorClass = 'text-primary';
    let strokeColorClass = 'stroke-primary';
    let bgColorClass = 'bg-primary/20 border-primary/30';

    if (verdict === 'STRETCH') {
        verdictColorClass = 'text-yellow-400';
        strokeColorClass = 'stroke-yellow-400';
        bgColorClass = 'bg-yellow-400/20 border-yellow-400/30';
    } else if (verdict === 'PASS') {
        verdictColorClass = 'text-destructive';
        strokeColorClass = 'stroke-destructive';
        bgColorClass = 'bg-destructive/20 border-destructive/30';
    }

    const copyText = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    const customComponents: Components = {
        h2: ({ node, ...props }) => (
            <div className="mt-8 mb-8 flex items-center gap-4 border-b border-white/5 pb-4">
                <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(242,170,76,0.5)]"></div>
                <h2 className="text-2xl font-heading font-bold text-white tracking-tight m-0" {...props} />
            </div>
        ),
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white/90 mt-8 mb-3 tracking-tight" {...props} />,
        ul: ({ node, ...props }) => <ul className="grid grid-cols-1 gap-3 my-4" {...props} />,
        li: ({ node, children, ...props }) => (
            <li className="bg-white/[0.01] border border-white/5 rounded-xl p-4 shadow-sm backdrop-blur-sm hover:border-primary/20 transition-all flex flex-col gap-1 group/item" {...props}>
                <div className="flex items-start gap-3">
                    <div className="mt-2 w-1 h-1 rounded-full bg-primary/40 group-hover/item:bg-primary transition-all shrink-0" />
                    <div className="text-white/60 leading-relaxed font-light text-[14px]">
                        {children}
                    </div>
                </div>
            </li>
        ),
        blockquote: ({ node, ...props }) => (
            <div className="my-8 relative overflow-hidden rounded-2xl bg-primary/[0.02] border border-white/10 p-6 shadow-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <blockquote className="relative z-10 text-base font-serif italic text-primary/90 leading-relaxed m-0" {...props} />
            </div>
        ),
        strong: ({ node, ...props }) => <strong className="font-bold text-white tracking-wide" {...props} />,
        p: ({ node, ...props }) => <p className="text-white/40 leading-[1.7] text-[15px] mb-4 font-light" {...props} />,
        code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[12px] border border-primary/10" {...props}>
                    {children}
                </code>
            ) : (
                <div className="relative group/code my-6">
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                         {mode !== "customize" && (
                             <button 
                                onClick={() => copyText(String(children), "Code")}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all opacity-0 group-hover/code:opacity-100 backdrop-blur-xl"
                                title="Copy Code"
                             >
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2">Copy</span>
                             </button>
                         )}
                    </div>
                    <pre className="bg-black/40 border border-white/5 rounded-xl p-6 overflow-x-auto font-mono text-[13px] text-white/70 no-scrollbar">
                        <code {...props}>{children}</code>
                    </pre>
                </div>
            )
        }
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto relative z-10 animate-in fade-in duration-1000">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 relative z-30 px-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${serverError ? 'bg-red-500' : 'bg-primary'} animate-pulse`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                        {serverError ? "Analysis Failed" : isAnalyzing ? "Scanning Resume" : "Analysis Complete"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {!isAnalyzing && (
                        <button 
                            onClick={() => onSwitchMode(mode === "analysis" ? "customize" : "analysis")}
                            className="min-w-[160px] h-10 px-6 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all backdrop-blur-md group/mode flex items-center justify-center"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                {mode === "analysis" 
                                    ? (hasCustomization ? "Show Customized Resume" : "Customize Resume") 
                                    : "Show Analysis Report"
                                }
                            </span>
                        </button>
                    )}
                    {!isHistoryMode && (
                        <button 
                            onClick={onReset} 
                            className="h-10 px-6 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 transition-all group/reset backdrop-blur-md flex items-center justify-center"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover/reset:text-white/80 transition-colors">
                                Reset
                            </span>
                        </button>
                    )}
                </div>
            </div>

            <div id="analysis-report-content" className="bg-black/80 border border-white/15 ring-1 ring-primary/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl relative shadow-2xl overflow-hidden mb-6">

                {serverError ? (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-12 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
                        <div className="w-20 h-20 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center relative z-10">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <h2 className="font-heading text-2xl font-bold text-white tracking-tight">System Overloaded</h2>
                            <p className="text-red-200/60 max-w-md mx-auto leading-relaxed">{serverError}</p>
                        </div>
                        <button 
                            onClick={onReset}
                            className="relative z-10 px-8 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <>
                        {(analysis || isAnalyzing) && mode === "analysis" && (
                            <div className="space-y-8">
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
                                    </div>
                                </div>

                                <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center space-y-6">
                                    {isAnalyzing && !insights ? (
                                        <div className="h-10 w-32 bg-white/5 animate-pulse rounded-full mb-2" />
                                    ) : insights?.salaryInsight ? (
                                        <div className="flex flex-col items-center lg:items-end">
                                            <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/20 mb-2">Est. Market Rate</span>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                                                <DollarSign className="w-3 h-3" />
                                                <span className="text-[10px] font-black tracking-widest uppercase">{insights.salaryInsight.range}</span>
                                            </div>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-green-500/40 mt-1">{insights.salaryInsight.seniority} Level</span>
                                        </div>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {isAnalyzing && !insights ? (
                                <>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 h-28 animate-pulse flex flex-col justify-between">
                                        <div className="h-3 w-16 bg-white/10 rounded" />
                                        <div className="h-1.5 w-full bg-white/5 rounded-full" />
                                        <div className="h-2 w-24 bg-white/5 rounded" />
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 h-28 animate-pulse flex flex-col justify-between">
                                        <div className="h-3 w-16 bg-white/10 rounded" />
                                        <div className="h-1.5 w-full bg-white/5 rounded-full" />
                                        <div className="h-2 w-24 bg-white/5 rounded" />
                                    </div>
                                </>
                            ) : insights ? (
                                <>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 hover:border-primary/20 transition-all">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">ATS Score</span>
                                            <span className="text-sm font-black text-white">{insights.atsScore}<span className="text-white/20 text-xs">/100</span></span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(242,170,76,0.2)]"
                                                style={{
                                                    width: `${insights.atsScore}%`,
                                                    background: insights.atsScore >= 70 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : insights.atsScore >= 45 ? 'linear-gradient(90deg, #fbbf24, #d97706)' : 'linear-gradient(90deg, #ef4444, #b91c1c)'
                                                }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-medium tracking-wide">Keyword match against JD</p>
                                    </div>

                                    <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-6 space-y-4 hover:border-primary/20 transition-all">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Keyword Density</span>
                                            <span className="text-sm font-black text-slate-200">{insights.keywordDensity}<span className="text-slate-600 text-xs">/100</span></span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                                style={{
                                                    width: `${insights.keywordDensity}%`,
                                                    background: insights.keywordDensity >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : insights.keywordDensity >= 45 ? 'linear-gradient(90deg, #fbbf24, #d97706)' : 'linear-gradient(90deg, #ef4444, #b91c1c)'
                                                }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-medium tracking-wide">Language mirror score</p>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        <div className="space-y-6">
                            {insights?.matchedSkills && insights.matchedSkills.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px w-6 bg-emerald-400/50" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Matched Expertise</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {insights.matchedSkills.map((skill, i) => (
                                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-400/30 hover:bg-emerald-500/10 transition-all group/skill backdrop-blur-md cursor-default">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400 group-hover/skill:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80 group-hover/skill:text-emerald-300 transition-colors">{skill}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {insights?.missingSkills && insights.missingSkills.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-px w-6 bg-rose-400/50" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400">Gaps to Bridge</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {insights.missingSkills.map((skill, i) => (
                                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/5 border border-rose-500/10 hover:border-rose-400/30 hover:bg-rose-500/10 transition-all group/gap backdrop-blur-sm cursor-default">
                                                <XCircle className="w-3 h-3 text-rose-400 group-hover/gap:scale-110 transition-transform" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80 group-hover/gap:text-rose-300 transition-colors">{skill}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {insights?.redFlags && insights.redFlags.length > 0 && (
                                <div className="bg-red-500/[0.03] border border-red-500/10 rounded-3xl p-6 space-y-4 shadow-[0_0_50px_-12px_rgba(239,68,68,0.1)]">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="block text-[12px] font-black uppercase tracking-[0.4em] text-red-500">Critical Hiring Red Flags</span>
                                            <p className="text-[10px] font-medium text-red-500/40 uppercase tracking-widest">Immediate points of concern for this role</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {insights.redFlags.map((flag, i) => (
                                            <div key={i} className="flex items-start gap-4 text-[13px] text-red-400/70 italic leading-relaxed bg-red-500/[0.02] p-4 rounded-2xl border border-red-500/5 hover:border-red-500/20 transition-all">
                                                <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                                {flag}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {insights?.interviewQuestions && insights.interviewQuestions.length > 0 && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <Target className="w-5 h-5 text-primary" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60">Predicted Interview Questions</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">High Probability</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {insights.interviewQuestions.map((iq, i) => (
                                            <div key={i} className="group/q bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl p-6 transition-all">
                                                <div className="flex justify-between items-start gap-6">
                                                    <p className="text-[15px] font-medium text-white/80 leading-relaxed italic">"{iq.q}"</p>
                                                    <button 
                                                        onClick={() => copyText(iq.q, "Question")}
                                                        className="p-2.5 rounded-xl bg-white/5 hover:bg-primary/20 text-white/20 hover:text-primary transition-all shrink-0"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="mt-4 flex items-center gap-3">
                                                    <div className="h-px w-6 bg-primary/30" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">Hiring Intent: {iq.intent}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {insights?.outreachEmail && (
                                <div className="relative group/email overflow-hidden rounded-3xl bg-primary/[0.03] border border-primary/20 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-primary">Strategic Outreach Draft</span>
                                            <p className="text-[10px] text-primary/40 font-mono uppercase tracking-widest">Tailored to hiring manager profile</p>
                                        </div>
                                        <button 
                                            onClick={() => copyText(insights.outreachEmail!, "Outreach Email")}
                                            className="px-5 py-2.5 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy Draft
                                        </button>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 whitespace-pre-wrap text-[14px] text-white/60 leading-relaxed font-serif italic shadow-inner">
                                        {insights.outreachEmail}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === "customize" && !isAnalyzing && analysis && (
                    <div className="mb-12 mt-16 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6">
                        <div className="text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                                <div className="h-px w-8 bg-primary/30" />
                            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary font-bold">Customization Result</span>
                            </div>
                            <h1 className="font-heading text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9]">
                                {companyName} <span className="italic font-light text-primary/50">Resume.</span>
                            </h1>
                            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">
                                AI-generated customization for this role
                            </p>
                        </div>
                        <button 
                            onClick={() => copyText(analysis, "LaTeX Code")}
                            className="px-8 py-4 rounded-2xl bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(242,170,76,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                        >
                            <Copy className="w-4 h-4" />
                            Copy LaTeX Code
                        </button>
                    </div>
                )}

                <div className="relative z-10 w-full mt-6 pt-6 border-t border-white/10">
                    {analysis && (
                        <div className="relative">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                                {mode === "customize" ? `\`\`\`latex\n${analysis}\n\`\`\`` : cleanAnalysis}
                            </ReactMarkdown>
                            {isAnalyzing && (
                                <span className="inline-block w-[2px] h-[1em] bg-primary ml-1 animate-[pulse_1s_infinite] align-middle" />
                            )}
                        </div>
                    )}

                    {isAnalyzing && !analysis && (
                        <div className="space-y-12 w-full py-12 flex flex-col items-center">
                            <div className="relative w-32 h-32">
                                <div className="absolute inset-0 rounded-full border-2 border-primary/5 animate-[spin_3s_linear_infinite]" />
                                <div className="absolute inset-2 rounded-full border-t-2 border-primary/20 animate-[spin_2s_linear_infinite]" />
                                <div className="absolute inset-4 rounded-full border-b-2 border-primary/40 animate-[spin_1.5s_linear_infinite]" />
                                
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                        <div className="relative bg-black/50 p-4 rounded-2xl border border-primary/20 backdrop-blur-xl">
                                            <FileText className="w-8 h-8 text-primary" />
                                            <div className="absolute -top-1 -right-1">
                                                <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
                                                <div className="absolute inset-0 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(242,170,76,1)]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 text-center max-w-xs">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-mono uppercase tracking-[0.5em] text-primary animate-pulse">
                                        Extracting Information
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                                    </div>
                                </div>
                                <p className="text-[11px] text-white/30 font-medium leading-relaxed italic">
                                    {mode === "customize" 
                                        ? "Architecting a high-conversion resume structure..." 
                                        : "Parsing deep experience patterns and market alignment..."}
                                </p>
                            </div>

                            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-[scan_2s_linear_infinite] pointer-events-none" />
                        </div>
                    )}
                </div>
                </>
                )}
            </div>
        </div>
    );
}
