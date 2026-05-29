import { CompanyIntel, StrategyData, AuditData } from "@/types";

export interface AgenticAnalysisResult {
  markdown: string;
  data: unknown;
  toolUsed: string;
  usage: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  estimated_cost: number;
  intel?: CompanyIntel;
  strategy?: StrategyData;
  audit?: AuditData;
  personaLabel?: string;
}

export async function runAnalysisAgent(
  companyName: string,
  position: string,
  context: string,
  jd: string,
  location?: string,
  jobType?: string,
  mode?: "analyze" | "customize",
  bypassJudge: boolean = false,
  userName?: string,
  intel?: CompanyIntel,
): Promise<AgenticAnalysisResult> {
  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
  
  const response = await fetch(`${backendUrl}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      company_name: companyName,
      position,
      context,
      jd,
      location,
      job_type: jobType,
      mode: mode || "analyze",
      user_name: userName,
      intel,
      bypass_judge: bypassJudge
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Python Backend Error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.usage) {
    result.usage = { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
  }
  
  return {
    markdown: result.markdown || "",
    data: result.data || {},
    personaLabel: result.personaLabel || "",
    toolUsed: result.toolUsed || "none",
    usage: result.usage,
    estimated_cost: result.estimated_cost || 0,
    strategy: result.strategy,
    audit: result.audit,
    intel: result.intel
  };
}
