import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { GEMINI_MODELS } from "../../constants";
import { getCompanyIntel, upsertCompanyIntel } from "../../supabase/intel";
import { performSearch } from "../tools";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const RESEARCH_DISTILLATION_PROMPT = (
  companyName: string,
  searchResults: string
) => `
You are a Research Distiller. Based on the following raw search results for ${companyName}, extract only the most relevant technical and cultural intelligence.

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
  "is_startup": <boolean>
}
===JSON_END===
`;

export async function runResearchAgent(
  supabase: SupabaseClient,
  companyName: string
) {
  const cachedIntel = await getCompanyIntel(supabase, companyName);
  if (cachedIntel) {
    return cachedIntel;
  }

  const searchQueries = [
    `${companyName} engineering tech stack and backend tools 2024 2025`,
    `${companyName} company values engineering culture mission`,
    `${companyName} recent engineering blog posts and technical challenges`
  ];

  const searchPromises = searchQueries.map(q => performSearch(q));
  const results = await Promise.all(searchPromises);
  const combinedResults = results.join("\n\n---\n\n");

  const prompt = RESEARCH_DISTILLATION_PROMPT(companyName, combinedResults);

  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let distilledData = { tech_stack: {}, values_culture: "", engineering_blog_summary: "", is_startup: false };
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
        } catch (e) {}
      }

      const savedIntel = await upsertCompanyIntel(supabase, {
        company_name: companyName,
        ...distilledData
      });

      return savedIntel;
    } catch (error: any) {
      continue;
    }
  }
  
  return await upsertCompanyIntel(supabase, {
    company_name: companyName,
    tech_stack: { frontend: [], backend: [], infrastructure: [] },
    values_culture: "Standard tech culture",
    engineering_blog_summary: "No recent public posts found.",
    is_startup: false
  });
}
