"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { Download, Upload, Check, FileText, ArrowRight } from "lucide-react";
import jsPDF from "jspdf";
import { 
    GoogleLogo, MicrosoftLogo, AmazonLogo, MetaLogo, NetflixLogo, 
    AppleLogo, UberLogo, AirbnbLogo, TeslaLogo, StripeLogo, SpotifyLogo 
} from "./logos";

export function ResumeUpload({ selectedId, onReset }: { selectedId: string | null, onReset: () => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [position, setPosition] = useState("");
    const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [hasExistingResume, setHasExistingResume] = useState(false);

    const loadingMessages = [
        "Reading resume...",
        "Checking job...",
        "Finding matches...",
        "Writing report..."
    ];

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlCompany = params.get("company");
        const urlRole = params.get("role");
        const urlJd = params.get("jd");

        if (urlCompany) setCompanyName(urlCompany);
        if (urlRole) setPosition(urlRole);
        if (urlJd) setJobDescription(urlJd);

        const checkExisting = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("analyses")
                    .select("resume_text, id")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                
                if (data && !selectedId) {
                    setExtractedText(data.resume_text);
                    setCurrentAnalysisId(data.id);
                    setHasExistingResume(true);
                }
            }
        };

        if (selectedId) {
            const fetchSavedAnalysis = async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from("analyses")
                    .select("*")
                    .eq("id", selectedId)
                    .single();

                if (data) {
                    setExtractedText(data.resume_text);
                    setJobDescription(data.job_description);
                    setAnalysis(data.analysis_result);
                    setCompanyName(data.company_name || "");
                    setPosition(data.position || "");
                    setCurrentAnalysisId(null);
                }
            };
            fetchSavedAnalysis();
        } else {
            checkExisting();
            if (!urlJd) setJobDescription("");
            if (!urlCompany) setCompanyName("");
            if (!urlRole) setPosition("");
            setAnalysis("");
        }
    }, [selectedId]);

    const analyzeResume = async (text: string) => {
        setIsAnalyzing(true);
        setAnalysis("");
        setLoadingStep(0);
        let accumulatedText = "";

        const stepInterval = setInterval(() => {
            setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 3000);

        try {
            const supabase = createClient();
            
            let user;
            try {
                const { data } = await supabase.auth.getUser();
                user = data.user;
            } catch (authError) {
                console.error("🌐 NETWORK ERROR: Could not reach Supabase Auth. Check your internet or if your Supabase project is paused.", authError);
                return;
            }

            if (!user) {
                console.warn("👤 USER ERROR: No active session found.");
                return;
            }

            let targetId = selectedId || currentAnalysisId;

            if (hasExistingResume && !selectedId) {
                try {
                    const { data: newAnalysis, error: insertError } = await supabase
                        .from("analyses")
                        .insert({
                            user_id: user.id,
                            resume_text: extractedText,
                            job_description: jobDescription,
                            company_name: companyName,
                            position: position,
                            short_title: companyName ? `${companyName} - ${position}` : "New Analysis"
                        })
                        .select()
                        .single();
                    
                    if (insertError) throw insertError;

                    if (newAnalysis) {
                        targetId = newAnalysis.id;
                        setCurrentAnalysisId(targetId);
                    }
                } catch (dbError) {
                    console.error("🗄️ DATABASE ERROR: Failed to create new analysis record.", dbError);
                    return;
                }
            }

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: jobDescription }],
                    analysisId: targetId,
                    companyName,
                    position
                }),
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    accumulatedText += chunk;
                    setAnalysis(accumulatedText);
                }
            }

            if (targetId) {
                console.log("💾 Saving analysis for ID:", targetId);
                const { error: updateError } = await supabase
                    .from("analyses")
                    .update({
                        job_description: jobDescription,
                        analysis_result: accumulatedText,
                        company_name: companyName,
                        position: position,
                        short_title: companyName ? `${companyName.toUpperCase()} - ${position}` : (jobDescription.slice(0, 50) || "Analysis Complete")
                    })
                    .eq("id", targetId);

                if (updateError) {
                    console.error("❌ SUPABASE UPDATE ERROR:", updateError.message);
                } else {
                    console.log("✅ Analysis saved successfully!");
                }
            } else {
                console.warn("⚠️ No targetId found to save analysis.");
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            clearInterval(stepInterval);
            setIsAnalyzing(false);
        }
    };

    const handleFile = async (file: File) => {
        if (file.type !== "application/pdf") {
            alert("Please upload a PDF.");
            return;
        }

        setIsUploading(true);
        setExtractedText(null);
        setAnalysis("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/parse", { method: "POST", body: formData });
            const data = await res.json();
            if (data.text) {
                setExtractedText(data.text);
                setCurrentAnalysisId(data.analysisId);
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadReport = () => {
        if (!analysis) return;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Analysis Report", margin, 25);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 32);
        doc.line(margin, 38, pageWidth - margin, 38);

        const lines = analysis.split("\n");
        let y = 50;
        lines.forEach((line) => {
            const cleanLine = line.replace(/[*#]/g, "").trim();
            if (!cleanLine) { y += 5; return; }
            if (y > 275) { doc.addPage(); y = 20; }
            const splitText = doc.splitTextToSize(cleanLine, maxLineWidth);
            doc.text(splitText, margin, y);
            y += (splitText.length * 7);
        });
        doc.save(`Analysis-${new Date().getTime()}.pdf`);
    };

    const handleNewAnalysis = () => {
        setAnalysis("");
        setExtractedText(null);
        setJobDescription("");
        setCurrentAnalysisId(null);
        if (onReset) onReset();
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-1000 relative px-2 sm:px-0">
            
            <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-full h-[50%] bg-primary/5 rounded-[100%] blur-[120px] pointer-events-none" />

            {!(isAnalyzing || analysis) && (
                <div className="space-y-6 sm:space-y-10 relative z-10">
                    <div className="text-center px-4 space-y-8">
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 leading-tight">
                            Optimize Your <span className="text-primary italic font-light drop-shadow-[0_0_30px_rgba(242,170,76,0.3)]">Resume</span>
                        </h1>

                        <div className="space-y-4 overflow-hidden py-4 relative">
                            <div className="flex gap-12 sm:gap-20 animate-marquee-right whitespace-nowrap">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex gap-12 sm:gap-20 items-center shrink-0">
                                        <GoogleLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <MicrosoftLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <AppleLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <AmazonLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <MetaLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <NetflixLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <UberLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <AirbnbLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <TeslaLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <StripeLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                        <SpotifyLogo className="h-5 sm:h-7 w-auto opacity-100 hover:scale-110 transition-all duration-500" />
                                    </div>
                                ))}
                            </div>
                            
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] text-primary/40 pt-4">
                                Crack your dream company
                            </p>

                            <style jsx>{`
                                @keyframes marquee-right {
                                    0% { transform: translateX(-50%); }
                                    100% { transform: translateX(0); }
                                }
                                .animate-marquee-right {
                                    animation: marquee-right 30s linear infinite;
                                }
                            `}</style>
                        </div>
                    </div>

                    <div className="bg-white/[0.01] border border-white/[0.03] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl space-y-6 sm:space-y-8 relative overflow-hidden group/board">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        
                        {hasExistingResume && !selectedId && (
                            <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Master Resume Active</p>
                                </div>
                                <button 
                                    onClick={() => { setExtractedText(null); setHasExistingResume(false); }}
                                    className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                                >
                                    Replace
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                            <div className="space-y-3 sm:space-y-4">
                                <h2 className="font-heading text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 flex items-center gap-3">
                                    <span className="w-4 sm:w-6 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
                                    Company
                                </h2>
                                <input
                                    className="w-full h-12 bg-black/40 border border-white/10 focus:border-primary rounded-[12px] px-5 text-sm text-white placeholder:text-primary/20 outline-none transition-all font-heading"
                                    placeholder="e.g. Google"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    disabled={!!selectedId}
                                />
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <h2 className="font-heading text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 flex items-center gap-3">
                                    <span className="w-4 sm:w-6 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
                                    Role
                                </h2>
                                <input
                                    className="w-full h-12 bg-black/40 border border-white/10 focus:border-primary rounded-[12px] px-5 text-sm text-white placeholder:text-primary/20 outline-none transition-all font-heading"
                                    placeholder="e.g. Senior Frontend Engineer"
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value)}
                                    disabled={!!selectedId}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4 relative z-10">
                            <h2 className="font-heading text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 flex items-center gap-3">
                                <span className="w-4 sm:w-6 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
                                Job Description
                            </h2>
                            <textarea
                                className="w-full h-32 sm:h-[150px] bg-black/40 border border-white/10 focus:border-primary rounded-[15px] p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-white placeholder:text-primary/40 outline-none resize-none scrollbar-hide font-sans transition-colors duration-300 shadow-inner"
                                placeholder="Paste the JD here to match against your resume..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                disabled={!!selectedId}
                                spellCheck={false}
                            />
                        </div>

                        {(!hasExistingResume && !selectedId) && (
                            <div className="space-y-3 sm:space-y-4 relative z-10">
                                <h2 className="font-heading text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 flex items-center gap-3">
                                    <span className="w-4 sm:w-6 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
                                    Master Resume
                                </h2>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                        className="hidden"
                                        id="resume-upload"
                                    />
                                    <label 
                                        htmlFor="resume-upload"
                                        className={`relative flex flex-col items-center justify-center py-6 sm:py-8 px-6 sm:px-10 rounded-[20px] transition-all duration-700 overflow-hidden ${
                                            extractedText 
                                            ? "bg-primary/[0.02] cursor-default" 
                                            : "bg-black/40 hover:bg-black/60 cursor-pointer"
                                        }`}
                                    >
                                        <div className={`absolute inset-0 border border-dashed rounded-[20px] transition-colors duration-700 pointer-events-none ${extractedText ? 'border-primary/30' : 'border-white/10 group-hover/board:border-white/20'}`} />
                                        {extractedText && <div className="absolute inset-0 bg-primary/5 shadow-[inset_0_0_100px_rgba(242,170,76,0.1)] pointer-events-none" />}

                                        <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-700 ${extractedText ? 'bg-primary shadow-[0_0_40px_rgba(242,170,76,0.4)]' : 'bg-white/[0.03] border border-white/5'}`}>
                                            {isUploading ? (
                                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-transparent border-t-black border-r-black rounded-full animate-spin" />
                                            ) : extractedText ? (
                                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                                            ) : (
                                                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                                            )}
                                        </div>
                                        <span className={`relative z-10 font-heading text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase transition-colors duration-700 ${extractedText ? "text-primary" : "text-white/40"}`}>
                                            {isUploading ? "Reading Resume..." : extractedText ? "Ready for Analysis" : "Drop PDF File"}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {!selectedId && (
                            <div className="pt-4 sm:pt-6 relative z-10">
                                <button
                                    onClick={() => analyzeResume(extractedText || "")}
                                    disabled={isAnalyzing || isUploading || !extractedText || !jobDescription}
                                    className="relative w-full h-14 sm:h-16 rounded-[10px] font-heading font-bold text-xs sm:text-[13px] uppercase tracking-[0.3em] sm:tracking-[0.4em] transition-all duration-500 overflow-hidden group/submit disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-md opacity-0 group-hover/submit:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-transform duration-500 group-hover/submit:scale-[1.02]" />
                                    <div className="absolute inset-0 flex items-center justify-center gap-3 text-black z-10">
                                        Start Analysis
                                        <ArrowRight className="w-4 h-4 group-hover/submit:translate-x-2 transition-transform duration-500" />
                                    </div>
                                    <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] w-[300%] animate-[shimmer_3s_infinite] pointer-events-none mix-blend-overlay" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {(isAnalyzing || analysis) && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 relative z-10">
                    <div className="bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[20px] p-4 sm:p-5 pr-5 sm:pr-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden shrink-0">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary relative z-10" />
                                <div className="absolute inset-0 bg-primary/5 blur-lg" />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                                <h2 className="font-heading text-base sm:text-lg font-medium text-white tracking-tight">AI Insights</h2>
                                <p className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary/60 flex items-center gap-2">
                                    {isAnalyzing && (
                                        <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                    )}
                                    {isAnalyzing ? loadingMessages[loadingStep] : "Hiring Intelligence Active"}
                                </p>
                            </div>
                        </div>

                        {analysis && !isAnalyzing && (
                            <div className="flex items-center gap-6 px-6 py-2 border-l border-white/10 hidden md:flex">
                                <div className="text-center">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Status</p>
                                    <p className={`text-xl font-black tracking-tighter ${analysis.match(/VERDICT:?\s*\[?APPLY\]?/i) ? 'text-primary' : 'text-white/40'}`}>
                                        {analysis.match(/VERDICT:?\s*\[?(\w+)\]?/i)?.[1] || "PENDING"}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleNewAnalysis}
                                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-[10px] bg-white/[0.02] hover:bg-white/[0.08] border border-white/10 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all active:scale-95"
                            >
                                Reset
                            </button>
                            <button
                                onClick={downloadReport}
                                disabled={isAnalyzing}
                                className="flex-1 sm:flex-none px-5 sm:px-6 py-2 sm:py-2.5 rounded-[10px] bg-primary overflow-hidden relative group/export transition-all disabled:opacity-20 active:scale-95 shadow-[0_5px_15px_rgba(242,170,76,0.2)]"
                            >
                                <div className="absolute inset-[-100%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] w-[300%] animate-[shimmer_3s_infinite] pointer-events-none mix-blend-overlay" />
                                <div className="relative z-10 flex items-center justify-center gap-2 text-black text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
                                    <Download className="w-3.5 h-3.5" />
                                    Export
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[20px] sm:rounded-[24px] p-6 sm:p-10 md:p-14 shadow-[0_40px_120px_rgba(0,0,0,0.7)] relative overflow-hidden group/result">
                        <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-primary/5 rounded-full blur-[80px] sm:blur-[100px] -mr-32 sm:-mr-40 -mt-32 sm:-mt-40 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-white/[0.02] rounded-full blur-[60px] sm:blur-[80px] -ml-16 sm:-ml-20 -mb-16 sm:-mb-20 pointer-events-none" />
                        
                        <div className="max-w-none relative z-10">
                            {!isAnalyzing && analysis && (
                                <div className="mb-12 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl pointer-events-none" />
                                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                        
                                        <div className="flex-1 space-y-5 text-center md:text-left z-10">
                                            <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.4em] text-white/40">Strategic AI Verdict</h3>
                                            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-6">
                                                <span className={`text-5xl md:text-6xl font-black tracking-tighter ${analysis.match(/VERDICT:?\s*\[?APPLY\]?/i) ? 'text-primary drop-shadow-[0_0_20px_rgba(242,170,76,0.4)]' : 'text-white/30 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}>
                                                    {analysis.match(/VERDICT:?\s*\[?(\w+)\]?/i)?.[1] || "RETRY"}
                                                </span>
                                                {analysis.match(/VERDICT:?\s*\[?APPLY\]?/i) && (
                                                    <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest animate-pulse">
                                                        High Priority
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-white/50 text-sm max-w-md font-sans leading-relaxed">
                                                Based on your master profile and the current 2026 market dynamics for <span className="text-white font-semibold">{companyName || "the target role"}</span>.
                                            </p>
                                        </div>

                                        <div className="relative w-40 h-40 shrink-0 z-10 flex items-center justify-center">
                                            <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
                                            <div className="absolute inset-2 border border-white/5 rounded-full border-t-primary/30 animate-[spin_15s_linear_infinite_reverse]" />
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" className="fill-none stroke-white/5 stroke-[3]" />
                                                <circle cx="50" cy="50" r="45" 
                                                    className={`fill-none stroke-[5] transition-all duration-1500 ease-out ${analysis.match(/VERDICT:?\s*\[?APPLY\]?/i) ? 'stroke-primary drop-shadow-[0_0_10px_rgba(242,170,76,0.5)]' : 'stroke-white/20'}`}
                                                    strokeDasharray={`${(Number(analysis.match(/OVERALL STRATEGIC MATCH:?\s*\[?(\d+)\]?%/i)?.[1]) || 0) * 2.82} 282`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black tracking-tighter text-white">
                                                    {analysis.match(/OVERALL STRATEGIC MATCH:?\s*\[?(\d+)\]?%/i)?.[1] || "0"}<span className="text-xl text-white/40">%</span>
                                                </span>
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-white/40 mt-1">Match Index</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                                    <div className="pt-6">
                                        {(() => {
                                            const val = parseInt(analysis.match(/Cultural Infusion \(Company Fit\):?\s*\[?(\d+)\]?%/i)?.[1] || "0");
                                            if (val === 0) return null;
                                            return (
                                                <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-white/5 rounded-2xl p-6 space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <h4 className="text-[10px] font-heading font-bold uppercase tracking-[0.2em] text-white/40 text-indigo-400">Company Alignment</h4>
                                                        <span className="text-2xl font-heading font-black tracking-tighter text-indigo-400">{val}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-indigo-500 transition-all duration-1000 delay-300"
                                                            style={{ width: `${val}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-center space-y-8 relative overflow-hidden group/radar">
                                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)] pointer-events-none" />
                                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/radar:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                                            
                                            <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.4em] text-white/50 self-start relative z-10 flex items-center gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                Career Impact Radar
                                            </h3>
                                            
                                            <div className="relative w-48 h-48 sm:w-56 sm:h-56 z-10 my-4">
                                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="45" className="fill-none stroke-white/10 stroke-[0.5] stroke-dasharray-[2_2]" />
                                                    <circle cx="50" cy="50" r="30" className="fill-none stroke-white/10 stroke-[0.5] stroke-dasharray-[2_2]" />
                                                    <circle cx="50" cy="50" r="15" className="fill-none stroke-white/10 stroke-[0.5] stroke-dasharray-[2_2]" />
                                                    <line x1="50" y1="5" x2="50" y2="95" className="stroke-white/10 stroke-[0.5]" />
                                                    <line x1="5" y1="50" x2="95" y2="50" className="stroke-white/10 stroke-[0.5]" />
                                                    
                                                    {(() => {
                                                        const brand = parseInt(analysis.match(/Brand Power:?\s*\[?(\d+)\]?%/i)?.[1] || "50");
                                                        const skill = parseInt(analysis.match(/Technical Growth:?\s*\[?(\d+)\]?%/i)?.[1] || "50");
                                                        const future = parseInt(analysis.match(/AI-Safety.*?:?\s*\[?(\d+)\]?%/i)?.[1] || "50");
                                                        const network = parseInt(analysis.match(/Network Leverage:?\s*\[?(\d+)\]?%/i)?.[1] || "50");
                                                        
                                                        const p1 = `${50},${50 - (brand * 0.45)}`;
                                                        const p2 = `${50 + (skill * 0.45)},${50}`;
                                                        const p3 = `${50},${50 + (future * 0.45)}`;
                                                        const p4 = `${50 - (network * 0.45)},${50}`;
                                                        
                                                        return (
                                                            <g>
                                                                <polygon 
                                                                    points={`${p1} ${p2} ${p3} ${p4}`}
                                                                    className="fill-primary/10 stroke-primary stroke-[1.5] transition-all duration-1000"
                                                                />
                                                                <circle cx={50} cy={50 - (brand * 0.45)} r="2" className="fill-primary drop-shadow-[0_0_4px_rgba(242,170,76,0.8)]" />
                                                                <circle cx={50 + (skill * 0.45)} cy={50} r="2" className="fill-primary drop-shadow-[0_0_4px_rgba(242,170,76,0.8)]" />
                                                                <circle cx={50} cy={50 + (future * 0.45)} r="2" className="fill-primary drop-shadow-[0_0_4px_rgba(242,170,76,0.8)]" />
                                                                <circle cx={50 - (network * 0.45)} cy={50} r="2" className="fill-primary drop-shadow-[0_0_4px_rgba(242,170,76,0.8)]" />
                                                            </g>
                                                        );
                                                    })()}
                                                </svg>
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-[8px] font-bold text-white/50 uppercase tracking-widest drop-shadow-md">Brand</div>
                                                <div className="absolute top-1/2 right-0 -translate-y-1/2 -mr-8 text-[8px] font-bold text-white/50 uppercase tracking-widest drop-shadow-md">Skills</div>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-4 text-[8px] font-bold text-white/50 uppercase tracking-widest drop-shadow-md">Safety</div>
                                                <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-8 text-[8px] font-bold text-white/50 uppercase tracking-widest drop-shadow-md">Network</div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden h-full flex flex-col justify-center group/whisper shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover/whisper:opacity-100 transition-opacity duration-1000" />
                                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
                                                
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                        <span className="text-xs">🎙️</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.3em] text-white/70">Recruiter's Whisper</h3>
                                                        <p className="text-[8px] text-primary/60 uppercase tracking-widest font-bold mt-0.5">Confidential Assessment</p>
                                                    </div>
                                                </div>
                                                <div className="relative z-10 pl-5 border-l-2 border-primary/30">
                                                    <p className="text-sm font-sans italic leading-[1.8] text-white/80">
                                                        "{analysis.match(/Strategic Whisper:\s*"?(.*?)"?\s*(\n|#|>|$)/i)?.[1] || "Candidate shows high potential for strategic scaling."}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                            {!isAnalyzing && analysis && (
                                <div className="mt-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-10 space-y-8 relative overflow-hidden group/skills">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover/skills:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                        <h3 className="text-[10px] font-heading font-bold uppercase tracking-[0.4em] text-white/50 flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 bg-primary/50" />
                                            Market Readiness Matrix
                                        </h3>
                                        <div className="h-[1px] flex-1 bg-white/5 hidden sm:block mx-4" />
                                        <span className="text-[8px] uppercase tracking-widest text-primary/40 font-bold">Era 2026</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                                        {[
                                            { label: "Core Tech Stack", key: "Core Tech Match" },
                                            { label: "Strategic Leadership", key: "Leadership Match" },
                                            { label: "Future-Proofing", key: "Future-Proofing" }
                                        ].map((skill) => {
                                            const match = analysis.match(new RegExp(`- ${skill.key}.*?:? \\[?([▓░]+)\\]? (\\d+)%`, 'i'));
                                            const val = match ? parseInt(match[2]) : 0;
                                            const filledBlocks = Math.round(val / 10);
                                            
                                            return (
                                                <div key={skill.key} className="space-y-3">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/60">
                                                        <span>{skill.label}</span>
                                                        <span className={val > 70 ? "text-primary drop-shadow-[0_0_5px_rgba(242,170,76,0.5)]" : "text-white/40"}>{val}%</span>
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        {Array.from({ length: 10 }).map((_, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={`h-1.5 flex-1 rounded-[1px] transition-all duration-1000 ${i < filledBlocks ? 'bg-primary shadow-[0_0_8px_rgba(242,170,76,0.4)]' : 'bg-white/5'}`}
                                                                style={{ transitionDelay: `${i * 50}ms` }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="prose prose-invert max-w-none
                                prose-headings:font-heading prose-headings:text-primary prose-headings:font-medium prose-headings:tracking-tight
                                prose-h1:hidden
                                prose-h2:text-lg sm:prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-3
                                prose-p:text-white/70 prose-p:leading-[1.7] prose-p:text-sm sm:prose-p:text-[15px] prose-p:font-sans
                                prose-strong:text-white prose-strong:font-semibold
                                prose-li:text-white/60 prose-li:text-sm sm:prose-li:text-[15px] prose-li:font-sans
                                prose-hr:border-white/5
                                prose-blockquote:border-primary/20 prose-blockquote:bg-white/[0.01] prose-blockquote:rounded-2xl prose-blockquote:py-1">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h2: ({children}) => (
                                            <h2 className="group flex items-center gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(242,170,76,0.8)]" />
                                                {children}
                                            </h2>
                                        )
                                    }}
                                >
                                    {analysis}
                                </ReactMarkdown>
                                {isAnalyzing && (
                                    <div className="mt-10 sm:mt-12 flex items-center justify-center gap-3 sm:gap-4 text-primary/40 font-heading font-medium text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase">
                                        <div className="flex gap-1 sm:gap-1.5">
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce"></div>
                                        </div>
                                        Analyzing Intelligence
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

