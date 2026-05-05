"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ResumeUpload } from "./resume-upload";
import { AnalysisReport } from "./components/analysis-report";
import { ActiveWorkspace } from "./components/active-workspace";
import { Navbar } from "@/components/layout/navbar";
import { FileText, Search, Cpu } from "lucide-react";
import { useResumeProfile } from "./hooks/use-resume-profile";
import { useResumeHistory } from "./hooks/use-resume-history";

export function ResumeFeature({ mode: initialMode, selectedId }: { mode: "analysis" | "customize", selectedId?: string | null }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [mode, setMode] = useState(initialMode);
    const [user, setUser] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [serverError, setServerError] = useState<string | null>(null);
    const [jobLocation, setJobLocation] = useState("");
    const [jobType, setJobType] = useState("");

    const loadingMessages = [
        "Indexing resume context...",
        "Analyzing JD...",
        "Finding matches...",
        "Optimizing LaTeX..."
    ];

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
        hasExistingResume, setHasExistingResume 
    } = useResumeProfile(user);

    const { 
        isHistoryLoading, 
        jobData, setJobData, 
        analysisState, setAnalysisState 
    } = useResumeHistory(selectedId, user, mode);

    useEffect(() => {
        if (searchParams) {
            const company = searchParams.get("company");
            const role = searchParams.get("role");
            const location = searchParams.get("location");
            const type = searchParams.get("jobType");
            const jd = searchParams.get("jd");
            
            if (company || role || jd) {
                setJobData(p => ({
                    ...p,
                    company: company || p.company,
                    role: role || p.role,
                    description: jd || p.description
                }));
            }
            if (location) setJobLocation(location);
            if (type) setJobType(type);
        }
    }, [searchParams, setJobData]);

    useEffect(() => {
        if (pathname.includes("/customize")) setMode("customize");
        else if (pathname.includes("/analyze")) setMode("analysis");
    }, [pathname]);

    const handleSwitchMode = async (newMode: "analysis" | "customize") => {
        if (newMode === mode) return;

        // Preserve current ID if it exists
        const id = analysisState.currentAnalysisId || selectedId;
        const targetRoute = newMode === "customize" ? "/customize" : "/analyze";
        const url = id ? `${targetRoute}?id=${id}` : targetRoute;
        
        router.push(url);
    };

    const analyzeResume = async (text: string, targetMode?: "analysis" | "customize") => {
        setIsAnalyzing(true);
        setAnalysisState(prev => ({ ...prev, analysis: "" }));
        setServerError(null);
        setLoadingStep(0);
        const effectiveMode = targetMode || mode;

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 3000);

        try {
            const supabase = createClient();
            let targetId = analysisState.currentAnalysisId;

            if (!targetId && user && jobData.company && jobData.role) {
                const { data: newAnalysis } = await supabase
                    .from("analyses")
                    .insert({
                        user_id: user.id,
                        resume_text: extractedText || "",
                        job_description: jobData.description,
                        company_name: jobData.company,
                        position: jobData.role,
                        short_title: `${jobData.company} - ${jobData.role}`,
                    })
                    .select()
                    .single();
                if (newAnalysis) targetId = newAnalysis.id;
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Analysis failed");
            }
            
            const resData = await response.json();
            
            if (effectiveMode === "customize") {
                setAnalysisState(prev => ({ ...prev, analysis: resData.analysis, cachedCustomize: resData.analysis }));
            } else {
                setAnalysisState(prev => ({ 
                    ...prev, 
                    analysis: resData.analysis, 
                    cachedAnalysis: resData.analysis,
                    insights: { ...resData.metadata, toolUsed: resData.toolUsed !== "none" ? resData.toolUsed.split(", ") : [] }
                }));
            }
        } catch (error: any) {
            setServerError(error.message || "Analysis failed. Please try again.");
            toast.error("Generation failed.");
        } finally {
            clearInterval(stepInterval);
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

    return (
        <div className="flex flex-col min-h-screen w-full bg-background relative overflow-x-hidden no-scrollbar">
            <Navbar username={username} showMenuButton={false} />
            <main className="relative z-10 flex items-start justify-center p-0 md:px-4 md:pt-2 md:pb-0 overflow-x-hidden">
                {isHistoryLoading ? (
                    <div className="w-full flex flex-col items-center justify-center pt-32 space-y-8 animate-in fade-in duration-700">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping" />
                            <FileText className="w-10 h-10 text-white/20" />
                            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                                <Search className="w-6 h-6 text-primary drop-shadow-[0_0_10px_rgba(242,170,76,0.4)]" />
                            </div>
                        </div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">Restoring Archive</h2>
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto flex flex-col w-full overflow-x-hidden">
                        <div className={analysisState.analysis || isAnalyzing || serverError ? "block" : "hidden"}>
                            <AnalysisReport
                                analysis={analysisState.analysis}
                                isAnalyzing={isAnalyzing}
                                loadingStep={loadingStep}
                                loadingMessages={loadingMessages}
                                companyName={jobData.company}
                                position={jobData.role}
                                onReset={resetSession}
                                mode={mode}
                                onSwitchMode={handleSwitchMode}
                                isHistoryMode={!!analysisState.currentAnalysisId}
                                hasCustomization={analysisState.hasCustomization}
                                insights={analysisState.insights}
                                serverError={serverError}
                            />
                        </div>
                        <div className={!analysisState.analysis && !isAnalyzing && !serverError ? "block" : "hidden"}>
                            <ActiveWorkspace
                                mainTab={mode}
                                onBack={() => window.location.href = "/"}
                                companyName={jobData.company}
                                setCompanyName={(v) => setJobData(p => ({ ...p, company: v }))}
                                position={jobData.role}
                                setPosition={(v) => setJobData(p => ({ ...p, role: v }))}
                                location={jobLocation}
                                setLocation={setJobLocation}
                                jobType={jobType}
                                setJobType={setJobType}
                                jobDescription={jobData.description}
                                setJobDescription={(v) => setJobData(p => ({ ...p, description: v }))}
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
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
