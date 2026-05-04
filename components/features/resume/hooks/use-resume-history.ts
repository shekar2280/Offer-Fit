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
          setJobData({
            company: data.company_name || "",
            role: data.position || "",
            description: data.job_description || ""
          });
          
          const atsScore = data.ats_score ?? 0;
          const derivedVerdict = atsScore >= 70 ? "APPLY" : atsScore >= 50 ? "STRETCH" : "PASS";
          
          setAnalysisState({
            analysis: mode === "customize" ? (data.latex_source || "") : (data.analysis_result || ""),
            cachedAnalysis: data.analysis_result || "",
            cachedCustomize: data.latex_source || "",
            currentAnalysisId: data.id,
            hasCustomization: data.has_customization || false,
            insights: {
              matchScore: atsScore,
              verdict: derivedVerdict,
              atsScore: atsScore,
              keywordDensity: data.keyword_density ?? 0,
              matchedSkills: data.matched_skills || [],
              missingSkills: data.missing_skills || [],
              salaryInsight: data.salary_insight || undefined,
              redFlags: data.red_flags || [],
              interviewQuestions: data.interview_questions || [],
              outreachEmail: data.outreach_email || undefined,
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
