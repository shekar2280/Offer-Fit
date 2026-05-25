import React from "react";

export interface ActiveWorkspaceProps {
    mainTab: "analysis" | "customize";
    onBack: () => void;
    companyName: string;
    setCompanyName: (val: string) => void;
    position: string;
    setPosition: (val: string) => void;
    jobDescription: string;
    setJobDescription: (val: string) => void;
    location: string;
    setLocation: (val: string) => void;
    jobType: string;
    setJobType: (val: string) => void;
    latexText: string;
    setLatexText: (val: string) => void;
    extractedText: string | null;
    handleFile: (file: File, uploadMode?: "analysis" | "customize") => void;
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
    companyInputRef?: React.RefObject<HTMLInputElement | null>;
    isOverQuota?: boolean;
}
