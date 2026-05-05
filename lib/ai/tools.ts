import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

export const toolDefinitions: FunctionDeclaration[] = [
  {
    name: "get_market_insights",
    description: "Provides salary ranges, demand level, and top 5 required skills for a given role and location.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        role: { type: SchemaType.STRING, description: "The job title or role." },
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
  get_market_insights: async (args: { role: string; location?: string }) => {
    const query = `${args.role} salary and job market demand in ${args.location || "Global"} 2026`;
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
};
