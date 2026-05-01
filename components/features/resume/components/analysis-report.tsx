"use client";

import React from "react";
import { FileText, Download, Target, Activity, Search, AlertCircle, DollarSign, Copy, CheckCircle2, XCircle } from "lucide-react";
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
    downloadReport: () => void;
    mode?: "analysis" | "customize";
    onSwitchMode: (newMode: "analysis" | "customize") => void;
    isHistoryMode?: boolean;
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
}

export function AnalysisReport({
    analysis,
    isAnalyzing,
    loadingStep,
    loadingMessages,
    companyName,
    position,
    onReset,
    downloadReport,
    mode = "analysis",
    onSwitchMode,
    isHistoryMode = false,
    insights = null
}: AnalysisReportProps) {

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
            <div className="mt-16 mb-8 flex items-center gap-4 border-b border-white/5 pb-4">
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
                         <button 
                            onClick={() => copyText(String(children), "Code")}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/30 transition-all opacity-0 group-hover/code:opacity-100 backdrop-blur-xl"
                            title="Copy Code"
                         >
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2">Copy</span>
                         </button>
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

            <div className="bg-black/80 border border-white/15 ring-1 ring-primary/10 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl relative shadow-2xl overflow-hidden">
                <div className="absolute top-4 right-4 md:top-6 md:right-8 z-30 flex items-center gap-3">
                    {!isAnalyzing && (
                        <button 
                            onClick={() => onSwitchMode(mode === "analysis" ? "customize" : "analysis")}
                            className={`px-5 py-2 rounded-full border transition-all backdrop-blur-md group/mode ${mode === "analysis" ? "border-primary/30 bg-primary/10 hover:bg-primary/20" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.08]"}`}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${mode === "analysis" ? "text-primary" : "text-white/40 group-hover/mode:text-white"}`}>
                                {isHistoryMode 
                                    ? (mode === "analysis" ? "Show Customized Resume" : "Show Hiring Analysis")
                                    : (mode === "analysis" ? "Customize Resume" : "View Resume")
                                }
                            </span>
                        </button>
                    )}
                    {!isHistoryMode && (
                        <button 
                            onClick={onReset} 
                            className="px-5 py-2 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 transition-all group/reset backdrop-blur-md"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover/reset:text-white/80 transition-colors">
                                Reset
                            </span>
                        </button>
                    )}
                    <button 
                        onClick={downloadReport} 
                        disabled={isAnalyzing || !analysis} 
                        className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-primary/80 text-black font-black text-[10px] uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(242,170,76,0.3)] hover:shadow-[0_0_30px_rgba(242,170,76,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-2"
                    >
                        <Download className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{mode === "customize" ? "Download .tex" : "Download"}</span>
                    </button>
                </div>

                {!isAnalyzing && analysis && mode === "analysis" && (
                    <>
                        <div className="relative overflow-hidden bg-white/[0.02] border border-primary/10 rounded-[2.5rem] p-6 md:p-8 mb-8 mt-10 group/header">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none group-hover/header:bg-primary/20 transition-all duration-1000" />
                            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                                <div className="lg:col-span-3 flex justify-center lg:justify-start">
                                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-110" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="46" className="fill-none stroke-white/5 stroke-[1]" />
                                            <circle cx="50" cy="50" r="46" className={`fill-none stroke-[3] transition-all duration-1000 ${strokeColorClass}`} strokeDasharray={`${score * 2.89} 289`} strokeLinecap="round" />
                                        </svg>
                                        <div className="flex flex-col items-center">
                                            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{score}</span>
                                            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/20 mt-1">Match</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-center lg:justify-start gap-3">
                                            <div className="h-px w-8 bg-primary/30" />
                                            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary font-bold">
                                                Match Summary
                                            </span>
                                        </div>
                                        <h1 className="font-heading text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.85]">
                                            Hiring<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/20 italic font-light">
                                                Probability.
                                            </span>
                                        </h1>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-white/60 text-lg font-medium tracking-tight">
                                            {position}
                                        </p>
                                        <p className="text-white/20 text-xs font-mono uppercase tracking-widest">
                                            Target: {companyName}
                                        </p>
                                    </div>
                                </div>

                                <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center space-y-4">
                                    {insights?.salaryInsight && (
                                        <div className="flex flex-col items-center lg:items-end mb-2">
                                            <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/20 mb-2">Est. Market Rate</span>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                                                <DollarSign className="w-3 h-3" />
                                                <span className="text-[10px] font-black tracking-widest uppercase">{insights.salaryInsight.range}</span>
                                            </div>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-green-500/40 mt-1">{insights.salaryInsight.seniority} Level</span>
                                        </div>
                                    )}
                                    <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/20">Final Verdict</span>
                                    <div className={`relative px-5 py-2 rounded-xl border backdrop-blur-2xl transition-all duration-500 hover:scale-105 ${bgColorClass}`}>
                                        <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                                        <span className={`text-sm font-black uppercase tracking-[0.3em] drop-shadow-sm ${verdictColorClass}`}>
                                            {verdict}
                                        </span>
                                    </div>
                                    <div className="w-12 h-0.5 bg-white/5 rounded-full" />
                                </div>
                            </div>
                        </div>

                        {skillGaps.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
                                {skillGaps.map((gap, i) => (
                                    <div key={i} className="bg-white/[0.02] border border-primary/10 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 hover:bg-white/[0.04] hover:border-primary/30 transition-all group">
                                        <div className="relative w-20 h-20 flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="42" className="fill-none stroke-white/5 stroke-[3]" />
                                                <circle cx="50" cy="50" r="42" className="fill-none stroke-primary stroke-[4] group-hover:stroke-[6] transition-all" strokeDasharray={`${gap.score * 2.64} 264`} strokeLinecap="round" />
                                            </svg>
                                            <span className="text-xl font-bold text-white">{gap.score}%</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/60">{gap.label}</h4>
                                            <div className="h-0.5 w-4 bg-primary/20 mx-auto rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {insights && (mode === "analysis") && (
                            <div className="mb-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">ATS Score</span>
                                            <span className="text-sm font-black text-white">{insights.atsScore}<span className="text-white/20 text-xs">/100</span></span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${insights.atsScore}%`,
                                                    background: insights.atsScore >= 70 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : insights.atsScore >= 45 ? 'linear-gradient(90deg, #fbbf24, #d97706)' : 'linear-gradient(90deg, #ef4444, #b91c1c)'
                                                }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-medium tracking-wide">Keyword match against JD</p>
                                    </div>

                                    <div className="bg-slate-900/20 border border-slate-800/50 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Keyword Density</span>
                                            <span className="text-sm font-black text-slate-200">{insights.keywordDensity}<span className="text-slate-600 text-xs">/100</span></span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-900/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${insights.keywordDensity}%`,
                                                    background: insights.keywordDensity >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : insights.keywordDensity >= 45 ? 'linear-gradient(90deg, #fbbf24, #d97706)' : 'linear-gradient(90deg, #ef4444, #b91c1c)'
                                                }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-medium tracking-wide">Language mirror score</p>
                                    </div>
                                </div>

                                {insights.matchedSkills.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px w-4 bg-emerald-400/50" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Matched Expertise</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {insights.matchedSkills.map((skill, i) => (
                                                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-500/20 transition-all group/skill backdrop-blur-md cursor-default">
                                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 group-hover/skill:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/90 group-hover/skill:text-emerald-300 transition-colors">{skill}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {insights.missingSkills.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px w-4 bg-rose-400/50" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Gaps to Bridge</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {insights.missingSkills.map((skill, i) => (
                                                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 hover:border-rose-400 hover:bg-rose-500/20 transition-all group/gap backdrop-blur-sm cursor-default">
                                                    <XCircle className="w-2.5 h-2.5 text-rose-400 group-hover/gap:scale-110 transition-transform" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/90 group-hover/gap:text-rose-300 transition-colors">{skill}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {insights.redFlags && insights.redFlags.length > 0 && (
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-4 shadow-[0_0_50px_-12px_rgba(239,68,68,0.1)]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className="block text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Critical Hiring Red Flags</span>
                                                <p className="text-[9px] font-medium text-red-500/40 uppercase tracking-widest">Immediate points of concern for this role</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {insights.redFlags.map((flag, i) => (
                                                <div key={i} className="flex items-start gap-3 text-[12px] text-red-400/80 italic leading-relaxed bg-red-500/[0.02] p-3 rounded-xl border border-red-500/5">
                                                    <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                                    {flag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {insights.interviewQuestions && insights.interviewQuestions.length > 0 && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Predicted Interview Questions</span>
                                            <Target className="w-4 h-4 text-primary/40" />
                                        </div>
                                        <div className="space-y-4">
                                            {insights.interviewQuestions.map((iq, i) => (
                                                <div key={i} className="group/q bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl p-4 transition-all">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <p className="text-sm font-medium text-white/80 leading-relaxed italic">"{iq.q}"</p>
                                                        <button 
                                                            onClick={() => copyText(iq.q, "Question")}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-white/20 hover:text-primary transition-all shrink-0"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="h-px w-4 bg-primary/30" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">Hiring Intent: {iq.intent}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {insights.outreachEmail && (
                                    <div className="relative group/email overflow-hidden rounded-2xl bg-primary/[0.03] border border-primary/20 p-6 space-y-4">
                                        <div className="absolute top-0 right-0 p-4">
                                            <button 
                                                onClick={() => copyText(insights.outreachEmail!, "Outreach Email")}
                                                className="px-4 py-2 rounded-lg bg-primary text-black text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Copy className="w-3 h-3" />
                                                Copy Draft
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Strategic Outreach Draft</span>
                                            <p className="text-[9px] text-primary/40 font-mono uppercase tracking-widest">Tailored to hiring manager profile</p>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 whitespace-pre-wrap text-sm text-white/60 leading-relaxed font-serif italic">
                                            {insights.outreachEmail}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {mode === "customize" && !isAnalyzing && analysis && (
                    <div className="mb-12 mt-16 text-center lg:text-left">
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
                )}

                <div className="relative z-10 w-full">
                    {isAnalyzing ? (
                        <div className="space-y-12 animate-pulse w-full">
                            <div className="space-y-4">
                                <div className="h-8 w-1/3 bg-white/5 rounded-lg" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-white/[0.02] rounded" />
                                    <div className="h-4 w-5/6 bg-white/[0.02] rounded" />
                                    <div className="h-4 w-4/6 bg-white/[0.02] rounded" />
                                </div>
                            </div>
                            <div className="space-y-8 py-12 flex flex-col items-center">
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border-2 border-primary/5 animate-ping" />
                                    <FileText className="w-10 h-10 text-white/20" />
                                    <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                                        <Search className="w-6 h-6 text-primary drop-shadow-[0_0_10px_rgba(242,170,76,0.4)]" />
                                    </div>
                                </div>
                                <div className="space-y-4 text-center">
                                    <div className="h-px w-64 bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-auto" />
                                    <div className="text-[10px] font-mono uppercase tracking-[0.5em] text-primary/40 animate-pulse">
                                        {mode === "customize" ? "Customizing your resume..." : "Analyzing your background..."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : analysis && (
                        <div className={mode === "customize" ? "mt-4" : ""}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                                {mode === "customize" ? `\`\`\`latex\n${analysis}\n\`\`\`` : cleanAnalysis}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
