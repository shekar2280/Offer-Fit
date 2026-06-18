import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/services/supabase/client";
import { User } from "@supabase/supabase-js";
import { clearDraft } from "./use-draft-persistence";
import { LOADING_MESSAGES } from "@/config/constants";
import { AnalysisResult } from "@/types";
import { stringifyJdText } from "@/lib/utils";

interface UseResumeActionsProps {
    mode: "analysis" | "customize";
    user: User | null;
    selectedId: string | null | undefined;
    jobData: { company: string; role: string; description: string };
    jobLocation: string;
    jobType: string;
    latexText: string | null;
    extractedText: string | null;
    analysisState: any;
    setAnalysisState: (updater: any) => void;
    setExtractedText: (text: string | null) => void;
    setLatexText: (text: string | null) => void;
    setHasExistingResume: (val: boolean) => void;
    setJobData: (updater: any) => void;
    setJobLocation: (val: string) => void;
    setJobType: (val: string) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    isAnalyzing: boolean;
    setIsAnalyzing: (val: boolean) => void;
}

export function useResumeActions({
    mode,
    user,
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
    scrollContainerRef,
    isAnalyzing,
    setIsAnalyzing,
}: UseResumeActionsProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [isUploading, setIsUploading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);

    const resetSession = () => {
        setJobLocation("");
        setJobType("");
        setJobData({ company: "", role: "", description: "" });
        clearDraft("analysis");
        clearDraft("customize");
        router.push(mode === "customize" ? "/customize" : "/analyze", { scroll: false });
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
        } catch { toast.error("Failed to save to profile."); }
    };

    const handleFile = async (file: File, uploadMode: "analysis" | "customize" = "analysis") => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("parseMode", uploadMode);
        try {
            const res = await fetch("/api/parse", { method: "POST", body: formData });
            const data = await res.json();
            if (data.text) {
                const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
                const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx");

                if (isPdf) {
                    setExtractedText(data.text);
                    if (user) {
                        const supabase = createClient();
                        await supabase.from("profiles").update({ resume_text: data.text }).eq("id", user.id);

                        await fetch("/api/index", {
                            method: "POST",
                            body: JSON.stringify({ text: data.text }),
                        });
                    }
                } else if (isDocx) {
                    if (uploadMode === "customize") {
                        setLatexText(data.text);
                        if (user) {
                            const supabase = createClient();
                            await supabase.from("profiles").update({ latex_source: data.text }).eq("id", user.id);
                        }
                    } else {
                        setExtractedText(data.text);
                        setLatexText(data.text);
                        if (user) {
                            const supabase = createClient();
                            await supabase.from("profiles").update({ resume_text: data.text, latex_source: data.text }).eq("id", user.id);

                            await fetch("/api/index", {
                                method: "POST",
                                body: JSON.stringify({ text: data.text }),
                            });
                        }
                    }
                } else {
                    setLatexText(data.text);
                    if (user) {
                        const supabase = createClient();
                        await supabase.from("profiles").update({ latex_source: data.text }).eq("id", user.id);
                    }
                }
            }
        } catch {
            toast.error("Upload failed");
        } finally { setIsUploading(false); }
    };

    const analyzeResume = async (text: string, targetMode?: "analysis" | "customize") => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
        const effectiveMode = targetMode || mode;
        setIsAnalyzing(true);
        if (effectiveMode === "customize") {
            setAnalysisState((prev: any) => ({ ...prev, analysis: "" }));
        } else {
            setAnalysisState((prev: any) => ({ ...prev, analysis: "", insights: null }));
        }
        setServerError(null);
        setLoadingStep(0);

        try {
            const supabase = createClient();
            let targetId = analysisState.currentAnalysisId || selectedId;

            if (!targetId && user && jobData.company && jobData.role) {
                let extractedPillars = null;
                try {
                    const pillarsRes = await fetch("/api/extract-pillars", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ jd: jobData.description }),
                    });
                    if (pillarsRes.ok) {
                        const pillarsData = await pillarsRes.json();
                        extractedPillars = pillarsData.pillars;
                    }
                } catch (e) {
                }

                const { data: newAnalysis, error } = await supabase
                    .from("analyses")
                    .insert({
                        user_id: user.id,
                        jd_text: stringifyJdText(jobData.description, jobLocation, jobType),
                        company_name: jobData.company,
                        position: jobData.role,
                        jd_pillars: extractedPillars,
                        status: 'started'
                    })
                    .select()
                    .single();

                if (error) {
                    toast.error("Failed to initialize session. Please try again.");
                    setIsAnalyzing(false);
                    return;
                }
                if (newAnalysis) {
                    targetId = newAnalysis.id;
                    setAnalysisState((prev: any) => ({ ...prev, currentAnalysisId: newAnalysis.id }));
                    router.replace(`${effectiveMode === "customize" ? "/customize" : "/analyze"}?id=${newAnalysis.id}`, { scroll: false });
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

                    let event: {
                        type?: string;
                        step?: number;
                        message?: string;
                        error?: string;
                        toolUsed?: string;
                        analysis?: string;
                        metadata?: {
                            audit?: unknown;
                            strategy?: unknown;
                            intel?: unknown;
                            match_score?: number;
                            verdict?: string;
                            ats_score?: number;
                            [key: string]: unknown;
                        }
                    };
                    try { event = JSON.parse(dataPart); } catch { continue; }

                    if (event.type === "progress") {
                        if (event.step !== undefined) {
                            setLoadingStep(event.step - 1);
                            if (event.message !== undefined) {
                                LOADING_MESSAGES[event.step - 1] = event.message;
                            }
                        }
                    } else if (event.type === "result") {
                        clearDraft(effectiveMode === "customize" ? "customize" : "analysis");

                        const commonMetadata = {
                            ...(event.metadata || {}),
                            audit_report: event.metadata?.audit,
                            toolUsed: event.toolUsed !== "none" ? event.toolUsed : undefined
                        } as Partial<AnalysisResult>;

                        if (targetId) {
                            queryClient.setQueryData(["analysis", targetId], (oldData: Record<string, unknown> | undefined) => {
                                const baseData = (oldData || { id: targetId }) as any;
                                const newData = { ...baseData } as any;

                                if (effectiveMode === "customize") {
                                    newData.customized_latex = event.analysis;
                                    newData.customization_strategy = commonMetadata.strategy;
                                    newData.audit_report = commonMetadata.audit_report;
                                    newData.intel = commonMetadata.intel || baseData.intel;
                                } else {
                                    newData.analysis_result = event.analysis;
                                    newData.match_score = commonMetadata.match_score;
                                    newData.verdict = commonMetadata.verdict;
                                    newData.ats_score = commonMetadata.ats_score;
                                    newData.intel = commonMetadata.intel || baseData.intel;
                                }

                                Object.assign(newData, commonMetadata);
                                return newData;
                            });
                            queryClient.invalidateQueries({ queryKey: ["history", "infinite"] });
                        }

                        if (effectiveMode === "customize") {
                            setAnalysisState((prev: any) => ({
                                ...prev,
                                analysis: event.analysis,
                                insights: {
                                    ...prev.insights,
                                    ...commonMetadata
                                },
                                cachedCustomize: event.analysis,
                                hasCustomization: true
                            }));
                        } else {
                            setAnalysisState((prev: any) => ({
                                ...prev,
                                analysis: event.analysis,
                                insights: commonMetadata,
                                cachedAnalysis: event.analysis,
                            }));
                        }
                    } else if (event.type === "error") {
                        throw new Error(event.error || "Analysis failed");
                    }
                }
            }
        } catch (error: unknown) {
            const err = error as Error;
            setServerError(err.message || "Analysis failed. Please try again.");
            toast.error("Generation failed.");
        } finally {
            setIsAnalyzing(false);
            if (user) {
                queryClient.invalidateQueries({ queryKey: ["usage", user.id] });
            }
        }
    };

    return {
        isAnalyzing,
        isUploading,
        loadingStep,
        serverError,
        setServerError,
        resetSession,
        saveBaselineLatex,
        handleFile,
        analyzeResume,
    };
}
