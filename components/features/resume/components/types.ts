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
    match_score: number;
    verdict: string;
    ats_score: number;
    keyword_density: number;
    matched_skills: string[];
    missing_skills: string[];
    salary_insight?: SalaryInsight;
    red_flags?: string[];
    interview_questions?: InterviewQuestion[];
    outreach_email?: string;
    tool_used?: string[];
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
