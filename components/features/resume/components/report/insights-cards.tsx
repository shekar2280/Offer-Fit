import React from "react";
import { CheckCircle2, XCircle, AlertCircle, Target, Copy, DollarSign } from "lucide-react";
import { AnalysisInsights } from "../types";

export function ScoreMetrics({ insights, isAnalyzing }: { insights: AnalysisInsights | null, isAnalyzing: boolean }) {
    if (isAnalyzing && !insights) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 rounded-2xl p-6 h-28 animate-pulse flex flex-col justify-between">
                    <div className="h-3 w-16 bg-white/10 rounded" />
                    <div className="h-1.5 w-full bg-white/5 rounded-full" />
                    <div className="h-2 w-24 bg-white/5 rounded" />
                </div>
                <div className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 rounded-2xl p-6 h-28 animate-pulse flex flex-col justify-between">
                    <div className="h-3 w-16 bg-white/10 rounded" />
                    <div className="h-1.5 w-full bg-white/5 rounded-full" />
                    <div className="h-2 w-24 bg-white/5 rounded" />
                </div>
            </div>
        );
    }

    if (!insights) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 rounded-2xl p-6 space-y-4 hover:border-white/10 hover:bg-white/[0.03] hover:shadow-[0_0_40px_-10px_rgba(242,170,76,0.1)] transition-all group/metric">
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

            <div className="bg-gradient-to-bl from-white/[0.02] to-transparent border border-white/5 rounded-2xl p-6 space-y-4 hover:border-white/10 hover:bg-white/[0.03] hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.1)] transition-all group/metric">
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
        </div>
    );
}

export function SkillsView({ matched, missing }: { matched: string[], missing: string[] }) {
    return (
        <div className="space-y-6">
            {matched.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px w-6 bg-emerald-400/50" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Matched Expertise</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {matched.map((skill, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-400/40 hover:bg-emerald-500/10 transition-all group/skill backdrop-blur-md cursor-default hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 group-hover/skill:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80 group-hover/skill:text-emerald-300 transition-colors">{skill}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {missing.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px w-6 bg-rose-400/50" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400">Gaps to Bridge</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {missing.map((skill, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/5 border border-rose-500/10 hover:border-rose-400/40 hover:bg-rose-500/10 transition-all group/gap backdrop-blur-sm cursor-default hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]">
                                <XCircle className="w-3 h-3 text-rose-400 group-hover/gap:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80 group-hover/gap:text-rose-300 transition-colors">{skill}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function RedFlags({ flags }: { flags: string[] }) {
    if (flags.length === 0) return null;
    return (
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
                {flags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-4 text-[13px] text-red-400/70 italic leading-relaxed bg-red-500/[0.02] p-4 rounded-2xl border border-red-500/5 hover:border-red-500/30 hover:bg-red-500/[0.05] hover:shadow-[0_0_30px_-10px_rgba(239,68,68,0.2)] transition-all">
                        <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                        {flag}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function InterviewQuestions({ questions, onCopy }: { questions: any[], onCopy: (text: string, label: string) => void }) {
    if (questions.length === 0) return null;
    return (
        <div className="bg-gradient-to-b from-primary/[0.01] to-transparent border border-white/5 rounded-3xl p-6 space-y-4">
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
                {questions.map((iq, i) => (
                    <div key={i} className="group/q bg-white/[0.01] hover:bg-white/[0.03] border-l-2 border-l-primary/30 border-y border-y-transparent border-r border-r-transparent hover:border-l-primary/60 hover:border-y-white/5 hover:border-r-white/5 rounded-r-2xl rounded-l-sm p-6 transition-all shadow-sm">
                        <div className="flex justify-between items-start gap-6">
                            <p className="text-[15px] font-medium text-white/80 leading-relaxed italic">"{iq.q}"</p>
                            <button 
                                onClick={() => onCopy(iq.q, "Question")}
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
    );
}

export function OutreachEmail({ email, onCopy }: { email: string, onCopy: (text: string, label: string) => void }) {
    return (
        <div className="relative group/email overflow-hidden rounded-3xl bg-primary/[0.03] border border-primary/20 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-primary">Strategic Outreach Draft</span>
                    <p className="text-[10px] text-primary/40 font-mono uppercase tracking-widest">Tailored to hiring manager profile</p>
                </div>
                <button 
                    onClick={() => onCopy(email, "Outreach Email")}
                    className="px-5 py-2.5 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Draft
                </button>
            </div>
            <div className="p-4 bg-black/40 hover:bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-all whitespace-pre-wrap text-[14px] text-white/60 leading-relaxed font-serif italic shadow-inner">
                {email}
            </div>
        </div>
    );
}

export function SalaryInsight({ data }: { data?: { range: string, currency: string, seniority: string, location?: string } }) {
    if (!data) return null;
    return (
        <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl p-6 flex items-center justify-between group/salary hover:bg-emerald-500/[0.05] transition-all">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover/salary:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">Estimated Salary Range</span>
                    <p className="text-xl font-bold text-white tracking-tight">{data.range} <span className="text-sm font-medium text-white/40">{data.currency}</span></p>
                </div>
            </div>
            <div className="text-right">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-white/20">Target Market</span>
                <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-tighter">{data.location || "Global"} • {data.seniority}</p>
            </div>
        </div>
    );
}

export function MarketTrends({ toolUsed }: { toolUsed?: string[] }) {
    if (!toolUsed || toolUsed.length === 0) return null;
    return (
        <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-indigo-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400/60">AI Research Insights</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {toolUsed.map((tool, i) => (
                    <div key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-black uppercase tracking-widest text-indigo-400/80">
                        Agent Used: {tool.replace(/_/g, ' ')}
                    </div>
                ))}
            </div>
        </div>
    );
}
