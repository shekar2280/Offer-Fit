"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ResumeUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [jobDescription, setJobDescription] = useState("");

    const analyzeResume = async (text: string) => {
        setIsAnalyzing(true);
        setAnalysis("");

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
                    setAnalysis((prev) => prev + chunk);
                }
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
        <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Target Job Description
                </label>
                <textarea
                    className="w-full min-h-[100px] p-4 rounded-2xl bg-accent/20 border-2 border-primary/5 focus:border-primary/20 outline-none transition-all resize-none"
                    placeholder="Paste the job requirements here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                />
            </div>

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    handleFile(file);
                }}
                className="border-2 border-dashed border-foreground/20 rounded-3xl p-12 text-center hover:border-primary/40 transition-all cursor-pointer bg-accent/30 group"
            >
                <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                    className="hidden"
                    id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                    <h3 className="text-lg font-bold">
                        {isUploading ? "Reading PDF..." : isAnalyzing ? "AI is Thinking..." : "Upload Resume"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Drag & drop your PDF here
                    </p>
                </label>
            </div>
            <div>
                <button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing || isUploading}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isAnalyzing ? "Comparing..." : "🚀 Start Job Match Analysis"}
                </button>
            </div>


            {(isAnalyzing || analysis) && (
                <div className="p-8 bg-background border-2 border-primary/10 rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                            ✨
                        </div>
                        <h3 className="text-xl font-black italic tracking-tight">AI INSIGHTS</h3>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {analysis}
                        </ReactMarkdown>
                        {isAnalyzing && (
                            <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse align-middle" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
