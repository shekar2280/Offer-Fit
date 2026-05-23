export interface SalaryInsight {
  range: string;
  currency: string;
  seniority: string;
}

export interface InterviewQuestion {
  q: string;
  intent: string;
}

export interface InterviewData {
  questions: (string | InterviewQuestion)[];
  preparation_focus?: string;
}

export interface StrategyData {
  strategy_pillars: string[];
  key_keywords_to_inject?: string[];
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