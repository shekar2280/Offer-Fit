"use client";

import { createClient } from "@/services/supabase/client";
import { FileText, Trash2, ArrowRight, Clock, Sparkles, Briefcase } from "lucide-react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HistoryGridSkeleton } from "@/components/ui/skeletons";

import { toast } from "sonner";

interface Analysis {
    id: string;
    company_name: string;
    position: string;
    created_at: string;
    analysis_result?: string;
    customized_latex?: string;
}

interface InfiniteHistoryData {
    pages: {
        data: Analysis[];
        nextCursor: string | null;
    }[];
    pageParams: (string | null)[];
}

async function fetchHistoryPaged({ pageParam }: { pageParam: string | null }): Promise<{
    data: Analysis[];
    nextCursor: string | null;
}> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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

    const { data, error } = await query;
    if (error) throw error;

    const nextCursor = data && data.length === 6 ? data[data.length - 1].created_at : null;
    return { data: data || [], nextCursor };
}

async function fetchSingleAnalysis(id: string) {
    const supabase = createClient();
    const { data } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id)
        .single();
    return data;
}

export function HistoryView() {
    const queryClient = useQueryClient();


    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ["history", "infinite"],
        queryFn: fetchHistoryPaged,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24,
    });

    const history = data ? data.pages.flatMap((page) => page.data) : [];

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

    if (isLoading) {
        return (
            <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
                <div className="mb-10 space-y-2">
                    <div className="skeleton-shimmer rounded-xl bg-white/[0.04] w-48 h-10" />
                    <div className="skeleton-shimmer rounded-lg bg-white/[0.04] w-64 h-4" />
                </div>
                <HistoryGridSkeleton count={6} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto animate-in fade-in duration-700 px-4 pt-8 pb-0 relative z-10">
            <div className="flex items-center justify-between mb-12">
                <div className="space-y-2">
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-center gap-3">
                        Archive <span className="text-primary italic font-light">Logs</span>
                    </h1>
                    <p className="text-white/50 text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary/70" />
                        Manage your job applications and customized resumes.
                    </p>
                </div>
            </div>

            {history.length === 0 ? (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item) => {
                            const hasAnalysis = !!item.analysis_result;
                            const hasCustomization = !!item.customized_latex;

                            return (
                                <div
                                    key={item.id}
                                    onMouseEnter={() => handleCardHover(item.id)}
                                    className="group relative rounded-[2rem] p-7 transition-all duration-500 overflow-hidden flex flex-col justify-between bg-white/[0.03] border border-white/[0.08] hover:border-primary/40 hover:bg-white/[0.05] hover:shadow-[0_10px_40px_rgba(242,170,76,0.15)] hover:-translate-y-2 backdrop-blur-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="absolute top-5 right-5 z-20">
                                        <button
                                            onClick={(e) => deleteAnalysis(e, item.id)}
                                            className="p-2.5 rounded-full bg-black/40 border border-white/10 text-white/30 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="relative z-10 mb-8">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(242,170,76,0.1)] group-hover:scale-110 transition-transform duration-500">
                                                <Briefcase className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-primary/60 transition-colors">
                                                {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </div>
                                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-white leading-tight pr-12 group-hover:text-white transition-colors">
                                            {item.company_name}
                                        </h3>
                                        <p className="text-primary/70 font-medium mt-2 text-sm line-clamp-2">
                                            {item.position}
                                        </p>
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-3 mt-auto">
                                        {hasAnalysis && (
                                            <Link
                                                href={`/analyze?id=${item.id}`}
                                                className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group/btn"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-white/50 group-hover/btn:text-white transition-colors" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/70 group-hover/btn:text-white transition-colors">View Analysis</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-white/30 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                                            </Link>
                                        )}

                                        {hasCustomization ? (
                                            <Link
                                                href={`/customize?id=${item.id}`}
                                                className="flex items-center justify-between px-5 py-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all group/btn shadow-[0_0_20px_rgba(242,170,76,0.05)] hover:shadow-[0_0_30px_rgba(242,170,76,0.2)]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-4 h-4 text-primary group-hover/btn:animate-pulse" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary transition-colors">Open Customized Resume</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-primary/50 group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" />
                                            </Link>
                                        ) : hasAnalysis && (
                                            <Link
                                                href={`/customize?id=${item.id}`}
                                                className="flex items-center justify-between px-5 py-4 rounded-2xl bg-transparent border border-dashed border-primary/30 hover:bg-primary/5 hover:border-primary/60 transition-all group/btn"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-4 h-4 text-primary/50 group-hover/btn:text-primary transition-colors" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary/60 group-hover/btn:text-primary transition-colors">Customize Resume</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-primary/30 group-hover/btn:text-primary group-hover/btn:translate-x-1 transition-all" />
                                            </Link>
                                        )}

                                        {!hasAnalysis && !hasCustomization && (
                                            <div className="px-5 py-4 rounded-2xl text-center bg-white/5 border border-white/5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Processing...</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                </div>
                            );
                        })}
                    </div>

                    {hasNextPage && (
                        <div className="flex justify-center mt-12 mb-8">
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none group shadow-[0_0_20px_rgba(242,170,76,0.02)] hover:shadow-[0_0_30px_rgba(242,170,76,0.1)]"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading Next Page...
                                    </>
                                ) : (
                                    <>
                                        Load More Archive Logs
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
