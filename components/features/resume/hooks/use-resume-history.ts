import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useResumeHistory(selectedId: string | null | undefined, user: any, mode: string) {
  const [isHistoryLoading, setIsHistoryLoading] = useState(!!selectedId);
  const [jobData, setJobData] = useState({ company: "", role: "", description: "" });
  const [analysisState, setAnalysisState] = useState({ 
    analysis: "", 
    cachedAnalysis: "", 
    cachedCustomize: "", 
    currentAnalysisId: null as string | null,
    hasCustomization: false,
    insights: null as any
  });

  useEffect(() => {
    if (!user || !selectedId) return;

    const fetchSavedAnalysis = async () => {
      try {
        setIsHistoryLoading(true);
        const supabase = createClient();
        const { data } = await supabase
          .from("analyses")
          .select("*")
          .eq("id", selectedId)
          .single();

        if (data) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlJd = urlParams.get("jd");
          const urlCompany = urlParams.get("company");
          const urlRole = urlParams.get("role");

          setJobData({
            company: urlCompany || data.company_name || "",
            role: urlRole || data.position || "",
            description: urlJd || data.jd_text || ""
          });
          
          const atsScore = data.ats_score ?? 0;
          const derivedVerdict = atsScore >= 70 ? "APPLY" : atsScore >= 50 ? "STRETCH" : "REJECT";
          
          setAnalysisState({
            analysis: mode === "customize" ? (data.customized_latex || "") : (data.analysis_result || ""),
            cachedAnalysis: data.analysis_result || "",
            cachedCustomize: data.customized_latex || "",
            currentAnalysisId: data.id,
            hasCustomization: !!data.customized_latex,
            insights: {
              match_score: data.match_score || atsScore,
              verdict: data.verdict || derivedVerdict,
              ats_score: atsScore,
              keyword_density: data.keyword_density ?? 0,
              matched_skills: data.matched_skills || [],
              missing_skills: data.missing_skills || [],
              salary_insight: data.salary_insight || undefined,
              red_flags: data.red_flags || [],
              interview_questions: data.interview_questions || [],
              outreach_email: data.outreach_email || undefined,
              culture_fit_score: data.culture_fit_score ?? undefined,
              company_cheat_sheet: data.company_cheat_sheet || undefined,
              culture_traits: data.culture_traits || [],
            }
          });
        }
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchSavedAnalysis();
  }, [selectedId, user, mode]);

  return { isHistoryLoading, jobData, setJobData, analysisState, setAnalysisState };
}
