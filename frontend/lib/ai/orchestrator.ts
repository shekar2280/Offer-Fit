import { SupabaseClient } from "@supabase/supabase-js";
import { runResearchAgent } from "./agents/research-agent";
import { runAnalysisAgent } from "./agents/analysis-agent";
import { runStrategyAgent } from "./agents/strategy-agent";
import { evaluateResumeAudit } from "./evaluator";

export async function runMultiStepCustomization(
  supabase: SupabaseClient,
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  userName?: string,
  jdPillars?: any,
) {
  const intel = await runResearchAgent(
    supabase,
    companyName,
    position,
    location,
  );

  const strategyResult = await runStrategyAgent(
    companyName,
    position,
    context,
    jd,
    jdPillars,
  );
  const executionPlan = strategyResult.data;

  const draftResults = await runAnalysisAgent(
    companyName,
    position,
    context,
    jd,
    location,
    jobType,
    "customize",
    true,
    userName,
    intel,
    executionPlan,
  );

  const audit = await evaluateResumeAudit(draftResults.markdown, jd);

  const intelData = {
    salary_insight: intel.salary_insight,
    company_cheat_sheet: intel.company_cheat_sheet,
    culture_traits: intel.culture_traits,
  };

  const totalPromptTokens =
    (intel.usage?.promptTokenCount || 0) +
    (strategyResult.usage?.promptTokenCount || 0) +
    (draftResults.usage?.promptTokenCount || 0) +
    (audit.usage?.promptTokenCount || 0);
  const totalCandidatesTokens =
    (intel.usage?.candidatesTokenCount || 0) +
    (strategyResult.usage?.candidatesTokenCount || 0) +
    (draftResults.usage?.candidatesTokenCount || 0) +
    (audit.usage?.candidatesTokenCount || 0);
  const totalTokenCount =
    (intel.usage?.totalTokenCount || 0) +
    (strategyResult.usage?.totalTokenCount || 0) +
    (draftResults.usage?.totalTokenCount || 0) +
    (audit.usage?.totalTokenCount || 0);
  const totalCost =
    (intel.estimated_cost || 0) +
    (strategyResult.estimated_cost || 0) +
    (draftResults.estimated_cost || 0) +
    (audit.estimated_cost || 0);

  return {
    ...draftResults,
    data: { ...(draftResults.data as Record<string, unknown>), ...intelData },
    strategy: executionPlan,
    intel,
    audit,
    usage: {
      promptTokenCount: totalPromptTokens,
      candidatesTokenCount: totalCandidatesTokens,
      totalTokenCount: totalTokenCount,
    },
    estimated_cost: totalCost,
  };
}
