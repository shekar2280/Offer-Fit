import httpx
import os
import json
import logging
from google import genai
from google.genai import types
from typing import Optional, Dict, Any, List
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata
import asyncio

logger = logging.getLogger(__name__)

DEFAULT_MODELS = [m.value["model"] for m in ModelPricing]

async def perform_search(query: str, tavily_api_key: Optional[str] = None) -> List[Dict[str, str]]:
    api_key = tavily_api_key or os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.warning("TAVILY_API_KEY not configured — skipping live search")
        return []
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": api_key,
                    "query": query,
                    "search_depth": "basic",
                    "max_results": 5
                },
                timeout=15.0
            )
            if response.status_code != 200:
                logger.warning("Tavily search request failed: status=%s", response.status_code)
                return []
            
            data = response.json()
            results = data.get("results", [])
            return [
                {
                    "title": r.get("title", ""),
                    "content": r.get("content", ""),
                    "url": r.get("url", "")
                }
                for r in results
            ]
    except Exception as e:
        logger.error("Tavily search error: %s", e)
        return []

def build_research_distillation_prompt(
    company_name: str,
    search_results: str,
    position: str,
    location: Optional[str] = None
) -> str:
    return f"""
You are a Company Research Distiller. Based on the following raw search results for {company_name}, extract the most relevant technical and cultural intelligence, as well as role-specific insights.

ROLE: {position}
LOCATION: {location or "Global"}

### MANDATORY SALARY LOGIC:
1. **REGION LOCK**: You MUST anchor compensation to the job's location: {location or "the target country"}.
2. **India Enforcement**: If Location is "India", use ₹ (Rupees) and "LPA" (e.g., 15 LPA). USD is strictly FORBIDDEN.
3. **USA Enforcement**: If Location is "USA", use $ (USD) and "Yearly" (e.g., $120,000 - $150,000).

### MONETIZED SCHEME / COURSE PLATFORM CHECK:
If the search results reveal this entity is a course selling platform, training program, unpaid bootcamp, or monetized internship scheme masquerading as a normal tech company or actual job opportunity, you MUST call this out prominently in "values_culture" and "company_cheat_sheet". Specify that it requires payment, acts as a course funnel, or is not a traditional engineering organization.

RAW SEARCH DATA:
{search_results}

Output the following JSON block EXACTLY as shown:

===JSON_START===
{{
  "tech_stack": {{
    "frontend": ["React", "Tailwind"],
    "backend": ["Node.js", "PostgreSQL"],
    "infrastructure": ["AWS", "Kubernetes"]
  }},
  "values_culture": "3-5 key cultural values",
  "engineering_blog_summary": "One sentence summary",
  "is_startup": false,
  "salary_insight": {{ "range": "8-15 LPA", "currency": "INR", "seniority": "Mid" }},
  "company_cheat_sheet": "• High-growth tech company\\n• Values innovation",
  "culture_traits": ["Innovative", "Fast-paced"],
  "domain": "company.com"
}}
===JSON_END===
"""

