"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AnalysisReport } from "./components/analysis-report";
import { ActiveWorkspace } from "./components/active-workspace";
import { Navbar } from "@/components/layout/navbar";
import { useResumeProfile } from "./hooks/use-resume-profile";
import { useResumeHistory } from "./hooks/use-resume-history";
import { useResumeActions } from "./hooks/use-resume-actions";
import { LOADING_MESSAGES, USAGE_LIMITS } from "@/config/constants";
import { useAnalysis } from "@/components/providers/analysis-provider";
import { useWorkspaceUI } from "@/components/providers/workspace-ui-provider";
import { AnalysisReportSkeleton, CustomizeReportSkeleton } from "@/components/ui/skeletons";
import { useDraftPersistence, clearDraft } from "./hooks/use-draft-persistence";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { AnalysisResult } from "@/types";

export function ResumeFeature({
    mode: _initialMode,
    selectedId,
    initialData
}: {
    mode: "analysis" | "customize",
    selectedId?: string | null,
    initialData?: {
        companyName?: string;
        position?: string;
        jd?: string;
        location?: string;
        jobType?: string;
    }
}) {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();

    const mode: "analysis" | "customize" = pathname.includes("/customize") ? "customize" : "analysis";
    const [jobLocation, setJobLocation] = useState(initialData?.location || "");
    const [jobType, setJobType] = useState(initialData?.jobType || "");
    const [isEditingForm, setIsEditingForm] = useState(false);

    const { data: user } = useQuery<User | null>({
        queryKey: ["user"],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const { data: usage } = useQuery({
        queryKey: ["usage", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const supabase = createClient();
            const { data } = await supabase
                .from("user_usage")
                .select("daily_count, last_request_at")
                .eq("user_id", user.id)
                .single();
            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 30,
    });

    const {
        extractedText, setExtractedText,
        latexText, setLatexText,
        hasExistingResume, setHasExistingResume
    } = useResumeProfile(user ?? null);

    const {
        isHistoryLoading,
        jobData, setJobData,
        analysisState, setAnalysisState
    } = useResumeHistory(selectedId, user ?? null, mode);

    useEffect(() => {
        if (initialData) {
            setJobData((prev) => ({
                company: initialData.companyName || prev.company,
                role: initialData.position || prev.role,
                description: initialData.jd || prev.description
            }));
            if (initialData.location) setJobLocation(initialData.location);
            if (initialData.jobType) setJobType(initialData.jobType);
        }
    }, [initialData, setJobData]);

    const { state: globalState } = useAnalysis();

    const { saveScrollPosition, getScrollPosition } = useWorkspaceUI();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const companyInputRef = useRef<HTMLInputElement>(null);

    const {
        isAnalyzing,
        isUploading,
        loadingStep,
        serverError,
        setServerError,
        resetSession,
        saveBaselineLatex,
        handleFile,
        analyzeResume,
    } = useResumeActions({
        mode,
        user: user ?? null,
        selectedId,
        jobData,
        jobLocation,
        jobType,
        latexText,
        extractedText,
        analysisState,
        setAnalysisState,
        setExtractedText,
        setLatexText,
        setHasExistingResume,
        setJobData,
        setJobLocation,
        setJobType,
        scrollContainerRef
    });

    useEffect(() => {
        if (!selectedId && !globalState.id && !globalState.jd && !globalState.companyName) {
            setJobLocation("");
            setJobType("");
            setServerError(null);
            setLatexText(null);
            setExtractedText(null);
        }
    }, [selectedId, globalState.id, globalState.jd, globalState.companyName, setServerError]);



    useEffect(() => {
        const el = scrollContainerRef.current;
        return () => {
            if (el) saveScrollPosition(pathname, el.scrollTop);
        };
    }, [pathname, saveScrollPosition]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const savedOffset = getScrollPosition(pathname);
            el.scrollTop = savedOffset;
        }
    }, [pathname]);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.scrollTop = 0;
        }
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
    }, [selectedId, mode, isAnalyzing]);

    useDraftPersistence({
        mode,
        selectedId: selectedId ?? null,
        company: jobData.company,
        role: jobData.role,
        description: jobData.description,
        location: jobLocation,
        jobType,
        onRestoreDraft: (draft) => {
            setJobData({ company: draft.company, role: draft.role, description: draft.description });
            if (draft.location) setJobLocation(draft.location);
            if (draft.jobType) setJobType(draft.jobType);
            toast.info("Draft restored", { description: "Your previous session was recovered." });
        },
    });

    const isOverQuota = (() => {
        if (!usage) return false;
        const now = new Date();
        const lastRequest = usage.last_request_at ? new Date(usage.last_request_at) : new Date(0);
        const msSinceLast = now.getTime() - lastRequest.getTime();

        const dailyCount = msSinceLast > USAGE_LIMITS.DAILY_REFRESH_MS ? 0 : usage.daily_count;

        return dailyCount >= USAGE_LIMITS.DAILY_QUOTA;
    })();

    const isSubmitReady = !isAnalyzing && !isUploading && !isOverQuota &&
        (mode === "customize" ? !!latexText : !!extractedText) &&
        !!jobData.description && !!jobData.company && !!jobData.role;

    useKeyboardShortcuts({
        disabled: isAnalyzing || isUploading,
        onSubmit: () => {
            if (!isSubmitReady) return;
            toast.info("⌘↵ Analyzing...", { duration: 1500 });
            analyzeResume(mode === "customize" ? (latexText || "") : (extractedText || ""));
        },
        onFocusSearch: () => {
            companyInputRef.current?.focus();
            companyInputRef.current?.select();
        },
        onEscape: () => {
            if (!isAnalyzing) resetSession();
        },
    });

    const handleSwitchMode = (newMode: "analysis" | "customize") => {
        if (newMode === mode) return;

        const id = analysisState.currentAnalysisId || selectedId;
        const targetRoute = newMode === "customize" ? "/customize" : "/analyze";
        const cleanUrl = id ? `${targetRoute}?id=${id}` : targetRoute;

        router.replace(cleanUrl, { scroll: false });
    };

    const displayName: string =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        "you";

    const username = displayName;

    const hasReportData = mode === "analysis" ? !!analysisState.analysis : analysisState.hasCustomization;
    const showReport = (!!((selectedId && hasReportData) || isAnalyzing || isHistoryLoading || serverError) && !isEditingForm);

    return (
        <div className="flex flex-col min-h-screen w-full bg-background relative">
            <Navbar
                username={username}
                showMenuButton={false}
                usage={usage}
            />
            <main ref={scrollContainerRef} className="relative z-10 flex items-start justify-center p-0 md:px-4 md:pt-2 md:pb-0 overflow-y-auto min-h-[calc(100vh-68px)]">
                {isHistoryLoading && !jobData.company ? (
                    <div className="max-w-[1400px] mx-auto w-full p-4 md:px-0">
                        {mode === "customize" ? <CustomizeReportSkeleton /> : <AnalysisReportSkeleton />}
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto flex flex-col w-full overflow-x-hidden">
                        <div className={showReport ? "block" : "hidden"}>
                            <AnalysisReport
                                analysis={analysisState.analysis}
                                isAnalyzing={isAnalyzing || isHistoryLoading}
                                loadingStep={loadingStep}
                                loadingMessages={LOADING_MESSAGES}
                                companyName={jobData.company}
                                position={jobData.role}
                                analysisId={analysisState.currentAnalysisId || globalState.id || ""}
                                onReset={resetSession}
                                mode={mode}
                                onSwitchMode={handleSwitchMode}
                                isHistoryMode={!!analysisState.currentAnalysisId}
                                hasCustomization={analysisState.hasCustomization}
                                insights={analysisState.insights}
                                serverError={serverError}
                                isEditingForm={isEditingForm}
                                onToggleForm={() => setIsEditingForm(!isEditingForm)}
                                userName={displayName}
                                hasLatexSource={!!latexText}
                                originalLatex={latexText}
                            />
                        </div>
                        <div className={!showReport ? "block" : "hidden"}>
                            <ActiveWorkspace
                                mainTab={mode}
                                onBack={() => router.push("/", { scroll: false })}
                                companyName={jobData.company}
                                setCompanyName={(v) => setJobData((p) => ({ ...p, company: v }))}
                                position={jobData.role}
                                setPosition={(v) => setJobData((p) => ({ ...p, role: v }))}
                                location={jobLocation}
                                setLocation={setJobLocation}
                                jobType={jobType}
                                setJobType={setJobType}
                                jobDescription={jobData.description}
                                setJobDescription={(v) => setJobData((p) => ({ ...p, description: v }))}
                                latexText={latexText}
                                setLatexText={setLatexText}
                                extractedText={extractedText}
                                handleFile={handleFile}
                                isUploading={isUploading}
                                isAnalyzing={isAnalyzing}
                                hasExistingResume={hasExistingResume}
                                setExtractedText={setExtractedText}
                                setHasExistingResume={setHasExistingResume}
                                analyzeResume={analyzeResume}
                                selectedId={analysisState.currentAnalysisId}
                                onReset={resetSession}
                                saveBaselineLatex={saveBaselineLatex}
                                onSwitchMode={handleSwitchMode}
                                companyInputRef={companyInputRef}
                                isOverQuota={isOverQuota}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
