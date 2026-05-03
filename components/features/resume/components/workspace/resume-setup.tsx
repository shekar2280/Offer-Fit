import React, { useState } from "react";
import { Check, Upload } from "lucide-react";

interface ResumeSetupProps {
    mainTab: "analysis" | "customize";
    latexText: string;
    setLatexText: (val: string) => void;
    extractedText: string | null;
    handleFile: (file: File) => void;
    isUploading: boolean;
    saveBaselineLatex: () => Promise<void>;
    selectedId: string | null;
}

export function ResumeSetup({
    mainTab,
    latexText,
    setLatexText,
    extractedText,
    handleFile,
    isUploading,
    saveBaselineLatex,
    selectedId
}: ResumeSetupProps) {
    const [isReplacingLatex, setIsReplacingLatex] = useState(false);

    if (mainTab === "customize") {
        return (
            <div className="space-y-6">
                <div className={`relative flex items-center justify-between w-full px-8 py-6 rounded-3xl border transition-all duration-700 ${latexText ? "bg-primary/[0.03] border-primary/20 shadow-[0_0_40px_rgba(242,170,76,0.05)]" : "bg-white/[0.01] border-white/10"}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700 ${latexText ? "bg-primary text-black shadow-[0_0_20px_rgba(242,170,76,0.4)]" : "bg-white/5 border border-white/10 text-white/20"}`}>
                            <Check className={`w-5 h-5 ${latexText ? "opacity-100" : "opacity-20"}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${latexText ? "text-primary" : "text-white/40"}`}>
                                {latexText ? "Master Source Synchronized" : "Master Source Setup Required"}
                            </span>
                            <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest mt-1">
                                {latexText ? "Global Profile Linked" : "Provide your Overleaf source below"}
                            </span>
                        </div>
                    </div>
                    {latexText && (
                        <button 
                            onClick={() => setIsReplacingLatex(!isReplacingLatex)}
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            {isReplacingLatex ? "Cancel" : "Replace"}
                        </button>
                    )}
                </div>

                {(!latexText || isReplacingLatex) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">LaTeX Source</h2>
                            {latexText && !selectedId && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        saveBaselineLatex();
                                        setIsReplacingLatex(false);
                                    }}
                                    className="text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors flex items-center gap-2"
                                >
                                    Update Master Profile
                                </button>
                            )}
                        </div>
                        <div className="relative group/latex min-h-[160px] rounded-[2rem] overflow-hidden bg-black/40 border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-primary/10 blur-[80px] pointer-events-none" />
                            <textarea
                                className="w-full h-full min-h-[160px] bg-transparent px-8 py-6 text-[13px] font-mono leading-[1.8] text-white/80 placeholder:text-white/20 outline-none resize-none no-scrollbar selection:bg-primary/30 selection:text-white"
                                placeholder="% Paste your Overleaf LaTeX source code here..."
                                value={latexText}
                                onChange={(e) => setLatexText(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                        <p className="text-[10px] text-white/20 font-medium tracking-wide px-2 leading-relaxed italic">
                            Paste your master LaTeX source code above. The AI will customize it specifically for the JD.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className={`relative flex items-center justify-between w-full px-8 py-6 rounded-3xl border transition-all duration-700 ${extractedText ? "bg-primary/[0.03] border-primary/20 shadow-[0_0_40px_rgba(242,170,76,0.05)]" : "bg-white/[0.01] border-white/10"}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700 ${extractedText ? "bg-primary text-black shadow-[0_0_20px_rgba(242,170,76,0.4)]" : "bg-white/5 border border-white/10 text-white/20"}`}>
                        {isUploading ? <Upload className="w-5 h-5 animate-bounce" /> : <Check className={`w-5 h-5 ${extractedText ? "opacity-100" : "opacity-20"}`} />}
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${extractedText ? "text-primary" : "text-white/40"}`}>
                            {isUploading ? "Reading Resume..." : extractedText ? "Resume Loaded" : "Upload Resume"}
                        </span>
                        <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest mt-1">
                            {extractedText ? "Your resume is ready for analysis" : "Select a PDF to get started"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {extractedText && (
                        <>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                className="hidden"
                                id="resume-replace-active"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="resume-replace-active"
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                            >
                                Replace
                            </label>
                        </>
                    )}
                    {!extractedText && (
                        <>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                className="hidden"
                                id="resume-upload-active"
                                disabled={!!selectedId || isUploading}
                            />
                            <label
                                htmlFor="resume-upload-active"
                                className="px-4 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                            >
                                Upload PDF
                            </label>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
