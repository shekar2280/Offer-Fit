"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Coins,
    FileText,
    Search,
    Cpu,
    Sparkles,
    CheckCircle2,
    Binary,
    Zap,
    AlertTriangle,
    Globe,
    Sliders
} from "lucide-react";
import Image from "next/image";
import { AnalysisInsights } from "@/types";

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
    mode?: "analysis" | "customize";
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
    bgColorClass,
    mode = "analysis"
}: MatchHeaderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [renderProgress, setRenderProgress] = useState(0);
    const [disableTransition, setDisableTransition] = useState(false);
    const [showFinalScore, setShowFinalScore] = useState(false);
    const prevIsAnalyzing = React.useRef(isAnalyzing);

    const steps = mode === "customize"
        ? [
            { label: "Reading", icon: FileText },
            { label: "Researching", icon: Globe },
            { label: "Tailoring", icon: Sliders },
            { label: "Injecting", icon: Cpu },
            { label: "Optimizing", icon: Zap },
            { label: "Finalizing", icon: CheckCircle2 }
        ]
        : [
            { label: "Loading", icon: FileText },
            { label: "Researching", icon: Search },
            { label: "Scanning", icon: Cpu },
            { label: "Matching", icon: Sparkles },
            { label: "Computing", icon: Binary },
            { label: "Finalizing", icon: CheckCircle2 }
        ];

    useEffect(() => {
        if (!isAnalyzing) return;
        setCurrentStep(0);
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 2500);
        return () => clearInterval(interval);
    }, [isAnalyzing, steps.length, mode]);

    useEffect(() => {
        if (isAnalyzing) {
            setDisableTransition(false);
            setRenderProgress((currentStep / steps.length) * 100);
        }
    }, [isAnalyzing, currentStep, steps.length]);

    useEffect(() => {
        if (isAnalyzing) {
            setShowFinalScore(false);
            prevIsAnalyzing.current = true;
            return;
        }

        if (prevIsAnalyzing.current) {
            setDisableTransition(false);
            setRenderProgress(100);
            setShowFinalScore(false);

            const resetTimeout = setTimeout(() => {
                setDisableTransition(true);
                setRenderProgress(0);

                const animateTimeout = setTimeout(() => {
                    setDisableTransition(false);
                    setRenderProgress(mode === "customize" ? 100 : score);

                    const scoreTimeout = setTimeout(() => {
                        setShowFinalScore(true);
                    }, 800);

                    return () => clearTimeout(scoreTimeout);
                }, 50);

                return () => clearTimeout(animateTimeout);
            }, 800);

            prevIsAnalyzing.current = false;
            return () => clearTimeout(resetTimeout);
        } else {
            setDisableTransition(false);
            setRenderProgress(0);
            setShowFinalScore(false);

            const animateTimeout = setTimeout(() => {
                setRenderProgress(mode === "customize" ? 100 : score);

                const scoreTimeout = setTimeout(() => {
                    setShowFinalScore(true);
                }, 800);

                return () => clearTimeout(scoreTimeout);
            }, 100);

            return () => clearTimeout(animateTimeout);
        }
    }, [isAnalyzing, score, mode]);

    const activeStep = steps[currentStep];
    const ActiveIcon = activeStep?.icon || Cpu;

    return (
        <div className="relative overflow-hidden bg-white/[0.02] border border-primary/10 rounded-[2.5rem] p-6 md:p-8 group/header shadow-2xl">
            <div data-html2canvas-ignore className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none group-hover/header:bg-primary/20 transition-all duration-1000" />
            <div data-html2canvas-ignore className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-9 space-y-6 text-center lg:text-left">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-center lg:justify-start gap-2.5 text-[10px] font-mono text-white/40 tracking-wider overflow-x-auto scrollbar-none whitespace-nowrap">
                            {companyName && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-[0.2em] font-semibold text-white/80 shrink-0">
                                    {insights?.intel?.logo_url && (
                                        <span className="relative w-3.5 h-3.5 inline-block overflow-hidden rounded-[2px] bg-white shrink-0">
                                            <Image
                                                src={insights.intel.logo_url}
                                                alt={companyName}
                                                fill
                                                unoptimized
                                                className="object-contain p-0.5"
                                            />
                                        </span>
                                    )}
                                    {companyName}
                                </span>
                            )}
                            {position && (
                                <>
                                    <span className="text-white/20 shrink-0">•</span>
                                    <span className="text-white/90 font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded bg-primary/15 border border-primary/30 shrink-0">
                                        {position}
                                    </span>
                                </>
                            )}
                        </div>
                        <h1 className="font-heading text-6xl md:text-8xl lg:text-[5.5rem] font-black text-white tracking-tighter leading-[0.9] uppercase">
                            {mode === "customize" ? (
                                <>
                                    Resume<br />
                                    <span className="relative inline-block mt-2">
                                        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 italic font-light">
                                            Customizer.
                                        </span>
                                    </span>
                                </>
                            ) : (
                                <>
                                    Hiring<br />
                                    <span className="relative inline-block mt-2">
                                        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 italic font-light">
                                            Probability.
                                        </span>
                                    </span>
                                </>
                            )}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                        {isAnalyzing && !insights ? (
                            <div className="h-10 w-32 bg-white/5 animate-pulse rounded-full" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/20 shrink-0">
                                    {mode === "customize" ? "Custom Status" : "Verdict:"}
                                </span>
                                <div className={`relative flex items-center gap-2 px-5 py-2 rounded-xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(242,170,76,0.15)] shadow-xl text-xs ${mode === "customize" ? 'bg-primary/20 border-primary/30' : bgColorClass}`}>
                                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                                    {(() => {
                                        if (mode === "customize") {
                                            return <CheckCircle2 className="w-3.5 h-3.5 text-primary animate-pulse" />;
                                        }
                                        const VerdictIcon = verdict === "STRETCH"
                                            ? Sparkles
                                            : (verdict === "PASS" || verdict === "REJECT")
                                                ? AlertTriangle
                                                : Zap;
                                        return <VerdictIcon className={`w-3.5 h-3.5 ${verdictColorClass} animate-pulse`} />;
                                    })()}
                                    <span className={`font-black uppercase tracking-[0.25em] drop-shadow-sm ${mode === "customize" ? 'text-primary' : verdictColorClass}`}>
                                        {mode === "customize" ? "Tailored" : verdict}
                                    </span>
                                </div>
                            </div>
                        )}

                    </div>

                    {!isAnalyzing && insights?.tool_used && insights.tool_used.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
                            {insights.tool_used.map((tool, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-white/60 hover:text-primary hover:border-primary/20 transition-all duration-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                                    <span className="text-[9px] font-mono uppercase tracking-widest">
                                        {tool.replace(/_/g, " ")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-center lg:col-span-3 lg:justify-end">
                    <div className="relative w-40 h-40 scale-110 sm:w-48 sm:h-48 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-105" viewBox="0 0 100 100">
                            <defs>
                                <filter id="glow-ring-header" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <circle cx="50" cy="50" r="45" className="fill-none stroke-white/5 stroke-[1.5]" />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                className={`fill-none stroke-[3.5] ${disableTransition ? '' : 'transition-all duration-1000'
                                    } ${isAnalyzing ? 'stroke-primary' : (mode === "customize" ? 'stroke-primary' : strokeColorClass)
                                    }`}
                                strokeDasharray={282.74}
                                strokeDashoffset={282.74 - (renderProgress / 100) * 282.74}
                                strokeLinecap="round"
                                filter="url(#glow-ring-header)"
                            />
                        </svg>

                        <div className="flex flex-col items-center justify-center z-10">
                            {isAnalyzing || !showFinalScore ? (
                                <>
                                    <div className="relative w-10 h-10 flex items-center justify-center mb-1">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentStep}
                                                initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
                                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                                className="text-primary drop-shadow-[0_0_8px_rgba(242,170,76,0.6)] flex items-center justify-center"
                                            >
                                                {isAnalyzing ? (
                                                    <ActiveIcon className="w-8 h-8 stroke-[1.5]" />
                                                ) : (
                                                    <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={currentStep}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.25 }}
                                            className="text-[9px] font-mono uppercase tracking-[0.3em] text-primary animate-pulse text-center"
                                        >
                                            {isAnalyzing ? activeStep?.label : "Done!"}
                                        </motion.span>
                                    </AnimatePresence>
                                </>
                            ) : (
                                <>
                                    {mode === "customize" ? (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className="text-primary drop-shadow-[0_0_12px_rgba(242,170,76,0.6)] mb-1 flex items-center justify-center"
                                            >
                                                <Sparkles className="w-10 h-10 stroke-[1.5]" />
                                            </motion.div>
                                            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 mt-1">Ready</span>
                                        </>
                                    ) : (
                                        <>
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl"
                                            >
                                                {score}
                                            </motion.span>
                                            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/20 mt-1">Match</span>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
