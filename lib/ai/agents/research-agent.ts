import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { GEMINI_MODELS } from "../../constants";
import { getCompanyIntel, upsertCompanyIntel } from "../../supabase/intel";
import { performSearch } from "../tools";
import { CompanyIntel } from "../../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const RESEARCH_DISTILLATION_PROMPT = (
  companyName: string,
  searchResults: string,
  position: string,
  location?: string
) => `
You are a Company Research Distiller. Based on the following raw search results for ${companyName}, extract the most relevant technical and cultural intelligence, as well as role-specific insights.

ROLE: ${position}
LOCATION: ${location || "Global"}

### MANDATORY SALARY LOGIC:
1. **REGION LOCK**: You MUST anchor compensation to the job's location: ${location || "the target country"}.
2. **India Enforcement**: If Location is "India", use ₹ (Rupees) and "LPA" (e.g., 15 LPA). USD is strictly FORBIDDEN.
3. **USA Enforcement**: If Location is "USA", use $ (USD) and "Yearly" (e.g., $120,000 - $150,000).

RAW SEARCH DATA:
${searchResults}

Output the following JSON block EXACTLY as shown:

===JSON_START===
{
  "tech_stack": {
    "frontend": ["React", "Tailwind", ...],
    "backend": ["Node.js", "PostgreSQL", ...],
    "infrastructure": ["AWS", "Kubernetes", ...]
  },
  "values_culture": "3-5 key cultural values (e.g., 'Bias for action', 'Data-driven decision making')",
  "engineering_blog_summary": "One sentence summary of their latest engineering focus (e.g., 'Recently migrated to microservices to handle 2x scale')",
  "is_startup": <boolean>,
  "salary_insight": { "range": "<e.g. 8-15 LPA>", "currency": "<INR|USD>", "seniority": "<Junior|Mid|Senior>" },
  "company_cheat_sheet": "<3-5 concise bullet points about ${companyName}: mission, recent news, tech stack, culture, what they value in candidates. Format as newline-separated bullet points starting with •>",
  "culture_traits": ["trait1", "trait2", "trait3"]
}
===JSON_END===
`;

export async function runResearchAgent(
  supabase: SupabaseClient,
  companyName: string,
  position: string,
  location?: string
) {
  const cachedIntel = await getCompanyIntel(supabase, companyName);
  if (cachedIntel) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const techStack = (cachedIntel.tech_stack as Record<string, any>) || {};
    return {
      ...cachedIntel,
      salary_insight: techStack.salary_insight || { range: "Competitive", currency: "INR", seniority: "Mid" },
      company_cheat_sheet: techStack.company_cheat_sheet || "• High-growth tech company\n• Values innovation and impact",
      culture_traits: techStack.culture_traits || ["Innovative", "Fast-paced"]
    } as CompanyIntel & { salary_insight: Record<string, string>; company_cheat_sheet: string; culture_traits: string[] };
  }

  const searchQueries = [
    `${companyName} engineering tech stack and backend tools 2024 2025`,
    `${companyName} company values engineering culture mission`,
    `${companyName} ${position} salary range ${location || "India"}`
  ];

  const searchPromises = searchQueries.map(q => performSearch(q));
  const results = await Promise.all(searchPromises);
  const combinedResults = results.join("\n\n---\n\n");

  const prompt = RESEARCH_DISTILLATION_PROMPT(companyName, combinedResults, position, location);

  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let distilledData = { 
        tech_stack: { frontend: [], backend: [], infrastructure: [] }, 
        values_culture: "", 
        engineering_blog_summary: "", 
        is_startup: false,
        salary_insight: { range: "Competitive", currency: "INR", seniority: "Mid" },
        company_cheat_sheet: "• High-growth tech company\n• Values innovation and impact",
        culture_traits: ["Innovative", "Fast-paced"]
      };

      const jsonStartMarker = "===JSON_START===";
      const jsonEndMarker = "===JSON_END===";
      const startIndex = text.indexOf(jsonStartMarker);
      const endIndex = text.indexOf(jsonEndMarker);

      if (startIndex !== -1 && endIndex !== -1) {
        let jsonStr = text.substring(startIndex + jsonStartMarker.length, endIndex).trim();
        if (jsonStr.includes("```json")) {
          jsonStr = jsonStr.replace(/```json\s?/, "").replace(/```/, "").trim();
        } else if (jsonStr.includes("```")) {
          jsonStr = jsonStr.replace(/```\s?/, "").replace(/```/, "").trim();
        }
        try {
          distilledData = JSON.parse(jsonStr);
        } catch {}
      }

      const dbPayload = {
        company_name: companyName,
        tech_stack: {
          ...distilledData.tech_stack,
          salary_insight: distilledData.salary_insight,
          company_cheat_sheet: distilledData.company_cheat_sheet,
          culture_traits: distilledData.culture_traits
        },
        values_culture: distilledData.values_culture,
        engineering_blog_summary: distilledData.engineering_blog_summary,
        is_startup: distilledData.is_startup
      };

      const savedIntel = await upsertCompanyIntel(supabase, dbPayload);

      if (!savedIntel) {
        throw new Error("Failed to save company intel to DB");
      }

      return {
        ...savedIntel,
        salary_insight: distilledData.salary_insight,
        company_cheat_sheet: distilledData.company_cheat_sheet,
        culture_traits: distilledData.culture_traits
      } as CompanyIntel & { salary_insight: Record<string, string>; company_cheat_sheet: string; culture_traits: string[] };
    } catch {
      continue;
    }
  }
  
  const fallbackIntel = {
    company_name: companyName,
    tech_stack: { frontend: [], backend: [], infrastructure: [] },
    values_culture: "Standard tech culture",
    engineering_blog_summary: "No recent public posts found.",
    is_startup: false,
    salary_insight: { range: "Competitive", currency: "INR", seniority: "Mid" },
    company_cheat_sheet: "• High-growth tech company\n• Values innovation and impact",
    culture_traits: ["Innovative", "Fast-paced"]
  };

  const dbFallbackPayload = {
    ...fallbackIntel,
    tech_stack: {
      ...fallbackIntel.tech_stack,
      salary_insight: fallbackIntel.salary_insight,
      company_cheat_sheet: fallbackIntel.company_cheat_sheet,
      culture_traits: fallbackIntel.culture_traits
    }
  };

  const savedFallback = await upsertCompanyIntel(supabase, dbFallbackPayload);

  return {
    ...(savedFallback || fallbackIntel),
    salary_insight: fallbackIntel.salary_insight,
    company_cheat_sheet: fallbackIntel.company_cheat_sheet,
    culture_traits: fallbackIntel.culture_traits
  } as CompanyIntel & { salary_insight: Record<string, string>; company_cheat_sheet: string; culture_traits: string[] };
}


