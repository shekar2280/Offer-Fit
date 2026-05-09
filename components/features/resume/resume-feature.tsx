"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AnalysisReport } from "./components/analysis-report";
import { ActiveWorkspace } from "./components/active-workspace";
import { Navbar } from "@/components/layout/navbar";
import { useResumeProfile } from "./hooks/use-resume-profile";
import { useResumeHistory } from "./hooks/use-resume-history";
import { LOADING_MESSAGES } from "@/lib/constants";
import { useAnalysis } from "@/lib/context/analysis-context";
import { useWorkspaceUI } from "@/lib/context/workspace-ui-context";
import { AnalysisReportSkeleton, CustomizeReportSkeleton } from "@/components/ui/skeletons";
import { useDraftPersistence, clearDraft } from "./hooks/use-draft-persistence";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";

export function ResumeFeature({ 
    mode: initialMode, 
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

    const mode: "analysis" | "customize" = pathname.includes("/customize") ? "customize" : "analysis";
    const [user, setUser] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);
    const [jobLocation, setJobLocation] = useState(initialData?.location || "");
    const [jobType, setJobType] = useState(initialData?.jobType || "");
    const [isEditingForm, setIsEditingForm] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    const { 
        extractedText, setExtractedText, 
        latexText, setLatexText, 
        hasExistingResume, setHasExistingResume,
        masterLatex, masterExtractedText
    } = useResumeProfile(user);

    const { 
        isHistoryLoading, 
        jobData, setJobData, 
        analysisState, setAnalysisState 
    } = useResumeHistory(selectedId, user, mode);

    useEffect(() => {
        if (initialData) {
            setJobData((prev: any) => ({
                company: initialData.companyName || prev.company,
                role: initialData.position || prev.role,
                description: initialData.jd || prev.description
            }));
            if (initialData.location) setJobLocation(initialData.location);
            if (initialData.jobType) setJobType(initialData.jobType);
        }
    }, [initialData, setJobData]);

    const { state: globalState } = useAnalysis();

    useEffect(() => {
        if (!selectedId && !globalState.id && !globalState.jd && !globalState.companyName) {
            setJobLocation("");
            setJobType("");
            setServerError(null);
            setLatexText(null);
            setExtractedText(null);
        }
    }, [selectedId, globalState.id, globalState.jd, globalState.companyName]);

    useEffect(() => {
        const canAutoStart = 
            mode === "customize" && 
            !isHistoryLoading && 
            !isAnalyzing && 
            !analysisState.analysis && 
            jobData.description && 
            latexText; 

        if (canAutoStart) {
            analyzeResume(latexText || extractedText || "");
        }
    }, [mode, isHistoryLoading, isAnalyzing, analysisState.analysis, jobData.description, latexText, extractedText]);

    const { saveScrollPosition, getScrollPosition, setLastRoute } = useWorkspaceUI();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const companyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            const el = scrollContainerRef.current;
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

    const isSubmitReady = !isAnalyzing && !isUploading &&
        (mode === "customize" ? !!latexText : !!extractedText) &&
        !!jobData.description && !!jobData.company && !!jobData.role;

    useKeyboardShortcuts({
        disabled: isAnalyzing || isUploading,
        onSubmit: () => {
            if (!isSubmitReady) return;
            toast.info("⌘↵ Analyzing...", { duration: 1500 });
            mode === "customize"
                ? analyzeResume(latexText || "")
                : analyzeResume(extractedText || "");
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


    const analyzeResume = async (text: string, targetMode?: "analysis" | "customize") => {
        setIsAnalyzing(true);
        setAnalysisState((prev: any) => ({ ...prev, analysis: "", insights: null }));
        setServerError(null);
        setLoadingStep(0);
        const effectiveMode = targetMode || mode;

        try {
            const supabase = createClient();
            let targetId = analysisState.currentAnalysisId || selectedId;

            if (!targetId && user && jobData.company && jobData.role) {
                const { data: newAnalysis, error } = await supabase
                    .from("analyses")
                    .insert({
                        user_id: user.id,
                        jd_text: jobData.description,
                        company_name: jobData.company,
                        position: jobData.role
                    })
                    .select()
                    .single();

                if (error) {
                    console.error("Initial analysis creation failed:", error);
                    toast.error("Failed to initialize session. Please try again.");
                    setIsAnalyzing(false);
                    return;
                }
                if (newAnalysis) {
                    targetId = newAnalysis.id;
                    setAnalysisState((prev: any) => ({ ...prev, currentAnalysisId: newAnalysis.id }));
                    router.replace(`/analyze?id=${newAnalysis.id}`, { scroll: false });
                }
            }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: jobData.description }],
                    analysisId: targetId,
                    companyName: jobData.company,
                    position: jobData.role,
                    location: jobLocation,
                    jobType,
                    resumeText: effectiveMode === "customize" ? (latexText || extractedText) : extractedText,
                    mode: effectiveMode,
                }),
            });

            if (!response.ok || !response.body) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Analysis failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() ?? ""; 

                for (const line of lines) {
                    const dataPart = line.replace(/^data: /, "").trim();
                    if (!dataPart) continue;

                    let event: any;
                    try { event = JSON.parse(dataPart); } catch { continue; }

                    if (event.type === "progress") {
                        setLoadingStep(event.step - 1);
                        LOADING_MESSAGES[event.step - 1] = event.message;
                    } else if (event.type === "result") {
                        clearDraft(effectiveMode === "customize" ? "customize" : "analysis");
                        
                        const commonState = {
                            analysis: event.analysis,
                            insights: {
                                ...event.metadata,
                                toolUsed: event.toolUsed !== "none" ? event.toolUsed?.split(", ") : []
                            }
                        };

                        if (effectiveMode === "customize") {
                            setAnalysisState((prev: any) => ({
                                ...prev,
                                ...commonState,
                                cachedCustomize: event.analysis,
                                hasCustomization: true
                            }));
                        } else {
                            setAnalysisState((prev: any) => ({
                                ...prev,
                                ...commonState,
                                cachedAnalysis: event.analysis,
                            }));
                        }
                    } else if (event.type === "error") {
                        throw new Error(event.error || "Analysis failed");
                    }
                }
            }
        } catch (error: any) {
            setServerError(error.message || "Analysis failed. Please try again.");
            toast.error("Generation failed.");
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleFile = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/parse", { method: "POST", body: formData });
            const data = await res.json();
            if (data.text) {
                if (file.type === "application/pdf") {
                    setExtractedText(data.text);
                    const supabase = createClient();
                    await supabase.from("profiles").update({ resume_text: data.text }).eq("id", user.id);
                    
                    await fetch("/api/index", {
                        method: "POST",
                        body: JSON.stringify({ text: data.text }),
                    });
                }
                else setLatexText(data.text);
            }
        } catch (error) {
            toast.error("Upload failed");
        } finally { setIsUploading(false); }
    };

    const resetSession = () => {
        setExtractedText(null);
        setLatexText("");
        setJobLocation("");
        setJobType("");
        setJobData({ company: "", role: "", description: "" });
        setAnalysisState({ analysis: "", cachedAnalysis: "", cachedCustomize: "", currentAnalysisId: null, hasCustomization: false, insights: null });
        setHasExistingResume(false);
        setServerError(null);
        setIsEditingForm(false);
        clearDraft("analysis");
        clearDraft("customize");
        router.push("/", { scroll: false });
    };

    const saveBaselineLatex = async () => {
        if (!user || !latexText) return;
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("profiles")
                .upsert({ id: user.id, latex_source: latexText, email: user.email }, { onConflict: 'id' });
            if (error) throw error;
            setHasExistingResume(true);
            toast.success("Master LaTeX saved to your profile!");
        } catch (error) { toast.error("Failed to save to profile."); }
    };

    const username = user?.email?.split('@')[0] || "User";

    const showReport = !!(selectedId || analysisState.analysis || isAnalyzing || isHistoryLoading || serverError || (mode === "customize" && jobData.description && latexText)) && !isEditingForm;

    return (
        <div className="flex flex-col min-h-screen w-full bg-background relative">
            <Navbar 
                username={username} 
                showMenuButton={false} 
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
                                onReset={resetSession}
                                mode={mode}
                                onSwitchMode={handleSwitchMode}
                                isHistoryMode={!!analysisState.currentAnalysisId}
                                hasCustomization={analysisState.hasCustomization}
                                insights={analysisState.insights}
                                serverError={serverError}
                                isEditingForm={isEditingForm}
                                onToggleForm={() => setIsEditingForm(!isEditingForm)}
                            />
                        </div>
                        <div className={!showReport ? "block" : "hidden"}>
                            <ActiveWorkspace
                                mainTab={mode}
                                onBack={() => router.push("/", { scroll: false })}
                                companyName={jobData.company}
                                setCompanyName={(v) => setJobData((p: any) => ({ ...p, company: v }))}
                                position={jobData.role}
                                setPosition={(v) => setJobData((p: any) => ({ ...p, role: v }))}
                                location={jobLocation}
                                setLocation={setJobLocation}
                                jobType={jobType}
                                setJobType={setJobType}
                                jobDescription={jobData.description}
                                setJobDescription={(v) => setJobData((p: any) => ({ ...p, description: v }))}
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
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
