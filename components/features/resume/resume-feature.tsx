"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ResumeUpload } from "./resume-upload";
import { AnalysisReport } from "./components/analysis-report";
import { ActiveWorkspace } from "./components/active-workspace";
import { Navbar } from "@/components/layout/navbar";
import { FileText, Search } from "lucide-react";

export function ResumeFeature({ mode: initialMode, selectedId }: { mode: "analysis" | "customize", selectedId?: string | null }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [mode, setMode] = useState(initialMode);
    useEffect(() => {
        if (pathname.includes("/customize")) setMode("customize");
        else if (pathname.includes("/analyze")) setMode("analysis");
    }, [pathname]);
    const [latexText, setLatexText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [position, setPosition] = useState("");
    const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [isHistoryLoading, setIsHistoryLoading] = useState(!!selectedId);
    const [hasExistingResume, setHasExistingResume] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [cachedAnalysis, setCachedAnalysis] = useState<string>("");
    const [cachedCustomize, setCachedCustomize] = useState<string>("");
    const [hasCustomization, setHasCustomization] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [insights, setInsights] = useState<{
        matchScore: number;
        verdict: string;
        atsScore: number;
        keywordDensity: number;
        matchedSkills: string[];
        missingSkills: string[];
        salaryInsight?: { range: string; currency: string; seniority: string };
        redFlags?: string[];
        interviewQuestions?: { q: string; intent: string }[];
        outreachEmail?: string;
    } | null>(null);

    const handleSwitchMode = async (newMode: "analysis" | "customize") => {
        if (newMode === mode) return;

        if (newMode === "customize" && cachedCustomize) {
            setMode("customize");
            setAnalysis(cachedCustomize);
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
        }
        if (newMode === "analysis" && cachedAnalysis) {
            setMode("analysis");
            setAnalysis(cachedAnalysis);
            window.scrollTo({ top: 0, behavior: "instant" });
            return;
        }

        setMode(newMode);
        window.scrollTo({ top: 0, behavior: "instant" });
        let url: string;
        if (currentAnalysisId) {
            url = `/${newMode}?id=${currentAnalysisId}`;
        } else {
            const company = searchParams.get("company");
            const role = searchParams.get("role");
            const jd = searchParams.get("jd");
            if (company || role || jd) {
                const params = new URLSearchParams();
                if (company) params.set("company", company);
                if (role) params.set("role", role);
                if (jd) params.set("jd", jd);
                url = `/${newMode}?${params.toString()}`;
            } else {
                url = `/${newMode}`;
            }
        }
        window.history.pushState({}, "", url);
        if (!currentAnalysisId || (newMode === "customize" && !cachedCustomize)) {
            analyzeResume(newMode === "customize" ? (latexText || extractedText || "") : (extractedText || ""), newMode);
        }
    };

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

    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            const supabase = createClient();
            const { data: profile } = await supabase
                .from("profiles")
                .select("resume_text, latex_source")
                .eq("id", user.id)
                .maybeSingle();

            if (profile) {
                if (profile.resume_text) {
                    setExtractedText(profile.resume_text);
                    setHasExistingResume(true);
                }
                if (profile.latex_source) setLatexText(profile.latex_source);
            }
        };
        fetchProfile();
    }, [user]);

    const prevJobRef = React.useRef({ company: "", role: "", jd: "", id: "" });

    useEffect(() => {
        if (!user) return;

        const jdParam = searchParams.get("jd") || "";
        const companyParam = searchParams.get("company") || "";
        const roleParam = searchParams.get("role") || "";

        if (selectedId) {
            if (prevJobRef.current.id === selectedId) return;
            prevJobRef.current = { company: "", role: "", jd: "", id: selectedId };

            const fetchSavedAnalysis = async () => {
                try {
                    setIsHistoryLoading(true);
                    const supabase = createClient();
                    const { data } = await supabase
                        .from("analyses")
                        .select("*")
                        .eq("id", selectedId)
                        .single();

                    if (data) {
                        setJobDescription(data.job_description);
                        setCompanyName(data.company_name || "");
                        setPosition(data.position || "");
                        setCurrentAnalysisId(data.id);
                        const analysisContent = data.analysis_result || "";
                        const customizeContent = data.latex_source || "";
                        setCachedAnalysis(analysisContent);
                        setCachedCustomize(customizeContent);
                        setHasCustomization(data.has_customization || false);
                        setAnalysis(mode === "customize" ? customizeContent : analysisContent);

                        const atsScore = data.ats_score ?? 0;
                        const derivedVerdict = atsScore >= 70 ? "APPLY" : atsScore >= 50 ? "STRETCH" : "PASS";
                        if (data.ats_score != null || data.matched_skills?.length) {
                            setInsights({
                                matchScore: atsScore,
                                verdict: derivedVerdict,
                                atsScore: atsScore,
                                keywordDensity: data.keyword_density ?? 0,
                                matchedSkills: data.matched_skills || [],
                                missingSkills: data.missing_skills || [],
                                salaryInsight: data.salary_insight || undefined,
                                redFlags: data.red_flags || [],
                                interviewQuestions: data.interview_questions || [],
                                outreachEmail: data.outreach_email || undefined,
                            });
                        }
                    }
                } finally {
                    setIsHistoryLoading(false);
                }
            };
            fetchSavedAnalysis();
        } else if (jdParam || companyParam || roleParam) {
            const isNewJob = companyParam !== prevJobRef.current.company ||
                             roleParam !== prevJobRef.current.role ||
                             jdParam !== prevJobRef.current.jd;
            if (!isNewJob) return;
            prevJobRef.current = { company: companyParam, role: roleParam, jd: jdParam, id: "" };

            if (jdParam) setJobDescription(jdParam);
            if (companyParam) setCompanyName(companyParam);
            if (roleParam) setPosition(roleParam);
            setAnalysis("");
            setCachedAnalysis("");
            setCachedCustomize("");
            setCurrentAnalysisId(null);
        } else {
            prevJobRef.current = { company: "", role: "", jd: "", id: "" };
            setJobDescription("");
            setCompanyName("");
            setPosition("");
            setAnalysis("");
            setCachedAnalysis("");
            setCachedCustomize("");
            setCurrentAnalysisId(null);
            setInsights(null);
            setExtractedText(null);
            setLatexText("");
            setHasExistingResume(false);
            setHasCustomization(false);
            setServerError(null);
        }
    }, [selectedId, user, searchParams]);

    const resetSession = () => {
        setExtractedText(null);
        setLatexText("");
        setJobDescription("");
        setCompanyName("");
        setPosition("");
        setAnalysis("");
        setCachedAnalysis("");
        setCachedCustomize("");
        setCurrentAnalysisId(null);
        setHasExistingResume(false);
        setInsights(null);
        setHasCustomization(false);
        setServerError(null);
        prevJobRef.current = { company: "", role: "", jd: "", id: "" };
    };

    const saveBaselineLatex = async () => {
        if (!user || !latexText) return;
        
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("profiles")
                .upsert({ 
                    id: user.id,
                    latex_source: latexText,
                    email: user.email 
                }, { onConflict: 'id' });

            if (error) throw error;
            setHasExistingResume(true);
            toast.success("Master LaTeX saved to your profile!");
        } catch (error) {
            toast.error("Failed to save to profile.");
        }
    };

    const analyzeResume = async (text: string, targetMode?: "analysis" | "customize") => {
        setIsAnalyzing(true);
        setAnalysis("");
        setServerError(null);
        setLoadingStep(0);
        let accumulatedText = "";
        const effectiveMode = targetMode || mode;

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 3000);

        try {
            const supabase = createClient();
            let targetId = null;

            if (user && companyName && position) {
                const { data: existingAnalysis } = await supabase
                    .from("analyses")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("company_name", companyName)
                    .eq("position", position)
                    .maybeSingle();

                if (existingAnalysis) {
                    targetId = existingAnalysis.id;
                } else {
                    const { data: newAnalysis, error: insertError } = await supabase
                        .from("analyses")
                        .insert({
                            user_id: user.id,
                            resume_text: extractedText || "",
                            job_description: jobDescription,
                            company_name: companyName,
                            position: position,
                            short_title: `${companyName} - ${position}`,
                            has_customization: false
                        })
                        .select()
                        .single();

                    if (!insertError && newAnalysis) {
                        targetId = newAnalysis.id;
                    }
                }
            }

            if (targetId) {
                await fetch("/api/index", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ analysisId: targetId, text: extractedText || latexText || text })
                });
            }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: jobDescription }],
                    analysisId: targetId,
                    companyName,
                    position,
                    resumeText: effectiveMode === "customize" ? (latexText || extractedText) : extractedText,
                    goal: effectiveMode === "customize" ? "optimize" : "analyze"
                }),
            });

            if (!response.body) throw new Error("No response body");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullText = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunk = decoder.decode(value, { stream: !done });
                fullText += chunk;

                if (effectiveMode === "customize") {
                    setAnalysis(fullText);
                } else {
                    const displayPart = fullText.split("---METADATA---")[0];
                    setAnalysis(displayPart);
                }
            }

            accumulatedText = fullText;

            if (effectiveMode === "customize") {
                setCachedCustomize(fullText);
            } else {
                const parts = fullText.split("---METADATA---");
                const markdown = parts[0].trim();
                const jsonStr = parts[1]?.trim() || "{}";
                
                try {
                    const data = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || "{}");
                    setCachedAnalysis(markdown);
                    setInsights({
                        matchScore: data.matchScore ?? 0,
                        verdict: (data.verdict || "").toUpperCase(),
                        atsScore: data.atsScore ?? 0,
                        keywordDensity: data.keywordDensity ?? 0,
                        matchedSkills: data.matchedSkills || [],
                        missingSkills: data.missingSkills || [],
                        salaryInsight: data.salaryInsight,
                        redFlags: data.redFlags,
                        interviewQuestions: data.interviewQuestions,
                        outreachEmail: data.outreachEmail,
                    } as any);
                } catch (e) {
                    console.error("Failed to parse metadata", e);
                }
            }

            if (targetId && effectiveMode === "customize") {
                await supabase.from("analyses").update({
                    job_description: jobDescription,
                    company_name: companyName,
                    position: position,
                    short_title: `${companyName} - ${position}`,
                    latex_source: accumulatedText,
                    has_customization: true
                }).eq("id", targetId);
                setHasCustomization(true);
            }
        } catch (error) {
            console.error(error);
            setServerError("The resume scanning API is currently experiencing unusually high demand (503 Service Unavailable). This is typically a temporary spike. Please wait a moment and try again.");
            toast.error("Generation failed due to high server demand.");
        } finally {
            clearInterval(stepInterval);
            setIsAnalyzing(false);
        }
    };

    const handleFile = async (file: File) => {
        const isPdf = file.type === "application/pdf";
        const isLatex = file.name.endsWith(".tex") || file.name.endsWith(".txt");
        if (!isPdf && !isLatex) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/parse", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.text) {
                if (isPdf) {
                    setExtractedText(data.text);
                } else {
                    setLatexText(data.text);
                }
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };



    const handleNewAnalysis = () => {
        setAnalysis("");
        setExtractedText(null);
        setJobDescription("");
        setCurrentAnalysisId(null);
    };

    const username = user?.email?.split('@')[0] || "User";

    return (
        <div className="flex flex-col min-h-screen w-full bg-background relative overflow-x-hidden no-scrollbar">
            <Navbar username={username} showMenuButton={false} />

            <main className="relative z-10 flex items-start justify-center p-0 md:px-4 md:pt-2 md:pb-0 overflow-x-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                {isHistoryLoading ? (
                    <div className="w-full flex flex-col items-center justify-center pt-32 space-y-8 animate-in fade-in duration-700">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping" />
                            <FileText className="w-10 h-10 text-white/20" />
                            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                                <Search className="w-6 h-6 text-primary drop-shadow-[0_0_10px_rgba(242,170,76,0.4)]" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">Restoring Archive</h2>
                            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/20">Synchronizing Vault Session...</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto flex flex-col w-full overflow-x-hidden">
                        <div className={analysis || isAnalyzing || serverError ? "block" : "hidden"}>
                            <AnalysisReport
                                analysis={analysis}
                                isAnalyzing={isAnalyzing}
                                loadingStep={loadingStep}
                                loadingMessages={loadingMessages}
                                companyName={companyName}
                                position={position}
                                onReset={resetSession}
                                mode={mode}
                                onSwitchMode={handleSwitchMode}
                                isHistoryMode={!!currentAnalysisId}
                                hasCustomization={hasCustomization}
                                insights={insights}
                                serverError={serverError}
                            />
                        </div>
                        <div className={!analysis && !isAnalyzing && !serverError ? "block" : "hidden"}>
                            <ActiveWorkspace
                                mainTab={mode}
                                onBack={() => window.location.href = "/"}
                                companyName={companyName}
                                setCompanyName={setCompanyName}
                                position={position}
                                setPosition={setPosition}
                                jobDescription={jobDescription}
                                setJobDescription={setJobDescription}
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
                                selectedId={currentAnalysisId}
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
