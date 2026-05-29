import { SupabaseClient } from "@supabase/supabase-js";
import { getCompanyIntel, upsertCompanyIntel } from "@/services/supabase/intel";
import { CompanyIntel } from "@/types";

export type ResearchIntelWithUsage = CompanyIntel & {
  salary_insight: Record<string, string>;
  company_cheat_sheet: string;
  culture_traits: string[];
  usage?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
  estimated_cost?: number;
};

export async function runResearchAgent(
  supabase: SupabaseClient,
  companyName: string,
  position: string,
  location?: string
): Promise<ResearchIntelWithUsage> {
  const cachedIntel = await getCompanyIntel(supabase, companyName);
  if (cachedIntel) {
    const techStack = (cachedIntel.tech_stack as Record<string, any>) || {};
    return {
      ...cachedIntel,
      salary_insight: techStack.salary_insight || { range: "Competitive", currency: "INR", seniority: "Mid" },
      company_cheat_sheet: techStack.company_cheat_sheet || "• High-growth tech company\n• Values innovation and impact",
      culture_traits: techStack.culture_traits || ["Innovative", "Fast-paced"],
      usage: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      estimated_cost: 0
    };
  }

  const backendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";
  const res = await fetch(`${backendUrl}/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: companyName,
      position,
      location,
      tavily_api_key: process.env.TAVILY_API_KEY
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to run research agent in Python backend: ${res.statusText}`);
  }

  const jsonRes = await res.json();
  const data = jsonRes.data;

  const dbPayload = {
    company_name: companyName,
    tech_stack: data.tech_stack,
    values_culture: data.values_culture,
    engineering_blog_summary: data.engineering_blog_summary,
    is_startup: data.is_startup
  };

  const savedIntel = await upsertCompanyIntel(supabase, dbPayload);

  if (!savedIntel) {
    throw new Error("Failed to save company intel to DB");
  }

  return {
    ...savedIntel,
    salary_insight: data.salary_insight,
    company_cheat_sheet: data.company_cheat_sheet,
    culture_traits: data.culture_traits,
    usage: jsonRes.usage,
    estimated_cost: jsonRes.estimated_cost
  };
}


