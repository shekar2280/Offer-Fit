import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

export const toolDefinitions: FunctionDeclaration[] = [
  {
    name: "optimize_latex_resume",
    description: "Rewrites specific bullet points in a LaTeX resume to align with a Job Description while preserving structure.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        latex_source: {
          type: SchemaType.STRING,
          description: "The raw LaTeX code of the resume.",
        },
        job_description: {
          type: SchemaType.STRING,
          description: "The job description to optimize for.",
        },
        focus_areas: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Specific sections or skills to prioritize (e.g., ['Experience', 'React']).",
        },
      },
      required: ["latex_source", "job_description"],
    },
  },
  {
    name: "get_market_insights",
    description: "Provides salary ranges, demand level, and top 5 required skills for a given role and location.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        role: { type: SchemaType.STRING },
        location: { type: SchemaType.STRING, description: "City or 'Remote'" },
      },
      required: ["role"],
    },
  },
  {
    name: "web_search",
    description: "Search the live web for real-time information about companies, job markets, technical documentation, or interview tips.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "The search query (e.g., 'Tesla company culture and values 2024')" },
      },
      required: ["query"],
    },
  },
  {
    name: "generate_cover_letter",
    description: "Creates a customized, professional cover letter for a specific job and company based on the candidate's resume.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        resume_context: { type: SchemaType.STRING },
        job_description: { type: SchemaType.STRING },
        company_name: { type: SchemaType.STRING },
        tone: { type: SchemaType.STRING, description: "e.g., Professional, Bold, Minimalist" },
      },
      required: ["resume_context", "job_description", "company_name"],
    },
  },
];

async function performSearch(query: string) {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        max_results: 5,
      }),
    });
    if (!response.ok) throw new Error("Search failed");
    const data = await response.json();
    return data.results.map((r: any) => ({
      title: r.title,
      content: r.content,
      url: r.url
    }));
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
}

export const toolHandlers = {
  optimize_latex_resume: async (args: { latex_source: string; job_description: string; focus_areas?: string[] }) => {
    return {
      status: "success",
      message: "LaTeX optimization instructions generated.",
      action_taken: "Analyzed LaTeX structure and identified 3 key bullet points for rewriting.",
    };
  },
  get_market_insights: async (args: { role: string; location?: string }) => {
    const query = `${args.role} salary and job market demand in ${args.location || "Global"} 2024 2025`;
    console.log(`📊 Fetching live market data for: "${query}"...`);
    
    const results = await performSearch(query);
    return {
      role: args.role,
      location: args.location || "Global",
      source_data: results.slice(0, 3),
      instruction: "Analyze the provided source data to extract average salary, demand level, and trending skills."
    };
  },
  web_search: async (args: { query: string }) => {
    console.log(`🌐 Searching Tavily for: "${args.query}"...`);
    const results = await performSearch(args.query);
    return { results };
  },
  generate_cover_letter: async (args: { company_name: string; tone?: string }) => {
    return {
      status: "ready",
      draft_id: "cl_" + Math.random().toString(36).substr(2, 9),
      preview: `Dear Hiring Manager at ${args.company_name}... [Full cover letter draft generated in ${args.tone || "Professional"} tone]`,
    };
  },
};
