export interface SalaryInsight {
    range: string;
    currency: string;
    seniority: string;
}

export interface InterviewQuestion {
    q: string;
    intent: string;
}

export interface AnalysisInsights {
    matchScore?: number;
    verdict?: string;
    atsScore: number;
    keywordDensity: number;
    matchedSkills: string[];
    missingSkills: string[];
    salaryInsight?: SalaryInsight;
    redFlags?: string[];
    interviewQuestions?: InterviewQuestion[];
    outreachEmail?: string;
}

export interface AnalysisReportProps {
    analysis: string;
    isAnalyzing: boolean;
    loadingStep: number;
    loadingMessages: string[];
    companyName: string;
    position: string;
    onReset: () => void;
    mode?: "analysis" | "customize";
    onSwitchMode: (newMode: "analysis" | "customize") => void;
    isHistoryMode?: boolean;
    hasCustomization?: boolean;
    insights?: AnalysisInsights | null;
    serverError?: string | null;
}
