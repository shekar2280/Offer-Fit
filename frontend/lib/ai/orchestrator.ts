import { SupabaseClient } from "@supabase/supabase-js";
import { runResearchAgent } from "./agents/research-agent";
import { runAnalysisAgent } from "./agents/analysis-agent";
import { evaluateResumeAudit } from "./evaluator";

export async function runMultiStepCustomization(
  supabase: SupabaseClient,
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  userName?: string
) {
  const intel = await runResearchAgent(supabase, companyName, position, location);

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
    intel
  );

  const audit = await evaluateResumeAudit(draftResults.markdown, jd);

  const intelData = {
    salary_insight: intel.salary_insight,
    company_cheat_sheet: intel.company_cheat_sheet,
    culture_traits: intel.culture_traits
  };

  const totalPromptTokens = (intel.usage?.promptTokenCount || 0) + (draftResults.usage?.promptTokenCount || 0) + (audit.usage?.promptTokenCount || 0);
  const totalCandidatesTokens = (intel.usage?.candidatesTokenCount || 0) + (draftResults.usage?.candidatesTokenCount || 0) + (audit.usage?.candidatesTokenCount || 0);
  const totalTokenCount = (intel.usage?.totalTokenCount || 0) + (draftResults.usage?.totalTokenCount || 0) + (audit.usage?.totalTokenCount || 0);
  const totalCost = (intel.estimated_cost || 0) + (draftResults.estimated_cost || 0) + (audit.estimated_cost || 0);

  return {
    ...draftResults,
    data: { ...(draftResults.data as Record<string, unknown>), ...intelData },
    strategy: draftResults.strategy || {
      strategy_pillars: [
        "Surgically align technical skills with the Job Description.",
        "Quantify impact using metrics to demonstrate scale.",
        "Optimize keywords for ATS systems."
      ],
      key_keywords_to_inject: [],
      culture_vibe: "Professional"
    },
    intel,
    audit,
    usage: {
      promptTokenCount: totalPromptTokens,
      candidatesTokenCount: totalCandidatesTokens,
      totalTokenCount: totalTokenCount
    },
    estimated_cost: totalCost
  };
}