async def run_research_agent(
    company_name: str,
    position: str,
    location: Optional[str] = None,
    tavily_api_key: Optional[str] = None
) -> Dict[str, Any]:
    search_queries = [
        f"{company_name} engineering tech stack and backend tools 2024 2025",
        f"{company_name} company values engineering culture mission",
        f"{company_name} {position} salary range {location or 'India'}",
        f"{company_name} reviews course selling platform scam pay money internship"
    ]
    
    search_tasks = [perform_search(q, tavily_api_key) for q in search_queries]
    results_lists = await asyncio.gather(*search_tasks)
        
    combined_texts = []
    for r_list in results_lists:
        for r in r_list:
            combined_texts.append(f"Title: {r['title']}\nContent: {r['content']}\nURL: {r['url']}\n")
            
    combined_search_results = "\n---\n".join(combined_texts)
    
    prompt = build_research_distillation_prompt(
        company_name=company_name,
        search_results=combined_search_results,
        position=position,
        location=location
    )
    
    fallback_intel = {
        "company_name": company_name,
        "tech_stack": {
            "frontend": [],
            "backend": [],
            "infrastructure": [],
            "salary_insight": { "range": "Competitive", "currency": "INR" if (location and "india" in location.lower()) else "USD", "seniority": "Mid" },
            "company_cheat_sheet": f"• Active player in the {position} space\n• Focuses on scale and reliability\n• Emphasizes standard engineering best practices",
            "culture_traits": ["Collaborative", "Technical", "Goal-oriented"]
        },
        "values_culture": "Standard technical and growth-oriented company values.",
        "engineering_blog_summary": "No recent public engineering posts retrieved.",
        "is_startup": False,
        "salary_insight": { "range": "Competitive", "currency": "INR" if (location and "india" in location.lower()) else "USD", "seniority": "Mid" },
        "company_cheat_sheet": f"• Active player in the {position} space\n• Focuses on scale and reliability\n• Emphasizes standard engineering best practices",
        "culture_traits": ["Collaborative", "Technical", "Goal-oriented"],
        "domain": None,
        "logo_url": None
    }
    
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    usage_info = {"promptTokenCount": 0, "candidatesTokenCount": 0, "totalTokenCount": 0}
    estimated_cost = 0.0

    for model_name in DEFAULT_MODELS:
        try:
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an expert corporate researcher and data analyst. Your job is to extract extremely clean, validated company profiles in the strict JSON format requested."
                )
            )
            text = response.text
            usage = extract_usage_metadata(response)
            cost = calculate_cost(usage["promptTokenCount"], usage["candidatesTokenCount"], model_name)
            
            json_start_marker = "===JSON_START==="
            json_end_marker = "===JSON_END==="
            
            if json_start_marker in text and json_end_marker in text:
                start_idx = text.find(json_start_marker)
                end_idx = text.find(json_end_marker)
                json_str = text[start_idx + len(json_start_marker):end_idx].strip()
                
                if json_str.startswith("```json"):
                    json_str = json_str[7:]
                if json_str.startswith("```"):
                    json_str = json_str[3:]
                if json_str.endswith("```"):
                    json_str = json_str[:-3]
                    
                distilled = json.loads(json_str.strip())
                
                raw_domain = distilled.get("domain", "").strip().lower()
                # Clean up domain helper
                if raw_domain.startswith("http://"):
                    raw_domain = raw_domain[7:]
                elif raw_domain.startswith("https://"):
                    raw_domain = raw_domain[8:]
                if raw_domain.startswith("www."):
                    raw_domain = raw_domain[4:]
                domain = raw_domain.split("/")[0] if raw_domain else None

                db_payload = {
                    "company_name": company_name,
                    "tech_stack": {
                        **distilled.get("tech_stack", {}),
                        "salary_insight": distilled.get("salary_insight", fallback_intel["salary_insight"]),
                        "company_cheat_sheet": distilled.get("company_cheat_sheet", fallback_intel["company_cheat_sheet"]),
                        "culture_traits": distilled.get("culture_traits", fallback_intel["culture_traits"])
                    },
                    "values_culture": distilled.get("values_culture", fallback_intel["values_culture"]),
                    "engineering_blog_summary": distilled.get("engineering_blog_summary", fallback_intel["engineering_blog_summary"]),
                    "is_startup": distilled.get("is_startup", False),
                    "salary_insight": distilled.get("salary_insight", fallback_intel["salary_insight"]),
                    "company_cheat_sheet": distilled.get("company_cheat_sheet", fallback_intel["company_cheat_sheet"]),
                    "culture_traits": distilled.get("culture_traits", fallback_intel["culture_traits"]),
                    "domain": domain,
                    "logo_url": f"https://www.google.com/s2/favicons?domain={domain}&sz=256" if domain else None
                }
                
                return {
                    "data": db_payload,
                    "usage": usage,
                    "estimated_cost": cost,
                    "toolUsed": model_name
                }
        except Exception as e:
            logger.warning("Research model fallback failed for %s: %s", model_name, e)
            continue
            
    logger.error("All research distillation models failed — returning fallback payload")
    return {
        "data": fallback_intel,
        "usage": usage_info,
        "estimated_cost": estimated_cost,
        "toolUsed": "fallback"
    }
