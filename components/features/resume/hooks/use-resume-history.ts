import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/services/supabase/client";

import { useQueryClient, useQuery, keepPreviousData } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { AnalysisResult } from "@/types";

export function useResumeHistory(selectedId: string | null | undefined, user: User | null, mode: string) {
  const queryClient = useQueryClient();
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
    enabled: !!selectedId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setJobOverrides({});
  }, [selectedId]);

  const atsScore = savedData?.ats_score ?? 0;
  const derivedVerdict = atsScore >= 70 ? "APPLY" : atsScore >= 50 ? "STRETCH" : "REJECT";

  const cachedAnalysis = savedData?.analysis_result || "";
  const cachedCustomize = savedData?.customized_latex || "";

  const displayAnalysis = mode === "customize" ? cachedCustomize : cachedAnalysis;

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
    intel: savedData.intel || undefined,
    strategy: savedData.customization_strategy || undefined,
    audit_report: savedData.audit_report || undefined,
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
    if (!selectedId) return;

    queryClient.setQueryData(["analysis", selectedId], (oldData: any) => {
      const baseData = oldData || { id: selectedId };
      const next = typeof update === "function" ? update({
        analysis: mode === "customize" ? baseData.customized_latex : baseData.analysis_result,
        insights: baseData,
        hasCustomization: !!baseData.customized_latex
      }) : update;

      const newData = { ...baseData };
      if (next.analysis !== undefined) {
        if (mode === "customize") newData.customized_latex = next.analysis;
        else newData.analysis_result = next.analysis;
      }
      if (next.insights !== undefined) {
        const insightsObj = next.insights;
        if (insightsObj === null) {
            newData.match_score = null;
            newData.verdict = null;
            newData.ats_score = null;
            newData.keyword_density = null;
            newData.matched_skills = null;
            newData.missing_skills = null;
            newData.salary_insight = null;
            newData.red_flags = null;
            newData.interview_questions = null;
            newData.outreach_email = null;
            newData.culture_fit_score = null;
            newData.company_cheat_sheet = null;
            newData.culture_traits = null;
            newData.total_tokens = null;
            newData.estimated_cost = null;
            newData.intel = null;
            newData.customization_strategy = null;
            newData.audit_report = null;
        } else {
            if (insightsObj.match_score !== undefined) newData.match_score = insightsObj.match_score;
            if (insightsObj.verdict !== undefined) newData.verdict = insightsObj.verdict;
            if (insightsObj.ats_score !== undefined) newData.ats_score = insightsObj.ats_score;
            if (insightsObj.keyword_density !== undefined) newData.keyword_density = insightsObj.keyword_density;
            if (insightsObj.matched_skills !== undefined) newData.matched_skills = insightsObj.matched_skills;
            if (insightsObj.missing_skills !== undefined) newData.missing_skills = insightsObj.missing_skills;
            if (insightsObj.salary_insight !== undefined) newData.salary_insight = insightsObj.salary_insight;
            if (insightsObj.red_flags !== undefined) newData.red_flags = insightsObj.red_flags;
            if (insightsObj.interview_questions !== undefined) newData.interview_questions = insightsObj.interview_questions;
            if (insightsObj.outreach_email !== undefined) newData.outreach_email = insightsObj.outreach_email;
            if (insightsObj.culture_fit_score !== undefined) newData.culture_fit_score = insightsObj.culture_fit_score;
            if (insightsObj.company_cheat_sheet !== undefined) newData.company_cheat_sheet = insightsObj.company_cheat_sheet;
            if (insightsObj.culture_traits !== undefined) newData.culture_traits = insightsObj.culture_traits;
            if (insightsObj.total_tokens !== undefined) newData.total_tokens = insightsObj.total_tokens;
            if (insightsObj.estimated_cost !== undefined) newData.estimated_cost = insightsObj.estimated_cost;
            if (insightsObj.intel !== undefined) newData.intel = insightsObj.intel;
            if (insightsObj.strategy !== undefined) newData.customization_strategy = insightsObj.strategy;
            if (insightsObj.audit_report !== undefined) newData.audit_report = insightsObj.audit_report;
        }
      }
      if (next.hasCustomization !== undefined) {
        newData.customized_latex = next.hasCustomization ? (newData.customized_latex || " ") : null;
      }
      return newData;
    });
  }, [selectedId, mode, queryClient]);

  return {
    isHistoryLoading: isHistoryLoading && !!selectedId,
    jobData,
    setJobData,
    analysisState,
    setAnalysisState,
  };
}
