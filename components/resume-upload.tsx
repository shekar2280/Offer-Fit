"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

export function ResumeUpload({ selectedId }: { selectedId: string | null }) {
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState("");

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
                }
            };
            fetchSavedAnalysis();
        } else {
            setExtractedText(null);
            setJobDescription("");
            setAnalysis("");
        }
    }, [selectedId]);

    const analyzeResume = async (text: string) => {
        setIsAnalyzing(true);
        setAnalysis("");
        let accumulatedText = "";

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "user",
                            content: `You are a professional technical recruiter. Compare this Resume with the following Job Description.
                
                JOB DESCRIPTION:
                ${jobDescription}

                RESUME TEXT:
                ${text}

                Provide:
                1. A Match Score (0-100%).
                2. Top 3 "Missing Links" (Skills or experiences the JD wants but the resume lacks).
                3. 3 specific bullet points to add to the resume to better align with this JD.`
                        },
                    ],
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

            if (user) {
                await supabase.from("analyses").insert({
                    user_id: user.id,
                    resume_text: text,
                    job_description: jobDescription,
                    analysis_result: accumulatedText,
                    short_title: jobDescription.slice(0, 50) || "Resume Analysis"
                });
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleFile = async (file: File) => {
        if (file.type !== "application/pdf") {
            alert("Please upload a PDF file.");
            return;
        }

        setIsUploading(true);
        setExtractedText(null);
        setAnalysis("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/parse", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.text) {
                setExtractedText(data.text);
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
        doc.setTextColor(30, 40, 60);
        doc.text("ResumeAI Diagnostic Report", margin, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 32);

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, 38, pageWidth - margin, 38);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const lines = analysis.split("\n");
        let y = 50;
        let lastLineWasEmpty = false;

        const cleanMarkdown = (text: string) => {
            return text
                .replace(/\*\*/g, "")
                .replace(/\*/g, "")
                .replace(/#/g, "")
                .replace(/^- /, "")
                .replace(/^\* /, "")
                .trim();
        };

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            const cleanLine = cleanMarkdown(line);

            if (!cleanLine) {
                if (!lastLineWasEmpty && y < 270) {
                    y += 5;
                    lastLineWasEmpty = true;
                }
                return;
            }

            if (y > 275) {
                doc.addPage();
                y = 20;
            }

            if (trimmedLine.startsWith("#")) {
                y += 5;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(30, 40, 60);
                doc.text(cleanLine, margin, y);
                y += 10;
                lastLineWasEmpty = false;
            } else if (trimmedLine.startsWith("-") || trimmedLine.startsWith("*")) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                doc.setTextColor(0, 0, 0);
                const splitText = doc.splitTextToSize(`• ${cleanLine}`, maxLineWidth);
                doc.text(splitText, margin, y);
                y += (splitText.length * 6);
                lastLineWasEmpty = false;
            } else {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                doc.setTextColor(40, 40, 40);
                const splitText = doc.splitTextToSize(cleanLine, maxLineWidth);
                doc.text(splitText, margin, y);
                y += (splitText.length * 6);
                lastLineWasEmpty = false;
            }
        });

        doc.save(`ResumeAI-Analysis-${new Date().getTime()}.pdf`);
    };

    const handleStartAnalysis = async () => {
        if (!extractedText) {
            alert("Please upload a resume first!");
            return;
        }

        if (!jobDescription) {
            alert("Please paste a job description to compare against.");
            return;
        }

        await analyzeResume(extractedText);
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in run-in zoom-in-95 duration-500">
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-[2rem] p-8 shadow-xl shadow-black/5">

                <div className="space-y-6">
                    <div className="text-center space-y-2 mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">Configure Analysis</h2>
                        <p className="text-muted-foreground text-sm">Provide your target job and resume to generate a tailored report.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">1</span>
                            Target Job Description
                        </label>
                        <textarea
                            className="w-full min-h-[140px] p-5 rounded-2xl bg-background/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none shadow-inner text-sm leading-relaxed"
                            placeholder="Paste the key responsibilities, requirements, and tech stack here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            disabled={!!selectedId}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">2</span>
                            Upload Resume
                        </label>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (!selectedId) handleFile(e.dataTransfer.files[0]);
                            }}
                            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 group ${selectedId
                                ? "border-border/40 bg-muted/20 opacity-70"
                                : "border-primary/20 hover:border-primary hover:bg-primary/5 cursor-pointer bg-background/50 shadow-sm"
                                }`}
                        >
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                className="hidden"
                                id="resume-upload"
                                disabled={!!selectedId}
                            />
                            <label htmlFor={selectedId ? "" : "resume-upload"} className={selectedId ? "cursor-default" : "cursor-pointer"}>
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
                                    {extractedText ? "✅" : "📄"}
                                </div>
                                <h3 className="text-lg font-bold text-foreground tracking-tight">
                                    {isUploading ? (
                                        <span className="animate-pulse text-primary">Deciphering PDF...</span>
                                    ) : extractedText ? (
                                        "Resume Loaded Successfully"
                                    ) : (
                                        "Drop your PDF Resume here"
                                    )}
                                </h3>
                                {!extractedText && !isUploading && (
                                    <span className="mt-4 px-6 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all inline-block pointer-events-none">
                                        Browse Files
                                    </span>
                                )}
                            </label>
                        </div>
                    </div>

                    {!selectedId && (
                        <div className="pt-4">
                            <button
                                onClick={handleStartAnalysis}
                                disabled={isAnalyzing || isUploading || !extractedText || !jobDescription}
                                className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none disabled:hover:transform-none relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                {isAnalyzing ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing Match...
                                    </span>
                                ) : (
                                    "✨ Generate Insight Report"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {(isAnalyzing || analysis) && (
                <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-gradient-to-r from-primary/10 via-background to-background p-8 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">AI Diagnostic Report</h3>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Generated by Gemini</p>
                            </div>
                        </div>

                        <button
                            onClick={downloadReport}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background hover:bg-accent border border-border/50 text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download PDF
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-primary">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {analysis}
                            </ReactMarkdown>
                            {isAnalyzing && (
                                <span className="inline-block w-3 h-6 ml-1 bg-primary rounded-sm animate-pulse align-middle" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
