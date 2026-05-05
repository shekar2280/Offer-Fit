"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { ActiveWorkspaceProps } from "./workspace-types";
import { WorkspaceHeader } from "./workspace/workspace-header";
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
        analyzeResume
    } = props;

    const isSubmitDisabled = isAnalyzing || isUploading || (mainTab === "customize" ? !latexText : !extractedText) || !jobDescription;

    return (
        <div className="w-full flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="w-full max-w-5xl mx-auto relative z-10 pb-4">
                <div className="bg-black/40 border border-white/[0.05] rounded-[3rem] pt-4 px-8 pb-8 sm:pt-6 sm:px-10 sm:pb-8 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative">
                    <WorkspaceHeader onReset={onReset} />

                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
                    
                    <div className="relative z-10 flex flex-col space-y-10">
                        <ResumeSetup 
                            mainTab={mainTab}
                            latexText={latexText}
                            setLatexText={setLatexText}
                            extractedText={extractedText}
                            handleFile={handleFile}
                            isUploading={isUploading}
                            saveBaselineLatex={saveBaselineLatex}
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
                        />

                        <div className="pt-3 border-t border-white/5 flex justify-end">
                            <button
                                onClick={() => {
                                    if (!isSubmitDisabled) {
                                        mainTab === "customize" ? analyzeResume(latexText) : analyzeResume(extractedText || "");
                                    }
                                }}
                                className={`relative w-full sm:w-auto sm:min-w-[300px] px-8 py-5 rounded-full font-heading font-black text-xs uppercase tracking-[0.3em] transition-all duration-700 overflow-hidden group/submit shadow-[0_0_40px_rgba(242,170,76,0.1)] hover:shadow-[0_0_60px_rgba(242,170,76,0.3)] ${isSubmitDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-opacity duration-700" />
                                <div className="absolute inset-0 flex items-center justify-center gap-3 text-black z-10 transition-colors duration-500">
                                    {isAnalyzing ? "Processing..." : (mainTab === "customize" ? "Customize Resume" : "Analyze Resume")}
                                    <ArrowRight className="w-4 h-4 group-hover/submit:translate-x-2 transition-transform duration-700" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
