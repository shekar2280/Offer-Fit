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
}
