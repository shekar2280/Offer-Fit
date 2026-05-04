"use client";

import React, { useEffect } from "react";
import { Copy } from "lucide-react";
import { AnalysisReportProps } from "./types";
import { ReportToolbar } from "./report/report-toolbar";
import { ErrorView } from "./report/error-view";
import { MatchHeader } from "./report/match-header";
import { ScoreMetrics, SkillsView, RedFlags, InterviewQuestions, OutreachEmail, SalaryInsight, MarketTrends } from "./report/insights-cards";
import { MarkdownViewer } from "./report/markdown-viewer";
import { LoadingScanning } from "./report/loading-scanning";

export function AnalysisReport(props: AnalysisReportProps) {
    const {
        analysis,
        isAnalyzing,
        companyName,
        position,
        onReset,
        mode = "analysis",
        onSwitchMode,
        isHistoryMode = false,
        hasCustomization = false,
        insights = null,
        serverError = null
    } = props;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [mode]);

    const matchScoreMatch = analysis.match(/OVERALL STRATEGIC MATCH:?\s*\[?(\d+)\]?%/i);
    const score = insights?.matchScore ?? (matchScoreMatch ? parseInt(matchScoreMatch[1]) : 0);

    const verdictMatch = analysis.match(/VERDICT:?\s*\[?(APPLY|STRETCH|PASS)\]/i);
    const verdict = (insights?.verdict && ["APPLY","STRETCH","PASS"].includes(insights.verdict))
        ? insights.verdict
        : (verdictMatch ? verdictMatch[1].toUpperCase() : (score > 75 ? "APPLY" : score > 50 ? "STRETCH" : "PASS"));

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
            />

            <div id="analysis-report-content" className="bg-black/60 border border-primary/40 ring-1 ring-primary/20 rounded-[2.5rem] p-6 md:p-8 backdrop-blur-3xl relative shadow-[0_0_100px_-20px_rgba(242,170,76,0.15)] overflow-hidden mb-6">
                {serverError ? (
                    <ErrorView error={serverError} onReset={onReset} />
                ) : (
                    <>
                        {(analysis || isAnalyzing) && mode === "analysis" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
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

                                {isAnalyzing && !analysis && (
                                    <div className="py-8">
                                        <LoadingScanning mode={mode} />
                                    </div>
                                )}

                                {analysis && (
                                    <>
                                        <ScoreMetrics insights={insights} isAnalyzing={isAnalyzing} />
                                        <SalaryInsight data={insights?.salaryInsight} />

                                        <div className="space-y-6">
                                            <SkillsView 
                                                matched={insights?.matchedSkills || []} 
                                                missing={insights?.missingSkills || []} 
                                            />
                                            <RedFlags flags={insights?.redFlags || []} />
                                            <InterviewQuestions 
                                                questions={insights?.interviewQuestions || []} 
                                                onCopy={copyText} 
                                            />
                                            {insights?.outreachEmail && (
                                                <OutreachEmail email={insights.outreachEmail} onCopy={copyText} />
                                            )}
                                            <MarketTrends toolUsed={insights?.toolUsed} />
                                        </div>
                                    </>
                                )}
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

                        <div className="relative z-10 w-full mt-8 pt-8 border-t border-white/5">
                            {analysis && (
                                <MarkdownViewer 
                                    content={mode === "customize" ? analysis : cleanAnalysis} 
                                    mode={mode} 
                                    isAnalyzing={isAnalyzing} 
                                    onCopy={copyText} 
                                />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
