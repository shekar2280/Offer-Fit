export interface SalaryInsight {
  range: string;
  currency: string;
  seniority: string;
}

export interface InterviewQuestion {
  q: string;
  intent: string;
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
}

export interface AnalysisState {
  id: string | null;
  companyName: string;
  position: string;
  jd: string;
  location: string;
  jobType: string;
  isAnalyzing: boolean;
}

export interface AnalysisContextType {
  state: AnalysisState;
  setAnalysisData: (data: Partial<AnalysisState>) => void;
  resetSession: () => void;
}
