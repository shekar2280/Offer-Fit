import React from "react";
import { Zap, BookOpen, ShieldAlert, ArrowRight, CheckSquare } from "lucide-react";

interface UpskillingBridgeSectionProps {
    missingSkills: string[];
    hasLatexSource: boolean;
    onSwitchMode: (mode: "analysis" | "customize") => void;
}

export function UpskillingBridgeSection({
    missingSkills = [],
    hasLatexSource = false,
    onSwitchMode
}: UpskillingBridgeSectionProps) {

    const getUpskillingTopic = (skill: string) => {
        const s = skill.toLowerCase();
        if (s.includes("aws") || s.includes("cloud") || s.includes("azure") || s.includes("gcp") || s.includes("kubernetes") || s.includes("docker") || s.includes("devops")) {
            return "Cloud Architecture & Modern Deployment Foundations";
        }
        if (s.includes("react") || s.includes("next.js") || s.includes("typescript") || s.includes("javascript") || s.includes("frontend") || s.includes("css")) {
            return "Advanced Frontend Engineering & State Architecture";
        }
        if (s.includes("node") || s.includes("express") || s.includes("graphql") || s.includes("api") || s.includes("backend") || s.includes("system design")) {
            return "High-Throughput Backend Systems & API Design Patterns";
        }
        if (s.includes("sql") || s.includes("postgres") || s.includes("mongo") || s.includes("database") || s.includes("redis")) {
            return "Data Modeling, Caching Strategies & Distributed Systems";
        }
        if (s.includes("python") || s.includes("ml") || s.includes("ai") || s.includes("data science") || s.includes("tensor")) {
            return "Practical Machine Learning Pipelines & LLM Operations (LLMOps)";
        }
        return "Core Competency Deep-Dive & Open-Source Contributions";
    };

    return (
        <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="relative overflow-hidden border border-destructive/30 bg-black/40 backdrop-blur-2xl rounded-[2.5rem] p-8 transition-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-destructive/5 blur-[120px] pointer-events-none rounded-full" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Upskilling Bridge</span>
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-white">
                            Resume Transformation Pathway
                        </h3>
                        <p className="text-[12px] text-white/40 leading-relaxed font-light">
                            Your resume has critical structural mismatches. Follow the upskilling guide below and leverage the Customizer tool to align your technical keywords.
                        </p>
                    </div>

                    <div className="flex items-center shrink-0">
                        {hasLatexSource ? (
                            <button
                                onClick={() => onSwitchMode("customize")}
                                className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-destructive text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-destructive/20 flex items-center justify-center gap-3"
                            >
                                ⚠️ Customize Resume
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full sm:w-auto px-8 h-12 rounded-2xl border border-white/5 bg-zinc-900/40 text-white/20 cursor-not-allowed opacity-50 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                title="LaTeX template required to launch customizer mode"
                            >
                                Customize (LaTeX Required)
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="flex items-center gap-2 text-primary/70">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Gap Resolution Checklist</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {missingSkills.length > 0 ? (
                            missingSkills.slice(0, 6).map((skill, idx) => (
                                <div
                                    key={idx}
                                    className="flex gap-4 p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-destructive/20 hover:bg-white/[0.02] transition-all group/skill"
                                >
                                    <div className="mt-0.5 shrink-0 w-5 h-5 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                                        <CheckSquare className="w-3 h-3 text-destructive/80 group-hover/skill:scale-110 transition-transform" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">{skill}</h4>
                                        <p className="text-[11px] text-white/40 leading-relaxed font-light">
                                            Focus Area: <span className="text-white/60 font-medium">{getUpskillingTopic(skill)}</span>. Implement a production-grade mini-project focusing on scale or latency to prove hands-on mastery.
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                <p className="text-xs text-white/30 italic">No specific missing skills were flagged. Review general business or seniority outcomes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
