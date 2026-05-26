"use client";

import { ArrowRight } from "lucide-react";
import { ActiveWorkspaceProps } from "@/types";
import { ResumeSetup } from "./workspace/resume-setup";
import { JobDetails } from "./workspace/job-details";

export function ActiveWorkspace(props: ActiveWorkspaceProps) {
    const {
        mainTab,
        companyName,
        setCompanyName,
        position,
        setPosition,
        jobDescription,
        setJobDescription,
        latexText,
        setLatexText,
        location,
        setLocation,
        jobType,
        setJobType,
        extractedText,
        handleFile,
        isUploading,
        isAnalyzing,
        selectedId,
        onReset,
        saveBaselineLatex,
        analyzeResume,
        companyInputRef,
        isOverQuota = false,
    } = props;

    const isSubmitDisabled = isAnalyzing || isUploading || isOverQuota || (mainTab === "customize" ? !latexText : !extractedText) || !jobDescription || !companyName || !position;

    return (
        <div className="w-full flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-full max-w-5xl mx-auto relative z-10 pb-4">
                <div className="bg-black/40 border border-primary/20 rounded-[3rem] pt-8 px-8 pb-8 sm:pt-10 sm:px-10 sm:pb-8 shadow-[0_0_80px_rgba(242,170,76,0.03)] backdrop-blur-3xl relative group">
                    <div className="flex justify-end mb-6 relative z-20">
                        <button
                            onClick={onReset}
                            className="px-5 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-primary/40 transition-all group/reset flex items-center justify-center backdrop-blur-xl shadow-xl active:scale-95"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 group-hover/reset:text-primary transition-colors">
                                Reset
                            </span>
                        </button>
                    </div>

                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />

                    <div className="relative z-10 flex flex-col space-y-10">
                        <ResumeSetup
                            mainTab={mainTab}
                            latexText={latexText}
                            setLatexText={setLatexText}
                            extractedText={extractedText}
                            handleFile={handleFile}
                            isUploading={isUploading}
                            selectedId={selectedId}
                        />

                        <JobDetails
                            companyName={companyName}
                            setCompanyName={setCompanyName}
                            position={position}
                            setPosition={setPosition}
                            jobDescription={jobDescription}
                            setJobDescription={setJobDescription}
                            location={location}
                            setLocation={setLocation}
                            jobType={jobType}
                            setJobType={setJobType}
                            selectedId={selectedId}
                            companyInputRef={companyInputRef}
                        />

                        <div className="pt-3 border-t border-white/5 flex justify-center">
                            <button
                                onClick={() => {
                                    if (!isSubmitDisabled) {
                                        analyzeResume(mainTab === "customize" ? latexText : (extractedText || ""));
                                    }
                                }}
                                className={`relative w-full max-w-2xl px-8 py-5 rounded-full font-heading font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 overflow-hidden group/submit shadow-[0_0_40px_rgba(242,170,76,0.1)] hover:shadow-[0_0_60px_rgba(242,170,76,0.3)] ${isSubmitDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${isOverQuota ? "from-red-500 to-red-600" : "from-primary to-primary/80"} transition-all duration-700`} />
                                <div className={`absolute inset-0 flex items-center justify-center gap-3 ${isOverQuota ? "text-white" : "text-black"} z-10 transition-colors duration-500`}>
                                    {isAnalyzing
                                        ? "Processing..."
                                        : isOverQuota
                                            ? "Daily Quota Reached"
                                            : mainTab === "customize"
                                                ? "Customize Resume"
                                                : "Analyze Resume"
                                    }
                                    {!isOverQuota && <ArrowRight className="w-4 h-4 group-hover/submit:translate-x-2 transition-transform duration-700" />}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
