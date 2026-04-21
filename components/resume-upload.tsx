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
    const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
    const [loadingStep, setLoadingStep] = useState(0);

    const loadingMessages = [
        "Reading resume...",
        "Checking job...",
        "Finding matches...",
        "Writing report..."
    ];

    useEffect(() => {
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
                    setCurrentAnalysisId(null);
                }
            };
            fetchSavedAnalysis();
        } else {
            setExtractedText(null);
            setJobDescription("");
            setAnalysis("");
            setCurrentAnalysisId(null);
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
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content: `Analyze this resume against this job description: ${jobDescription}`,
                        },
                    ],
                    analysisId: selectedId || currentAnalysisId,
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

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user && (selectedId || currentAnalysisId)) {
                const targetId = selectedId || currentAnalysisId;
                await supabase
                    .from("analyses")
                    .update({
                        job_description: jobDescription,
                        analysis_result: accumulatedText,
                        short_title: jobDescription.slice(0, 50) || "New Analysis"
                    })
                    .eq("id", targetId);
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
                                        <GoogleLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <MicrosoftLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <AppleLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <AmazonLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <MetaLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <NetflixLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <UberLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <AirbnbLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <TeslaLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <StripeLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
                                        <SpotifyLogo className="h-5 sm:h-7 w-auto opacity-20 hover:opacity-100 transition-opacity duration-500" />
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
                        
                        <div className="space-y-3 sm:space-y-4 relative z-10">
                            <h2 className="font-heading text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 flex items-center gap-3">
                                <span className="w-4 sm:w-6 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
                                01. Job Details
                            </h2>
                            <textarea
                                className="w-full h-32 sm:h-[180px] bg-black/40 border border-white/10 focus:border-primary rounded-[15px] p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-white placeholder:text-primary/40 outline-none resize-none scrollbar-hide font-sans transition-colors duration-300 shadow-inner"
                                placeholder="Paste the job description here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                disabled={!!selectedId}
                                spellCheck={false}
                            />
                        </div>

                        <div className="space-y-3 sm:space-y-4 relative z-10">
                            <h2 className="font-heading text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-white/50 flex items-center gap-3">
                                <span className="w-4 sm:w-6 h-[1px] bg-gradient-to-r from-primary/50 to-transparent" />
                                02. Resume Upload
                            </h2>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                    className="hidden"
                                    id="resume-upload"
                                    disabled={!!selectedId}
                                />
                                <label 
                                    htmlFor={selectedId ? "" : "resume-upload"}
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
                                        Analyze Resume
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
                                    {isAnalyzing ? loadingMessages[loadingStep] : "Scan Complete"}
                                </p>
                            </div>
                        </div>
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
                        
                        <div className="max-w-none prose prose-invert relative z-10
                            prose-headings:font-heading prose-headings:text-primary prose-headings:font-medium prose-headings:tracking-tight
                            prose-h1:text-2xl sm:prose-h1:text-3xl prose-h2:text-lg sm:prose-h2:text-xl prose-h3:text-base sm:prose-h3:text-lg
                            prose-p:text-white/70 prose-p:leading-[1.6] sm:prose-p:leading-[1.7] prose-p:text-sm sm:prose-p:text-[15px] prose-p:font-sans
                            prose-strong:text-white prose-strong:font-semibold
                            prose-li:text-white/60 prose-li:text-sm sm:prose-li:text-[15px] prose-li:font-sans
                            prose-hr:border-white/5
                            prose-a:text-primary hover:prose-a:text-primary/80
                            prose-blockquote:border-primary/20 prose-blockquote:bg-white/[0.01]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {analysis}
                            </ReactMarkdown>
                            {isAnalyzing && (
                                <div className="mt-10 sm:mt-12 flex items-center justify-center gap-3 sm:gap-4 text-primary/40 font-heading font-medium text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase">
                                    <div className="flex gap-1 sm:gap-1.5">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/60 rounded-full animate-bounce"></div>
                                    </div>
                                    Analyzing Content
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

