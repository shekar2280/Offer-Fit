"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/services/supabase/client";
import { FileText, Trash2, ArrowRight, Clock, Sparkles, Briefcase, Search, Calendar } from "lucide-react";
import Link from "next/link";
import { HistoryAnalysisItem, InfiniteHistoryData } from "@/types";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

function HistoryRowSkeleton() {
    return (
        <div className="rounded-2xl px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="skeleton-shimmer w-12 h-12 shrink-0 rounded-2xl bg-white/[0.06]" />
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="skeleton-shimmer h-5 w-40 rounded-md bg-white/[0.06]" />
                        <div className="skeleton-shimmer h-4 w-20 rounded-md bg-white/[0.04]" />
                    </div>
                    <div className="skeleton-shimmer h-4 w-28 rounded-md bg-white/[0.04]" />
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="skeleton-shimmer h-9 w-28 rounded-xl bg-white/[0.06]" />
                <div className="skeleton-shimmer h-9 w-28 rounded-xl bg-white/[0.06]" />
                <div className="skeleton-shimmer h-9 w-9 rounded-xl bg-white/[0.06]" />
            </div>
        </div>
    );
}

function HistoryListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: count }, (_, i) => (
                <HistoryRowSkeleton key={i} />
            ))}
        </div>
    );
}

async function fetchHistoryPaged({ pageParam, queryKey }: { pageParam: string | null, queryKey: any[] }): Promise<{
    data: HistoryAnalysisItem[];
    nextCursor: string | null;
}> {
    const search = queryKey[2] as string;
    const date = queryKey[3] as string;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return { data: [], nextCursor: null };

    let query = supabase
        .from("analyses")
        .select("id, company_name, position, created_at, analysis_result, customized_latex")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(6);

    if (pageParam) {
        query = query.lt("created_at", pageParam);
    }

    if (search) {
        query = query.or(`company_name.ilike.%${search}%,position.ilike.%${search}%`);
    }

    if (date) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        query = query.gte("created_at", date).lt("created_at", nextDayStr);
    }

    const { data, error } = await query;
    if (error) throw error;

    const nextCursor = data && data.length === 6 ? data[data.length - 1].created_at : null;
    return { data: data || [], nextCursor };
}

async function fetchSingleAnalysis(id: string) {
    const supabase = createClient();
    const { data } = await supabase
        .from("analyses")
        .select("*, intel:company_intel(*)")
        .eq("id", id)
        .single();
    return data;
}

