"use client";

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
    analyzeResume: (text: string) => void;
    selectedId: string | null;
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
    selectedId
}: ActiveWorkspaceProps) {

    return (
        <div className="w-full h-full flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-full max-w-5xl mx-auto flex-1 relative z-10 pb-8 min-h-0">
                <div className="bg-black/40 border border-white/[0.05] rounded-[3rem] pt-4 px-8 pb-10 sm:pt-6 sm:px-10 sm:pb-12 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden h-full">

                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
                    
                    <div className="relative z-10 flex flex-col space-y-10">
                        

                        <div className="space-y-4">
                            {mainTab === "customize" ? (
                                <div className="space-y-4">
                                    <h2 className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 ml-2">LaTeX Editor</h2>
                                    <div className="relative group/latex min-h-[100px] lg:min-h-[100px] rounded-[2rem] overflow-hidden bg-black/40 border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl transition-colors duration-700">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-primary/10 blur-[80px] pointer-events-none" />
                                        <textarea
                                            className="w-full h-full bg-transparent px-8 py-6 text-[13px] font-mono leading-[1.8] text-white/80 placeholder:text-white/20 outline-none resize-none no-scrollbar selection:bg-primary/30 selection:text-white"
                                            placeholder="% Paste your Overleaf LaTeX source code here...&#10;&#10;\documentclass{article}"
                                            value={latexText}
                                            onChange={(e) => setLatexText(e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-auto min-h-[100px] group/upload">
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
                                        className={`relative flex flex-col items-center justify-center w-full h-auto min-h-[100px] py-4 rounded-[2rem] border-2 border-dashed transition-all duration-700 overflow-hidden cursor-pointer backdrop-blur-sm ${extractedText
                                            ? "bg-primary/[0.03] border-primary/30 shadow-[inset_0_0_40px_rgba(242,170,76,0.1)]"
                                            : "bg-white/[0.01] border-white/10 hover:border-primary/50 hover:bg-white/[0.03]"
                                            } ${(!!selectedId || isUploading) ? "cursor-not-allowed opacity-50" : ""}`}
                                    >
                                        {extractedText && !isUploading && !selectedId && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setExtractedText(null);
                                                    setHasExistingResume(false);
                                                }}
                                                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-destructive/20 hover:text-destructive text-white/40 flex items-center justify-center transition-all duration-300 z-20 border border-white/10 hover:border-destructive/30"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        
                                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-700 ${extractedText ? 'bg-primary shadow-[0_0_30px_rgba(242,170,76,0.5)]' : 'bg-white/5 border border-white/10 group-hover/upload:scale-110 group-hover/upload:border-primary/50'}`}>
                                            {isUploading ? (
                                                <div className="relative mt-3 w-8 h-8 flex items-center justify-center">
                                                    <svg className="w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/10" />
                                                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="65 200" strokeLinecap="round" className="text-primary shadow-[0_0_15px_rgba(242,170,76,0.5)]" />
                                                    </svg>
                                                    <Upload className="absolute w-3 h-3 text-primary animate-bounce" />
                                                </div>
                                            ) : extractedText ? (
                                                <Check className="w-6 h-6 text-black" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-white/40 group-hover/upload:text-primary transition-colors duration-500" />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center text-center">
                                            <span className={`relative z-10 font-heading text-[10px] font-bold tracking-[0.3em] uppercase transition-colors duration-700 ${extractedText ? "text-primary" : "text-white/40 group-hover/upload:text-white"}`}>
                                                {isUploading ? "Reading..." : extractedText ? "PDF Uploaded" : "Upload PDF"}
                                            </span>
                                            {extractedText && hasExistingResume && !isUploading && (
                                                <span className="relative z-10 text-[8px] text-white/30 uppercase tracking-[0.2em] mt-2 font-medium">
                                                    Using previous resume
                                                </span>
                                            )}
                                        </div>
                                    </label>
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
                                    className="block w-full min-h-[140px] px-8 py-6 text-sm leading-relaxed text-white bg-white/[0.02] border border-white/10 rounded-[2rem] focus:outline-none focus:ring-0 focus:border-primary focus:bg-white/[0.04] transition-all resize-none no-scrollbar disabled:opacity-50"
                                    placeholder="Paste the complete job description here to start analysis..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    disabled={!!selectedId}
                                    spellCheck={false}
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
