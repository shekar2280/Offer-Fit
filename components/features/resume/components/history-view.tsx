"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Trash2, ArrowRight, Clock, Sparkles, Briefcase } from "lucide-react";
import Link from "next/link";

interface Analysis {
    id: string;
    company_name: string;
    position: string;
    created_at: string;
    analysis_result?: string;
    customized_latex?: string;
}

export function HistoryView() {
    const [history, setHistory] = useState<Analysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchHistory() {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("analyses")
                    .select("id, company_name, position, created_at, analysis_result, customized_latex")
                    .order("created_at", { ascending: false });

                if (data) setHistory(data);
            }
            setIsLoading(false);
        }
        fetchHistory();
    }, []);

    const deleteAnalysis = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const { error } = await supabase.from("analyses").delete().eq("id", id);
        if (!error) setHistory(history.filter(item => item.id !== id));
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto px-4 py-8 animate-pulse">
                <div className="h-10 w-48 bg-white/5 rounded-xl mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-52 bg-white/5 rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-1000 px-4 py-8 relative z-10">
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-2">
                    <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tighter text-white">
                        Archive <span className="text-primary italic font-light drop-shadow-[0_0_20px_rgba(242,170,76,0.3)]">Logs</span>
                    </h1>
                    <p className="text-white/40 text-sm font-light flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Manage your job applications and customized resumes.
                    </p>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="bg-black/40 border border-dashed border-white/10 rounded-[3rem] p-16 text-center shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                        <FileText className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-2">No Archives Found</h3>
                    <p className="text-white/40 mb-8 max-w-sm mx-auto">
                        Your history is clean. Return to the homepage to start a new analysis or customization.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-black font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                    >
                        Return to Homepage <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {history.map((item) => {
                        const hasAnalysis = !!item.analysis_result;
                        const hasCustomization = !!item.customized_latex;

                        return (
                            <div
                                key={item.id}
                                className="group relative rounded-[2rem] p-6 transition-all duration-500 overflow-hidden flex flex-col justify-between"
                                style={{
                                    background: "linear-gradient(135deg, rgba(242,170,76,0.04) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.6) 100%)",
                                    border: "1px solid rgba(242,170,76,0.12)",
                                    boxShadow: "inset 0 0 40px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.3)"
                                }}
                            >
                                <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ background: "linear-gradient(135deg, rgba(242,170,76,0.07) 0%, transparent 60%)" }}
                                />

                                <div className="absolute top-4 right-4 z-20">
                                    <button
                                        onClick={(e) => deleteAnalysis(e, item.id)}
                                        className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive/60 hover:text-destructive hover:bg-destructive/20 hover:border-destructive/40 transition-all backdrop-blur-md"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="relative z-10 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                            style={{ background: "rgba(242,170,76,0.1)", border: "1px solid rgba(242,170,76,0.2)" }}>
                                            <Briefcase className="w-4 h-4 text-primary/70" />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
                                            {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>
                                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white leading-tight pr-10">
                                        {item.company_name} <span className="text-primary/50 font-light italic"> - {item.position}</span>
                                    </h3>
                                </div>

                                <div className="relative z-10 flex flex-col gap-2.5 mt-auto">
                                    {hasAnalysis && (
                                        <Link
                                            href={`/analyze?id=${item.id}`}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group/btn"
                                            style={{
                                                background: "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.08)"
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-white/20 group-hover/btn:text-white/60 transition-colors" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover/btn:text-white transition-colors">View Analysis</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-white/20 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                        </Link>
                                    )}

                                    {hasCustomization ? (
                                        <Link
                                            href={`/customize?id=${item.id}`}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group/btn"
                                            style={{
                                                background: "rgba(242,170,76,0.06)",
                                                border: "1px solid rgba(242,170,76,0.18)"
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-4 h-4 text-primary/50 group-hover/btn:text-primary transition-colors" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 group-hover/btn:text-primary transition-colors">Open Customized Resume</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-primary/30 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                        </Link>
                                    ) : hasAnalysis && (
                                        <Link
                                            href={`/customize?id=${item.id}`}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group/btn"
                                            style={{
                                                background: "rgba(242,170,76,0.03)",
                                                border: "1px dashed rgba(242,170,76,0.20)"
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-4 h-4 text-primary/30 group-hover/btn:text-primary/70 transition-colors" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 group-hover/btn:text-primary/80 transition-colors">Customize Resume</span>
                                            </div>
                                            <ArrowRight className="w-3 h-3 text-primary/20 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                                        </Link>
                                    )}

                                    {!hasAnalysis && !hasCustomization && (
                                        <div className="px-4 py-3 rounded-xl text-center"
                                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">No results yet</span>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
