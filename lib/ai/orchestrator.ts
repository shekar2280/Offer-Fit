import { SupabaseClient } from "@supabase/supabase-js";
import { runResearchAgent } from "./agents/research-agent";
import { runStrategyAgent } from "./agents/strategy-agent";
import { runAnalysisAgent } from "./agents/analysis-agent";
import { runIntelAgent } from "./agents/intel-agent";
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
  const [intel, strategy] = await Promise.all([
    runResearchAgent(supabase, companyName),
    runStrategyAgent(companyName, position, context, jd)
  ]);

  const [draftResults, intelData] = await Promise.all([
    runAnalysisAgent(
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
      strategy
    ),
    runIntelAgent(companyName, position, location)
  ]);

  const audit = await evaluateResumeAudit(draftResults.markdown, jd);

  return {
    ...draftResults,
    data: { ...draftResults.data, ...intelData },
    strategy,
    intel,
    audit
  };
}
