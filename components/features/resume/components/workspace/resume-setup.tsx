import React, { useState } from "react";
import { Check, Upload } from "lucide-react";

interface ResumeSetupProps {
    mainTab: "analysis" | "customize";
    latexText: string;
    setLatexText: (val: string) => void;
    extractedText: string | null;
    handleFile: (file: File, uploadMode?: "analysis" | "customize") => void;
    isUploading: boolean;
    selectedId: string | null;
}

export function ResumeSetup({
    mainTab,
    latexText,
    setLatexText,
    extractedText,
    handleFile,
    isUploading,
    selectedId
}: ResumeSetupProps) {
    const [isReplacingLatex, setIsReplacingLatex] = useState(false);
    const [isReplacingAnalysis, setIsReplacingAnalysis] = useState(false);

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
                                                                 {latexText ? "Resume Text already there" : "Upload Resume for Customization"}
                            </span>
                            <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest mt-1">
                                {latexText ? "Global Profile Linked" : "Select a resume file or paste below"}
                            </span>
                        </div>
                    </div>
                    {latexText ? (
                        isReplacingLatex ? (
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    accept=".docx,.doc"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0], "customize")}
                                    className="hidden"
                                    id="resume-upload-customize-docx-top"
                                    disabled={isUploading}
                                />
                                <input
                                    type="file"
                                    accept=".tex"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0], "customize")}
                                    className="hidden"
                                    id="resume-upload-customize-latex-top"
                                    disabled={isUploading}
                                />
                                <label
                                    htmlFor="resume-upload-customize-docx-top"
                                    className="px-4 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                                >
                                    Upload Word
                                </label>
                                <label
                                    htmlFor="resume-upload-customize-latex-top"
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                                >
                                    Upload LaTeX
                                </label>
                                <button
                                    onClick={() => setIsReplacingLatex(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all ml-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsReplacingLatex(true)}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                            >
                                Replace
                            </button>
                        )
                    ) : (
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept=".docx,.doc"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0], "customize")}
                                className="hidden"
                                id="resume-upload-customize-docx-top"
                                disabled={isUploading}
                            />
                            <input
                                type="file"
                                accept=".tex"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0], "customize")}
                                className="hidden"
                                id="resume-upload-customize-latex-top"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="resume-upload-customize-docx-top"
                                className="px-4 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                            >
                                Upload Word
                            </label>
                            <label
                                htmlFor="resume-upload-customize-latex-top"
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                            >
                                Upload LaTeX
                            </label>
                        </div>
                    )}
                </div>
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
                            {extractedText ? "Your resume is ready for analysis" : "Select a PDF or Word document (.docx) to get started"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {extractedText ? (
                        isReplacingAnalysis ? (
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0], "analysis")}
                                    className="hidden"
                                    id="resume-upload-pdf-replace"
                                    disabled={isUploading}
                                />
                                <input
                                    type="file"
                                    accept=".docx,.doc"
                                    onChange={(e) => e.target.files && handleFile(e.target.files[0], "analysis")}
                                    className="hidden"
                                    id="resume-upload-docx-replace"
                                    disabled={isUploading}
                                />
                                <label
                                    htmlFor="resume-upload-pdf-replace"
                                    className="px-4 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                                >
                                    Upload PDF
                                </label>
                                <label
                                    htmlFor="resume-upload-docx-replace"
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                                >
                                    Upload Word
                                </label>
                                <button
                                    onClick={() => setIsReplacingAnalysis(false)}
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all ml-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsReplacingAnalysis(true)}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                            >
                                Replace
                            </button>
                        )
                    ) : (
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0], "analysis")}
                                className="hidden"
                                id="resume-upload-pdf"
                                disabled={!!selectedId || isUploading}
                            />
                            <input
                                type="file"
                                accept=".docx"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0], "analysis")}
                                className="hidden"
                                id="resume-upload-docx"
                                disabled={!!selectedId || isUploading}
                            />
                            <label
                                htmlFor="resume-upload-pdf"
                                className="px-4 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer"
                            >
                                Upload PDF
                            </label>
                            <label
                                htmlFor="resume-upload-docx"
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all cursor-pointer animate-pulse"
                            >
                                Upload Word
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
