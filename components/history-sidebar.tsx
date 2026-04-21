"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileText, Clock, Plus, Trash2 } from "lucide-react";

interface Analysis {
    id: string;
    short_title: string;
    created_at: string;
}

export function HistorySidebar({ onSelect, selectedId }: { onSelect: (id: string | null) => void, selectedId: string | null }) {
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
                    .select("id, short_title, created_at")
                    .order("created_at", { ascending: false });

                if (data) setHistory(data);
            }
            setIsLoading(false);
        }
        fetchHistory();
    }, [selectedId]);

    const deleteAnalysis = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();

        const supabase = createClient();
        const { error } = await supabase
            .from("analyses")
            .delete()
            .eq("id", id);

        if (!error) {
            setHistory(history.filter(item => item.id !== id));
            if (selectedId === id) onSelect(null);
        }
    };


    return (
        <div className="w-full lg:w-full h-full flex flex-col z-20 shrink-0 relative bg-black lg:bg-transparent">

            <div className="p-3 sm:p-6 transition-all duration-500">
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full flex lg:aspect-square lg:group-hover/sidebar:aspect-auto items-center justify-center lg:gap-0 lg:group-hover/sidebar:gap-3 py-4 lg:py-3 lg:px-3 lg:group-hover/sidebar:py-4 rounded-xl font-bold uppercase tracking-widest transition-all duration-500 ${selectedId === null
                        ? "bg-primary text-black shadow-[0_10px_20px_rgba(242,170,76,0.2)]"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        }`}
                    title="New Analysis"
                >
                    <Plus className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] whitespace-nowrap lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:w-0 lg:group-hover/sidebar:w-auto transition-all duration-500 overflow-hidden">
                        New Analysis
                    </span>
                </button>
            </div>

            <div className="px-4 sm:px-6 py-2 transition-all duration-500">
                <div className="text-[10px] font-black tracking-[0.3em] uppercase text-primary/60 flex items-center gap-3">
                    <div className="w-8 h-[1px] bg-primary/20 shrink-0"></div>
                    <span className="lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-500 whitespace-nowrap">
                        Archive
                    </span>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 px-2 pb-12 space-y-2 no-scrollbar">
                {!isLoading && history.length === 0 && (
                    <div className="text-center text-[10px] uppercase tracking-widest font-black text-white/10 p-8 lg:p-4 lg:group-hover/sidebar:p-12 mt-4 border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01] lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-all duration-500 overflow-hidden whitespace-nowrap">
                        Archive Empty
                    </div>
                )}
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="group/item relative px-1"
                    >
                        <button
                            onClick={() => onSelect(item.id)}
                            className={`w-full text-left transition-all duration-500 flex items-center px-5 py-4 rounded-xl relative overflow-hidden group/item ${selectedId === item.id
                                ? "bg-white/10 border border-white/10 shadow-2xl"
                                : "bg-transparent hover:bg-white/5 border border-transparent"
                                }`}
                            title={item.short_title || "Untitled Analysis"}
                        >
                            <FileText className="w-5 h-5 shrink-0 sm:mr-3 lg:mr-0 lg:group-hover/sidebar:mr-3 transition-all duration-500 text-primary/40" />
                            {selectedId === item.id && (
                                <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(242,170,76,0.8)] animate-pulse"></div>
                            )}
                            
                            <div className={`text-xs font-medium leading-tight truncate transition-all duration-500 ${selectedId === item.id ? "text-primary" : "text-white/60 group-hover/item:text-white"} lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:w-0 lg:group-hover/sidebar:w-auto`}>
                                {item.short_title || "Untitled Analysis"}
                            </div>
                        </button>

                        <button
                            onClick={(e) => deleteAnalysis(e, item.id)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 p-2 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-all duration-300 backdrop-blur-md sm:translate-x-0"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
