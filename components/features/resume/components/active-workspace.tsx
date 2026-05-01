"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Upload, ArrowRight, X, Briefcase, Building2 } from "lucide-react";

interface ActiveWorkspaceProps {
    mainTab: "analysis" | "customize";
    onBack: () => void;
    companyName: string;
    setCompanyName: (val: string) => void;
    position: string;
    setPosition: (val: string) => void;
    jobDescription: string;
    setJobDescription: (val: string) => void;
    latexText: string;
    setLatexText: (val: string) => void;
    extractedText: string | null;
    handleFile: (file: File) => void;
    isUploading: boolean;
    isAnalyzing: boolean;
    hasExistingResume: boolean;
    setExtractedText: (val: string | null) => void;
    setHasExistingResume: (val: boolean) => void;
    analyzeResume: (text: string, targetMode?: "analysis" | "customize") => void;
    selectedId: string | null;
    onReset: () => void;
    saveBaselineLatex: () => Promise<void>;
    onSwitchMode: (mode: "analysis" | "customize") => void;
}


const FloatingInput = ({ value, onChange, label, disabled = false, icon: Icon }: any) => (
    <div className="relative group/input w-full bg-white/[0.02] border border-white/10 rounded-2xl transition-colors hover:border-white/20 focus-within:border-primary/50 focus-within:bg-white/[0.04]">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-primary transition-colors">
            {Icon && <Icon className="w-5 h-5" />}
        </div>
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder=" "
            className="block w-full px-12 py-5 text-sm text-white bg-transparent appearance-none focus:outline-none focus:ring-0 peer disabled:opacity-50 h-16"
        />
        <label className="absolute text-sm text-white/40 duration-300 transform -translate-y-3 scale-75 top-4 left-12 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary pointer-events-none">
            {label}
        </label>
    </div>
);

export function ActiveWorkspace({
    mainTab,
    companyName,
    setCompanyName,
    position,
    setPosition,
    jobDescription,
    setJobDescription,
    latexText,
    setLatexText,
    extractedText,
    handleFile,
    isUploading,
    isAnalyzing,
    hasExistingResume,
    setExtractedText,
    setHasExistingResume,
    analyzeResume,
    selectedId,
    onReset,
    saveBaselineLatex,
    onSwitchMode
}: ActiveWorkspaceProps) {
    const [isReplacingLatex, setIsReplacingLatex] = useState(false);
    const jdRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (jdRef.current) {
            jdRef.current.style.height = "auto";
            jdRef.current.style.height = `${jdRef.current.scrollHeight}px`;
        }
    }, [jobDescription]);

    return (
        <div className="w-full h-full flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 overflow-x-hidden">
            <div className="w-full max-w-5xl mx-auto flex-1 relative z-10 pb-8 min-h-0">
                <div className="bg-black/40 border border-white/[0.05] rounded-[3rem] pt-4 px-8 pb-10 sm:pt-6 sm:px-10 sm:pb-12 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-x-hidden overflow-y-auto h-full no-scrollbar">
                    
                    <div className="flex justify-between items-center mb-6 relative z-20">
                         <div />
                         <button 
                            onClick={onReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-[9px] font-bold uppercase tracking-widest text-white/30 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-300 group/reset"
                         >
                            <X className="w-3 h-3 group-hover/reset:rotate-90 transition-transform duration-300" />
                            Reset
                         </button>
                    </div>

                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
                    
                    <div className="relative z-10 flex flex-col space-y-10">
                        

                        <div className="space-y-4">
                            {mainTab === "customize" ? (
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
                            ) : (
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
                            )}
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FloatingInput value={companyName} onChange={setCompanyName} label="Target Company" disabled={!!selectedId} icon={Building2} />
                            <FloatingInput value={position} onChange={setPosition} label="Target Role" disabled={!!selectedId} icon={Briefcase} />
                        </div>


                        <div className="space-y-2 w-full">
                            <h2 className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 ml-2">Job Description</h2>
                            <div className="relative group/jd">
                                <textarea
                                    ref={jdRef}
                                    className="block w-full min-h-[140px] px-8 py-6 text-sm leading-relaxed text-white bg-white/[0.02] border border-white/10 rounded-[2rem] focus:outline-none focus:ring-0 focus:border-primary focus:bg-white/[0.04] transition-all resize-none no-scrollbar disabled:opacity-50 overflow-hidden"
                                    placeholder="Paste the complete job description here to start analysis..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    disabled={!!selectedId}
                                    spellCheck={false}
                                    rows={1}
                                />
                            </div>
                        </div>


                        {!selectedId && (
                            <div className="pt-3 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={() => {
                                        const isDisabled = isAnalyzing || isUploading || (mainTab === "customize" ? !latexText : !extractedText) || !jobDescription;
                                        if (!isDisabled) {
                                            mainTab === "customize" ? analyzeResume(latexText) : analyzeResume(extractedText || "");
                                        }
                                    }}
                                    className={`relative w-full sm:w-auto sm:min-w-[300px] px-8 py-5 rounded-full font-heading font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 overflow-hidden group/submit shadow-[0_0_40px_rgba(242,170,76,0.1)] hover:shadow-[0_0_60px_rgba(242,170,76,0.3)] ${
                                        (isAnalyzing || isUploading || (mainTab === "customize" ? !latexText : !extractedText) || !jobDescription) 
                                        ? "cursor-not-allowed opacity-50" 
                                        : ""
                                    }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-opacity duration-700" />
                                    <div className="absolute inset-0 flex items-center justify-center gap-3 text-black z-10 transition-colors duration-500">
                                        {isAnalyzing ? "Processing..." : (mainTab === "customize" ? "Update Resume" : "Analyze Resume")}
                                        <ArrowRight className="w-4 h-4 group-hover/submit:translate-x-2 transition-transform duration-700" />
                                    </div>
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
