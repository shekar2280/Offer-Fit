"use client";

import React from "react";
import { Copy, Activity, Coins } from "lucide-react";
import Image from "next/image";
import { AnalysisReportProps } from "./types";
import { ReportToolbar } from "./report/report-toolbar";
import { ErrorView } from "./report/error-view";
import { MatchHeader } from "./report/match-header";
import { CompanyIntelligence, EmailDraftSection, InterviewQuestions, RedFlags, SalaryInsight, ScoreMetrics, SkillsView, StrategyCard, AuditBadge } from "./report/insights-cards";

import { MarkdownViewer } from "./report/markdown-viewer";
import { LoadingScanning } from "./report/loading-scanning";

export function AnalysisReport(props: AnalysisReportProps) {
    const {
        analysis,
        isAnalyzing,
        companyName,
        position,
        analysisId = "",
        onReset,
        mode = "analysis",
        onSwitchMode,
        isHistoryMode = false,
        hasCustomization = false,
        insights = null,
        serverError = null,
        isEditingForm = false,
        onToggleForm = () => { }
    } = props;

    const score = insights?.match_score || 0;
    const verdict = insights?.verdict || (score > 75 ? "APPLY" : score > 50 ? "STRETCH" : "REJECT");

    const cleanAnalysis = (analysis || "")
        .replace(/\{[\s\S]*?"outreach_email"[\s\S]*?\}/g, "")
        .replace(/===JSON_START===[\s\S]*?===JSON_END===/g, "")
        .trim();

    let verdictColorClass = 'text-primary';
    let strokeColorClass = 'stroke-primary';
    let bgColorClass = 'bg-primary/20 border-primary/30';

    if (verdict === 'STRETCH') {
        verdictColorClass = 'text-yellow-400';
        strokeColorClass = 'stroke-yellow-400';
        bgColorClass = 'bg-yellow-400/20 border-yellow-400/30';
    } else if (verdict === 'PASS' || verdict === 'REJECT') {
        verdictColorClass = 'text-destructive';
        strokeColorClass = 'stroke-destructive';
        bgColorClass = 'bg-destructive/20 border-destructive/30';
    }

    const copyText = (text: string, _label: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto relative z-10 animate-in fade-in duration-1000">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[600px] h-[300px] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <ReportToolbar
                isAnalyzing={isAnalyzing}
                serverError={serverError}
                mode={mode}
                hasCustomization={hasCustomization}
                isHistoryMode={isHistoryMode}
                onSwitchMode={onSwitchMode}
                onReset={onReset}
                isEditingForm={isEditingForm}
                onToggleForm={onToggleForm}
                verdict={verdict}
                missingSkills={insights?.missing_skills}
                redFlags={insights?.red_flags}
            />

            <div id="analysis-report-content" className="bg-black/60 border border-primary/40 ring-1 ring-primary/20 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl relative shadow-[0_0_100px_-20px_rgba(242,170,76,0.15)] overflow-hidden mb-6">
                {serverError ? (
                    <ErrorView error={serverError} onReset={onReset} />
                ) : (
                    <>
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            {mode === "analysis" && (
                                <MatchHeader
                                    score={score}
                                    verdict={verdict}
                                    position={position}
                                    companyName={companyName}
                                    isAnalyzing={isAnalyzing}
                                    insights={insights}
                                    strokeColorClass={strokeColorClass}
                                    verdictColorClass={verdictColorClass}
                                    bgColorClass={bgColorClass}
                                />
                            )}

                            {mode === "analysis" && isAnalyzing && !analysis && (
                                <div className="py-8">
                                    <LoadingScanning mode={mode} />
                                </div>
                            )}

                            {analysis && mode === "analysis" && (
                                <>
                                    <div className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <ScoreMetrics insights={(insights || {}) as unknown as NonNullable<typeof insights>} />
                                            <SalaryInsight data={insights?.salary_insight} />
                                        </div>

                                        <CompanyIntelligence
                                            score={insights?.culture_fit_score}
                                            traits={insights?.culture_traits}
                                            content={insights?.company_cheat_sheet}
                                            companyName={companyName}
                                            intel={insights?.intel}
                                        />

                                        <div className="space-y-12">
                                            <SkillsView
                                                matched={insights?.matched_skills || []}
                                                missing={insights?.missing_skills || []}
                                            />

                                            <RedFlags flags={insights?.red_flags || []} />

                                            <InterviewQuestions
                                                data={{ questions: insights?.interview_questions || [] }}
                                                onCopy={copyText}
                                            />

                                        </div>
                                    </div>
                                    <div className="relative z-10 w-full mt-4 border-t border-white/5 space-y-12">
                                        <MarkdownViewer
                                            content={cleanAnalysis}
                                            mode={mode}
                                            isAnalyzing={isAnalyzing}
                                            onCopy={copyText}
                                        />

                                        <EmailDraftSection
                                            analysisId={analysisId}
                                            verdict={verdict}
                                            initialEmail={insights?.outreach_email}
                                        />
                                    </div>
                                </>
                            )}

                            {mode === "customize" && (
                                <div className="space-y-12 pb-24">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/5 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-6">
                                                {insights?.intel?.logo_url && (
                                                    <div className="relative w-16 h-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                                                        <Image
                                                            src={insights.intel.logo_url}
                                                            alt={companyName || "Logo"}
                                                            fill
                                                            unoptimized
                                                            className="object-contain p-0"
                                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                                        />
                                                    </div>
                                                )}
                                                <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.95] max-w-full">
                                                    <div className="truncate" title={companyName}>{companyName || "New Analysis"}</div>
                                                    <span className="text-primary italic font-light">
                                                        Resume.
                                                    </span>
                                                </h1>
                                            </div>
                                            <div className="flex flex-col space-y-1 pt-4">
                                                <p className="text-white/60 text-lg font-medium tracking-tight line-clamp-1">
                                                    {position || "Preparing tailored version..."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
                                            <div className="flex flex-col items-start md:items-end gap-2">
                                                <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/20">Final Verdict</span>
                                                <div className={`relative px-6 py-2.5 rounded-xl border backdrop-blur-2xl transition-all duration-500 hover:scale-105 shadow-xl ${bgColorClass}`}>
                                                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                                                    <span className={`text-sm font-black uppercase tracking-[0.3em] drop-shadow-sm ${verdictColorClass}`}>
                                                        {verdict}
                                                    </span>
                                                </div>
                                            </div>

                                            {insights?.total_tokens !== undefined && (
                                                <div className="flex items-center gap-4 pt-1">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 group/stat hover:border-primary/30 transition-colors">
                                                        <Activity className="w-3 h-3 text-white/40 group-hover/stat:text-primary transition-colors" />
                                                        <span className="text-[10px] font-mono text-white/40 group-hover/stat:text-white transition-colors">
                                                            {insights.total_tokens.toLocaleString()} <span className="text-[8px] opacity-50 uppercase tracking-tighter">tokens</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 group/stat hover:border-green-500/30 transition-colors">
                                                        <Coins className="w-3 h-3 text-white/40 group-hover/stat:text-green-500 transition-colors" />
                                                        <span className="text-[10px] font-mono text-white/40 group-hover/stat:text-white transition-colors">
                                                            ${insights.estimated_cost?.toFixed(4)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!analysis && (
                                        <div className="py-8">
                                            <LoadingScanning mode={mode} />
                                        </div>
                                    )}

                                    {analysis && (
                                        <div className="space-y-12">
                                            <StrategyCard strategy={insights?.strategy} verdict={verdict} />

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-px w-8 bg-primary/30" />
                                                        {(() => {
                                                            const isLatex = (analysis || "").includes("\\documentclass") || (analysis || "").includes("\\begin{document}");
                                                            return (
                                                                <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary font-bold">
                                                                    {isLatex ? "Tailored LaTeX Source" : "Tailored Plain-Text Resume"}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    {(() => {
                                                        const isLatex = (analysis || "").includes("\\documentclass") || (analysis || "").includes("\\begin{document}");
                                                        return (
                                                            <button
                                                                onClick={() => copyText(analysis.split("###")[0].trim(), isLatex ? "LaTeX Code" : "Resume")}
                                                                className="px-6 py-2 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/10 flex items-center gap-2"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                                Copy {isLatex ? "Code" : "Resume"}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>

                                                <AuditBadge audit={insights?.audit_report} />

                                                <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-8 overflow-hidden relative">
                                                    <pre className="text-[13px] font-mono text-white/70 leading-relaxed overflow-x-auto relative z-10">
                                                        {analysis.split("###")[0].trim()}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
