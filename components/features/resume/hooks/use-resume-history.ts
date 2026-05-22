import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { AnalysisResult } from "@/lib/types";

export function useResumeHistory(selectedId: string | null | undefined, user: User | null, mode: string) {


  const [analysisOverride, setAnalysisOverride] = useState<string | null>(null);
  const [customizeOverride, setCustomizeOverride] = useState<string | null>(null);
  const [insightsOverride, setInsightsOverride] = useState<Partial<AnalysisResult> | null>(null);
  const [hasCustomizationOverride, setHasCustomizationOverride] = useState<boolean | null>(null);
  const [jobOverrides, setJobOverrides] = useState<{ company?: string; role?: string; description?: string }>({});

  const { data: savedData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["analysis", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const supabase = createClient();
      const { data } = await supabase
        .from("analyses")
        .select("*, intel:company_intel(*)")
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
    setCustomizeOverride(null);
    setInsightsOverride(null);
    setHasCustomizationOverride(null);
    setJobOverrides({});
  }, [selectedId]);

  const atsScore = savedData?.ats_score ?? 0;
  const derivedVerdict = atsScore >= 70 ? "APPLY" : atsScore >= 50 ? "STRETCH" : "REJECT";

  const cachedAnalysis = savedData?.analysis_result || "";
  const cachedCustomize = savedData?.customized_latex || "";

  const displayAnalysis = mode === "customize" 
    ? (customizeOverride ?? cachedCustomize)
    : (analysisOverride ?? cachedAnalysis);

  const jobData = {
    company: jobOverrides.company || savedData?.company_name || "",
    role: jobOverrides.role || savedData?.position || "",
    description: jobOverrides.description || savedData?.jd_text || "",
  };

  const setJobData = useCallback((update: Partial<typeof jobData> | ((prev: typeof jobData) => Partial<typeof jobData>)) => {
    if (typeof update === "function") {
      setJobOverrides((prev) => {
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

  const insights = insightsOverride || (savedData ? {
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
    intel: savedData.intel || undefined,
    strategy: savedData.customization_strategy || undefined,
    audit_report: savedData.audit_report || undefined,
  } : null);

  const analysisState = {
    analysis: displayAnalysis,
    cachedAnalysis,
    cachedCustomize,
    currentAnalysisId: savedData?.id ?? null,
    hasCustomization: hasCustomizationOverride ?? !!savedData?.customized_latex,
    insights,
  };

  const setAnalysisState = useCallback((update: Partial<typeof analysisState> | ((prev: typeof analysisState) => Partial<typeof analysisState>)) => {
    const next = typeof update === "function" ? update(analysisState) : update;
    
    if (next.analysis !== undefined) {
      if (mode === "customize") setCustomizeOverride(next.analysis || null);
      else setAnalysisOverride(next.analysis || null);
    }
    
    if (next.insights !== undefined) {
      setInsightsOverride(next.insights || null);
    }

    if (next.hasCustomization !== undefined) {
      setHasCustomizationOverride(next.hasCustomization);
    }
  }, [analysisState, mode]);

  return {
    isHistoryLoading: isHistoryLoading && !!selectedId,
    jobData,
    setJobData,
    analysisState,
    setAnalysisState,
  };
}
