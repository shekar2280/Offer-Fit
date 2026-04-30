"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Trash2, ArrowRight, Clock, Code } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Analysis {
    id: string;
    short_title: string;
    created_at: string;
    resume_text?: string;
}

export function HistoryView() {
    const [history, setHistory] = useState<Analysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchHistory() {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("analyses")
                    .select("id, short_title, created_at, resume_text")
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

        const { error } = await supabase
            .from("analyses")
            .delete()
            .eq("id", id);

        if (!error) {
            setHistory(history.filter(item => item.id !== id));
        }
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto px-4 py-8 animate-pulse">
                <div className="h-10 w-48 bg-white/5 rounded-xl mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-white/5 rounded-3xl" />
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
                        Access your past resume analyses and LaTeX customizations.
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
                        Your history is clean. Return to the gateway to initiate a new analysis or customization protocol.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-black font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                    >
                        Return to Gateway <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item) => {
                        const isCustomize = item.resume_text?.includes("\\documentclass");
                        const targetUrl = isCustomize ? `/customize?id=${item.id}` : `/analyze?id=${item.id}`;

                        return (
                            <Link
                                key={item.id}
                                href={targetUrl}
                                className={`group relative bg-black/40 border ${isCustomize ? 'border-primary/40 hover:border-primary' : 'border-white/10 hover:border-white/30'} rounded-[2rem] p-6 sm:p-8 transition-all duration-500 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col justify-between`}
                            >
                                <div className="absolute top-0 right-0 p-6 flex items-center gap-3 z-20">
                                    <button
                                        onClick={(e) => deleteAnalysis(e, item.id)}
                                        className="p-2 rounded-xl bg-black/50 border border-white/10 text-white/30 hover:text-destructive hover:bg-destructive/20 hover:border-destructive/30 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${isCustomize ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/10 text-white/40 group-hover:text-white"}`}>
                                            {isCustomize ? <Code className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <h3 className="font-heading text-lg sm:text-xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors pr-10 line-clamp-2">
                                        {item.short_title || "Untitled Protocol"}
                                    </h3>
                                </div>

                                <div className="relative z-10 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary mt-8 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                    Access Record <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                                
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
