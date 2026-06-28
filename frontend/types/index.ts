import React from "react";

export interface DeploymentItem {
    component: string;
    platform: string;
    status?: string;
}

export interface ProjectIntel {
    id: string;
    project_name: string;
    context: string;
    features_built: string[];
    tech_stack: string[];
    signals: string[];
    evidence: string[];
    deployments?: DeploymentItem[];
}

export interface FeatureInput {
    id: string;
    name: string;
    description: string;
    commits: string;
}


export interface SalaryInsight {
  range: string;
  currency: string;
  seniority: string;
}

export interface InterviewQuestion {
  q: string;
  intent: string;
}

export interface HistoryAnalysisItem {
    id: string;
    company_name: string;
    position: string;
    created_at: string;
    analysis_result?: string;
    customized_latex?: string;
}

export interface InfiniteHistoryData {
    pages: {
        data: HistoryAnalysisItem[];
        nextCursor: string | null;
    }[];
    pageParams: (string | null)[];
}

export interface InterviewData {
  questions: (string | InterviewQuestion)[];
  preparation_focus?: string;
}

export interface StrategyData {
  missing_skills: string[];
  weak_points: string[];
  execution_plan: string[];
}

export interface Hallucination {
  tailored: string;
  reason: string;
}

export interface AuditData {
  verdict: string;
  integrity_score: number;
  hallucinations_found?: (string | Hallucination)[];
}

export interface CompanyIntel {
    id: string;
    company_name: string;
    tech_stack: unknown;
    values_culture: string | null;
    engineering_blog_summary: string | null;
    is_startup: boolean;
    logo_url: string | null;
    domain: string | null;
    last_updated: string;
}

export interface AnalysisResult {
  match_score?: number;
  verdict?: string;
  ats_score?: number;
  keyword_density?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  salary_insight?: SalaryInsight;
  red_flags?: string[];
  interview_questions?: InterviewQuestion[];
  outreach_email?: string;
  tailored_latex?: string;
  toolUsed?: string;
  culture_fit_score?: number;
  company_cheat_sheet?: string;
  culture_traits?: string[];
  total_tokens?: number;
  estimated_cost?: number;
  intel?: CompanyIntel;
  strategy?: StrategyData;
  audit_report?: AuditData;
  judge_override?: boolean;
  judge_critique?: string;
  customized_json?: any;
  jd_intents?: any;
}

export interface AnalysisInsights extends AnalysisResult {
  tool_used?: string[];
}

export interface AnalysisState {
  id: string | null;
  companyName: string;
  position: string;
  jd: string;
  location: string;
  jobType: string;
  isAnalyzing: boolean;
  analysisResult?: string;
  customizationResult?: string;
  insights?: AnalysisResult;
}

export interface AnalysisContextType {
  state: AnalysisState;
  setAnalysisData: (data: Partial<AnalysisState>) => void;
  resetSession: () => void;
}

export interface AnalysisReportProps {
  analysis: string;
  isAnalyzing: boolean;
  loadingStep: number;
  loadingMessages: string[];
  companyName: string;
  position: string;
  analysisId?: string;
  onReset: () => void;
  mode?: "analysis" | "customize";
  onSwitchMode: (newMode: "analysis" | "customize") => void;
  isHistoryMode?: boolean;
  hasCustomization?: boolean;
  insights?: AnalysisInsights | null;
  serverError?: string | null;
  isEditingForm?: boolean;
  onToggleForm?: () => void;
  userName?: string;
  hasLatexSource?: boolean;
  originalLatex?: string | null;
  hasAnalysis?: boolean;
}

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
    isLoadingProfile?: boolean;
    hasGithubConnected?: boolean;
}

export interface DiffLine {
  type: "unchanged" | "added" | "removed";
  content: string;
  oldLineNo?: number;
  newLineNo?: number;
}

export interface Hunk {
  lines: DiffLine[];
  oldStart: number;
  newStart: number;
}

export interface LatexDiffViewerProps {
  original: string;
  updated: string;
  onCopyUpdated: () => void;
}

export interface ResumeSetupProps {
    mainTab: "analysis" | "customize";
    latexText: string;
    setLatexText: (val: string) => void;
    extractedText: string | null;
    handleFile: (file: File, uploadMode?: "analysis" | "customize") => void;
    isUploading: boolean;
    selectedId: string | null;
    saveBaselineLatex?: () => Promise<void>;
    isLoadingProfile?: boolean;
    hasGithubConnected?: boolean;
}
