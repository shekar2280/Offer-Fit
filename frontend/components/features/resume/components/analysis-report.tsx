"use client";

import React from "react";
import { Copy, Activity, Coins } from "lucide-react";
import Image from "next/image";
import { AnalysisReportProps } from "@/types";
import { ReportToolbar } from "./report/report-toolbar";
import { ErrorView } from "./report/error-view";
import { MatchHeader } from "./report/match-header";
import { CompanyIntelligence, InterviewQuestions, RedFlags, SalaryInsight, ScoreMetrics, SkillsView, StrategyCard, AuditBadge } from "./report/insights-cards";
import { UpskillingBridgeSection } from "./report/upskilling-bridge";
import { MarkdownViewer } from "./report/markdown-viewer";
import { LoadingScanning } from "./report/loading-scanning";
import { LatexDiffViewer } from "./report/latex-diff-viewer";

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
        onToggleForm = () => { },
        userName,
        hasLatexSource = false,
        originalLatex = null,
        hasAnalysis = false,
    } = props;

    const score = insights?.match_score || 0;
    const verdict = insights?.verdict || (score > 75 ? "APPLY" : score > 50 ? "STRETCH" : "REJECT");

    let cleanAnalysis = (analysis || "").trim();

    if (cleanAnalysis.includes("===JSON_START===")) {
        cleanAnalysis = cleanAnalysis.split("===JSON_START===")[0].trim();
    }
    if (cleanAnalysis.includes("===STRATEGY_START===")) {
        cleanAnalysis = cleanAnalysis.split("===STRATEGY_START===")[0].trim();
    }

    cleanAnalysis = cleanAnalysis.replace(/===JSON_START===[\s\S]*?(?:===JSON_END===|$)/g, "");
    cleanAnalysis = cleanAnalysis.replace(/===STRATEGY_START===[\s\S]*?(?:===STRATEGY_END===|$)/g, "");
    cleanAnalysis = cleanAnalysis.replace(/```json[\s\S]*?(?:```|$)/gi, "");
    cleanAnalysis = cleanAnalysis.replace(/\{[\s\S]*?("match_score"|"ats_score"|"verdict"|"red_flags"|"interview_questions"|"culture_fit_score"|"strategy_pillars"|"outreach_email")[\s\S]*?\}/gi, "");
    cleanAnalysis = cleanAnalysis
        .replace(/#+ PHASE \d:.*?\n/gi, "")
        .replace(/===JSON_START===/g, "")
        .replace(/===JSON_END===/g, "")
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
                hasLatexSource={hasLatexSource}
                hasAnalysis={hasAnalysis}
            />

            <div id="analysis-report-content" className="bg-black/60 border border-primary/40 ring-1 ring-primary/20 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl relative shadow-[0_0_100px_-20px_rgba(242,170,76,0.15)] overflow-hidden mb-6">
                {serverError ? (
                    <ErrorView error={serverError} onReset={onReset} />
                ) : (
                    <>
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            {mode === "analysis" && (
                                <>
                                    {analysis ? (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                            <div className="lg:col-span-9 h-full">
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
                                            </div>
                                            <div className="lg:col-span-3 flex flex-col gap-4 h-full justify-between">
                                                <ScoreMetrics insights={(insights || {}) as unknown as NonNullable<typeof insights>} compact={true} />
                                                <SalaryInsight data={insights?.salary_insight} compact={true} />
                                            </div>
                                        </div>
                                    ) : (
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
                                </>
                            )}

                            {mode === "analysis" && isAnalyzing && !analysis && (
                                <div className="py-8">
                                    <LoadingScanning
                                        mode={mode}
                                        companyName={companyName}
                                        position={position}
                                        userName={userName}
                                    />
                                </div>
                            )}

                            {analysis && mode === "analysis" && (
                                <>
                                    <div className="space-y-12">
                                        <SkillsView
                                            matched={insights?.matched_skills || []}
                                            missing={insights?.missing_skills || []}
                                        />

                                        <RedFlags flags={insights?.red_flags || []} />

                                        <CompanyIntelligence
                                            score={insights?.culture_fit_score}
                                            traits={insights?.culture_traits}
                                            content={insights?.company_cheat_sheet}
                                            companyName={companyName}
                                            intel={insights?.intel}
                                        />

                                        <div className="space-y-12">
                                            <InterviewQuestions
                                                data={{ questions: insights?.interview_questions || [] }}
                                                onCopy={copyText}
                                            />
                                        </div>
                                    </div>
                                    <div className="relative z-10 w-full mt-4 border-t border-white/5 space-y-4">
                                        <MarkdownViewer
                                            content={cleanAnalysis}
                                            mode={mode}
                                            isAnalyzing={isAnalyzing}
                                            onCopy={copyText}
                                            verdict={verdict}
                                        />

                                        {verdict === "REJECT" && (
                                            <div id="upskilling-bridge-section">
                                                <UpskillingBridgeSection
                                                    missingSkills={insights?.missing_skills || []}
                                                    hasLatexSource={hasLatexSource}
                                                    onSwitchMode={onSwitchMode}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {mode === "customize" && (
                                <div className="space-y-12 pb-24">
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
                                        mode={mode}
                                    />

                                    {!analysis && (
                                        <div className="py-8">
                                            <LoadingScanning
                                                mode={mode}
                                                companyName={companyName}
                                                position={position}
                                                userName={userName}
                                            />
                                        </div>
                                    )}

                                    {analysis && (() => {
                                        let cleanedAnalysis = analysis.split("###")[0].trim();
                                        if (cleanedAnalysis.startsWith("```latex")) {
                                            cleanedAnalysis = cleanedAnalysis.substring(8).trim();
                                        } else if (cleanedAnalysis.startsWith("```tex")) {
                                            cleanedAnalysis = cleanedAnalysis.substring(6).trim();
                                        } else if (cleanedAnalysis.startsWith("```")) {
                                            cleanedAnalysis = cleanedAnalysis.substring(3).trim();
                                        }
                                        if (cleanedAnalysis.endsWith("```")) {
                                            cleanedAnalysis = cleanedAnalysis.substring(0, cleanedAnalysis.length - 3).trim();
                                        }
                                        const isLatex =
                                            cleanedAnalysis.includes("\\documentclass") ||
                                            cleanedAnalysis.includes("\\begin{document}") ||
                                            cleanedAnalysis.includes("\\begin{") ||
                                            cleanedAnalysis.includes("\\section") ||
                                            cleanedAnalysis.includes("\\item") ||
                                            (!!originalLatex && (
                                                originalLatex.includes("\\documentclass") ||
                                                originalLatex.includes("\\begin{document}") ||
                                                originalLatex.includes("\\begin{") ||
                                                originalLatex.includes("\\section")
                                            ));
                                        const hasOriginal = isLatex && !!originalLatex;

                                        return (
                                            <div className="space-y-10">
                                                <StrategyCard strategy={insights?.strategy} verdict={verdict} />

                                                <div className="space-y-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-px w-8 bg-primary/30" />
                                                        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary font-bold">
                                                            {isLatex ? (hasOriginal ? "Changes · Tailored LaTeX" : "Tailored LaTeX Source") : "Tailored Plain-Text Resume"}
                                                        </span>
                                                    </div>

                                                    <AuditBadge audit={insights?.audit_report} />

                                                    {hasOriginal ? (
                                                        <LatexDiffViewer
                                                            original={originalLatex!}
                                                            updated={cleanedAnalysis}
                                                            onCopyUpdated={() => copyText(cleanedAnalysis, "LaTeX Code")}
                                                        />
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex justify-end">
                                                                <button
                                                                    onClick={() => copyText(cleanedAnalysis, isLatex ? "LaTeX Code" : "Resume")}
                                                                    className="px-6 py-2 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/10 flex items-center gap-2"
                                                                >
                                                                    <Copy className="w-3 h-3" />
                                                                    Copy {isLatex ? "Code" : "Resume"}
                                                                </button>
                                                            </div>
                                                            <div className="bg-slate-950/50 border border-white/5 rounded-3xl p-8 overflow-hidden relative">
                                                                <pre className="text-[13px] font-mono text-white/70 leading-relaxed overflow-x-auto relative z-10">
                                                                    {cleanedAnalysis}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
