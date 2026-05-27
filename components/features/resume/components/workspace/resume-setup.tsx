import React, { useState, useRef } from "react";
import { Check, Upload, Code2, Info, X, ClipboardPaste } from "lucide-react";

import { ResumeSetupProps } from "@/types";

function detectLatex(text: string): boolean {
    return text.includes("\\documentclass") || text.includes("\\begin{document}");
}

export function ResumeSetup({
    mainTab,
    latexText,
    setLatexText,
    extractedText,
    handleFile,
    isUploading,
    selectedId,
    saveBaselineLatex,
}: ResumeSetupProps) {
    const [isReplacingAnalysis, setIsReplacingAnalysis] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedPulse, setSavedPulse] = useState(false);
    const [customizeSource, setCustomizeSource] = useState<"latex" | "word">("latex");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isLatex = detectLatex(latexText || "");
    const charCount = (latexText || "").length;

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLatexText(e.target.value);
    };

    const handleClear = () => {
        setLatexText("");
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const handleSave = async () => {
        if (!saveBaselineLatex) return;
        setIsSaving(true);
        try {
            await saveBaselineLatex();
            setSavedPulse(true);
            setTimeout(() => setSavedPulse(false), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    if (mainTab === "customize") {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit mx-auto mb-2">
                    <button
                        onClick={() => setCustomizeSource("latex")}
                        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${customizeSource === "latex" ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-white/40 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        LaTeX Source
                    </button>
                    <button
                        onClick={() => setCustomizeSource("word")}
                        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${customizeSource === "word" ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-white/40 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        Word Document
                    </button>
                </div>

                {customizeSource === "word" ? (
                    <div className={`relative flex items-center justify-between w-full px-8 py-6 rounded-3xl border transition-all duration-700 ${(!isLatex && latexText) ? "bg-primary/[0.03] border-primary/20 shadow-[0_0_40px_rgba(242,170,76,0.05)]" : "bg-white/[0.01] border-white/10"}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700 ${(!isLatex && latexText) ? "bg-primary text-black shadow-[0_0_20px_rgba(242,170,76,0.4)]" : "bg-white/5 border border-white/10 text-white/20"}`}>
                                {isUploading ? <Upload className="w-5 h-5 animate-bounce" /> : <Check className={`w-5 h-5 ${(!isLatex && latexText) ? "opacity-100" : "opacity-20"}`} />}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${(!isLatex && latexText) ? "text-primary" : extractedText ? "text-emerald-400" : "text-white/40"}`}>
                                    {isUploading ? "Reading Document..." : (!isLatex && latexText) ? "Word Document Loaded" : extractedText ? "PDF Text Available" : "Upload Word Document"}
                                </span>
                                <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest mt-1">
                                    {(!isLatex && latexText) ? `${charCount.toLocaleString()} chars · Ready for customization` : extractedText ? "Your analyzed PDF text will be used for customization" : "Select a .docx file to get plain-text customization"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept=".docx,.doc"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0], "customize")}
                                className="hidden"
                                id="resume-upload-docx-customize"
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="resume-upload-docx-customize"
                                className="px-6 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xl shadow-primary/10"
                            >
                                {((!isLatex && latexText) || extractedText) ? "Replace File" : "Upload Document"}
                            </label>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={`relative flex items-center justify-between w-full px-6 py-5 rounded-3xl border transition-all duration-700 ${isLatex ? "bg-primary/[0.03] border-primary/20 shadow-[0_0_40px_rgba(242,170,76,0.05)]" : "bg-white/[0.01] border-white/10"}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-700 ${isLatex ? "bg-primary text-black shadow-[0_0_20px_rgba(242,170,76,0.4)]" : "bg-white/5 border border-white/10 text-white/20"}`}>
                                    <Code2 className={`w-5 h-5 ${isLatex ? "opacity-100" : "opacity-20"}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLatex ? "text-primary" : "text-white/40"}`}>
                                        {isLatex ? "LaTeX Source Loaded" : "Paste Your LaTeX Source"}
                                    </span>
                                    <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest mt-1">
                                        {isLatex
                                            ? `${charCount.toLocaleString()} chars · Template will be preserved`
                                            : "Paste raw .tex code from Overleaf to preserve your formatting"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowTip((v) => !v)}
                                    className="p-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/20 hover:text-primary hover:border-primary/30 transition-all"
                                    title="How to get your LaTeX code"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>

                                {isLatex && (
                                    <>
                                        {saveBaselineLatex && (
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${savedPulse ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" : "bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"} disabled:opacity-50`}
                                            >
                                                {savedPulse ? <Check className="w-3 h-3" /> : null}
                                                {isSaving ? "Saving..." : savedPulse ? "Saved!" : "Save to Profile"}
                                            </button>
                                        )}
                                        <button
                                            onClick={handleClear}
                                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                                        >
                                            Clear
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {showTip && (
                            <div className="relative px-6 py-4 rounded-2xl bg-primary/[0.04] border border-primary/15 animate-in fade-in slide-in-from-top-2 duration-300">
                                <button
                                    onClick={() => setShowTip(false)}
                                    className="absolute top-3 right-3 p-1 rounded-lg text-white/20 hover:text-white transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">How to get your LaTeX code</p>
                                <ol className="space-y-1.5">
                                    {[
                                        "Open your resume project in Overleaf.",
                                        'Click the menu icon (☰) at the top-left → "Source".',
                                        "Press Ctrl + A (or Cmd + A on Mac) to select all.",
                                        "Press Ctrl + C to copy, then paste below.",
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <span className="shrink-0 w-4 h-4 rounded-full bg-primary/20 text-primary text-[8px] font-black flex items-center justify-center mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="text-[11px] text-white/50 leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        <div className={`relative rounded-3xl border overflow-hidden transition-all duration-500 ${latexText ? "border-primary/20" : "border-white/10"}`}>
                            {isLatex && (
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent pointer-events-none" />
                            )}

                            {!latexText && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none z-10">
                                    <ClipboardPaste className="w-8 h-8 text-white/10" />
                                    <div className="text-center">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/15">Paste LaTeX here</p>
                                        <p className="text-[9px] text-white/10 font-medium uppercase tracking-widest mt-1">Starts with \documentclass</p>
                                    </div>
                                </div>
                            )}

                            <textarea
                                ref={textareaRef}
                                value={latexText}
                                onChange={handlePaste}
                                spellCheck={false}
                                rows={latexText ? 18 : 6}
                                className="w-full bg-black/30 text-[12px] font-mono text-white/70 leading-relaxed resize-none outline-none px-6 py-5 placeholder-transparent transition-all duration-300 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                                placeholder="\documentclass..."
                                style={{ minHeight: latexText ? "340px" : "120px" }}
                            />
                            {latexText && (
                                <div className="px-6 py-2.5 bg-black/20 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {isLatex ? (
                                            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                LaTeX Detected
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-400/70">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                                                Plain Text Mode
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-white/20 font-mono">{charCount.toLocaleString()} chars</span>
                                </div>
                            )}
                        </div>
                    </>
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