export function HistoryView({ initialData }: { initialData?: InfiniteHistoryData }) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ["history", "infinite", debouncedSearch, dateFilter],
        queryFn: fetchHistoryPaged,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialData: (debouncedSearch === "" && dateFilter === "" && initialData) ? initialData : undefined,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24,
    });

    const history = data ? data.pages.flatMap((page) => page.data) : [];

    const scrollAnchorRef = useRef<number>(0);

    const handleLoadMore = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
        scrollAnchorRef.current = window.scrollY;
        fetchNextPage().then(() => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: scrollAnchorRef.current, behavior: "instant" });
            });
        });
    };

    const handleCardHover = (id: string) => {
        queryClient.prefetchQuery({
            queryKey: ["analysis", id],
            queryFn: () => fetchSingleAnalysis(id),
            staleTime: 1000 * 60 * 60,
        });
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const supabase = createClient();
            const { error } = await supabase.from("analyses").delete().eq("id", id);
            if (error) throw error;
            return id;
        },
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: ["history", "infinite"] });
            const previousData = queryClient.getQueryData(["history", "infinite"]);

            queryClient.setQueryData<InfiniteHistoryData>(["history", "infinite"], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: page.data.filter((item) => item.id !== deletedId)
                    }))
                };
            });

            return { previousData };
        },
        onError: (err, deletedId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(["history", "infinite"], context.previousData);
            }
            toast.error("Failed to delete analysis log. Please try again.");
        },
        onSuccess: () => {
            toast.success("Analysis log deleted successfully.");
        },
        onSettled: (deletedId) => {
            queryClient.invalidateQueries({ queryKey: ["history", "infinite"] });
            if (deletedId) {
                queryClient.removeQueries({ queryKey: ["analysis", deletedId] });
            }
        }
    });

    const deleteAnalysis = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        deleteMutation.mutate(id);
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-700 px-4 pt-8 pb-0 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div className="space-y-2">
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-center gap-3">
                        Archive <span className="text-primary italic font-light">Logs</span>
                    </h1>
                    <p className="text-white/50 text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary/70" />
                        Manage your job applications and customized resumes.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full md:w-64 transition-all"
                        />
                    </div>
                    <div className="relative flex-1 md:flex-initial">
                        <Calendar className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full transition-all [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <HistoryListSkeleton count={6} />
            ) : history.length === 0 ? (
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-16 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(242,170,76,0.15)]">
                        <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-white mb-3">No Archives Found</h3>
                    <p className="text-white/50 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                        Your history is clean. Return to the homepage to start a new analysis or customization.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(242,170,76,0.4)]"
                    >
                        Return to Homepage <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="flex flex-col gap-3">
                        {history.length === 0 ? (
                            <div className="text-center py-12 text-white/40 text-sm">No archives match your search criteria.</div>
                        ) : history.map((item, index) => {
                            const hasAnalysis = !!item.analysis_result;
                            const hasCustomization = !!item.customized_latex;

                            return (
                                <div
                                    key={item.id}
                                    onMouseEnter={() => handleCardHover(item.id)}
                                    className="group relative rounded-2xl px-6 py-5 transition-all duration-300 overflow-hidden flex flex-col md:flex-row md:items-center justify-between bg-white/[0.03] border border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.05] hover:shadow-[0_4px_20px_rgba(242,170,76,0.1)] gap-4 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                                    style={{ animationDelay: `${(index % 6) * 100}ms` }}
                                >
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(242,170,76,0.1)] group-hover:scale-105 transition-transform duration-500">
                                            <Briefcase className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-heading text-lg font-bold text-white truncate group-hover:text-primary transition-colors">
                                                    {item.company_name}
                                                </h3>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 bg-white/5 px-2 py-0.5 rounded-md shrink-0">
                                                    {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </span>
                                            </div>
                                            <p className="text-white/60 font-medium text-sm truncate">
                                                {item.position}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
                                        {hasAnalysis ? (
                                            <Link
                                                href={`/analyze?id=${item.id}`}
                                                className="flex items-center px-5 py-2.5 rounded-xl bg-black border border-primary text-primary hover:bg-primary/10 transition-all group/btn"
                                            >
                                                <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block">Analysis</span>
                                            </Link>
                                        ) : hasCustomization && (
                                            <Link
                                                href={`/analyze?id=${item.id}`}
                                                className="flex items-center px-5 py-2.5 rounded-xl bg-transparent border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all group/btn"
                                            >
                                                <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block">Analyze</span>
                                            </Link>
                                        )}

                                        {hasCustomization ? (
                                            <Link
                                                href={`/customize?id=${item.id}`}
                                                className="flex items-center px-5 py-2.5 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all group/btn shadow-[0_0_15px_rgba(242,170,76,0.15)] hover:shadow-[0_0_25px_rgba(242,170,76,0.3)]"
                                            >
                                                <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block">Customized</span>
                                            </Link>
                                        ) : hasAnalysis && (
                                            <Link
                                                href={`/customize?id=${item.id}`}
                                                className="flex items-center px-5 py-2.5 rounded-xl bg-transparent border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all group/btn"
                                            >
                                                <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block">Customize</span>
                                            </Link>
                                        )}

                                        {!hasAnalysis && !hasCustomization && (
                                            <div className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Loading...</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={(e) => deleteAnalysis(e, item.id)}
                                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-all backdrop-blur-md ml-1"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                </div>
                            );
                        })}
                    </div>

                    {hasNextPage && (
                        <div className="flex justify-center mt-12 mb-8 h-14">
                            <button
                                onClick={handleLoadMore}
                                disabled={isFetchingNextPage}
                                className="inline-flex items-center justify-center gap-3 w-[280px] h-full rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none group shadow-[0_0_20px_rgba(242,170,76,0.02)] hover:shadow-[0_0_30px_rgba(242,170,76,0.1)]"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading Archives...
                                    </>
                                ) : (
                                    <>
                                        Load More Archives
                                        <ArrowRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
