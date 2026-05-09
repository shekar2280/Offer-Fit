import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAnalysis } from "@/lib/context/analysis-context";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export function useResumeHistory(selectedId: string | null | undefined, user: any, mode: string) {
  const { state: globalState } = useAnalysis();

  const [analysisOverride, setAnalysisOverride] = useState<string | null>(null);
  const [jobOverrides, setJobOverrides] = useState<{ company?: string; role?: string; description?: string }>({});

  const { data: savedData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["analysis", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const supabase = createClient();
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", selectedId)
        .single();
      return data;
    },
    enabled: !!selectedId && !!user,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setAnalysisOverride(null);
    setJobOverrides({});
  }, [selectedId]);

  const atsScore = savedData?.ats_score ?? 0;
  const derivedVerdict = atsScore >= 70 ? "APPLY" : atsScore >= 50 ? "STRETCH" : "REJECT";

  const cachedAnalysis = savedData?.analysis_result || "";
  const cachedCustomize = savedData?.customized_latex || "";

  const displayAnalysis = analysisOverride ?? (mode === "customize" ? cachedCustomize : cachedAnalysis);

  const jobData = {
    company: jobOverrides.company ?? savedData?.company_name ?? "",
    role: jobOverrides.role ?? savedData?.position ?? "",
    description: jobOverrides.description ?? savedData?.jd_text ?? "",
  };

  const setJobData = useCallback((update: any) => {
    if (typeof update === "function") {
      setJobOverrides((prev: any) => {
        const currentJobData = {
          company: prev.company ?? savedData?.company_name ?? "",
          role: prev.role ?? savedData?.position ?? "",
          description: prev.description ?? savedData?.jd_text ?? "",
        };
        return update(currentJobData);
      });
    } else {
      setJobOverrides(update);
    }
  }, [savedData]);

  const insights = savedData ? {
    match_score: savedData.match_score || atsScore,
    verdict: savedData.verdict || derivedVerdict,
    ats_score: atsScore,
    keyword_density: savedData.keyword_density ?? 0,
    matched_skills: savedData.matched_skills || [],
    missing_skills: savedData.missing_skills || [],
    salary_insight: savedData.salary_insight || undefined,
    red_flags: savedData.red_flags || [],
    interview_questions: savedData.interview_questions || [],
    outreach_email: savedData.outreach_email || undefined,
    culture_fit_score: savedData.culture_fit_score ?? undefined,
    company_cheat_sheet: savedData.company_cheat_sheet || undefined,
    culture_traits: savedData.culture_traits || [],
    total_tokens: savedData.total_tokens || 0,
    estimated_cost: savedData.estimated_cost || 0,
  } : null;

  const analysisState = {
    analysis: displayAnalysis,
    cachedAnalysis,
    cachedCustomize,
    currentAnalysisId: savedData?.id ?? null,
    hasCustomization: !!savedData?.customized_latex,
    insights,
  };

  const setAnalysisState = useCallback((update: any) => {
    const next = typeof update === "function" ? update(analysisState) : update;
    if (next.analysis !== undefined) {
      setAnalysisOverride(next.analysis || null);
    }
    if (next.currentAnalysisId !== undefined) {
    }
  }, [analysisState]);

  return {
    isHistoryLoading: isHistoryLoading && !!selectedId,
    jobData,
    setJobData,
    analysisState,
    setAnalysisState,
  };
}
