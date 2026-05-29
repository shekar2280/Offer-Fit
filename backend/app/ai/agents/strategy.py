import os
import json
from google import genai
from google.genai import types
from typing import Optional, Dict, Any, List
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata

DEFAULT_MODELS = [m.value["model"] for m in ModelPricing]

def build_strategy_prompt(
    company_name: str,
    position: str,
    resume_text: str,
    jd: str
) -> str:
    return f"""
You are a Resume Strategy Architect. Your goal is to design a high-level customization strategy for a candidate applying to {company_name} for the {position} role.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd}

Output the following JSON block EXACTLY as shown:

===JSON_START===
{{
  "strategy_pillars": [
    "**[Focus Area]** - How we will change the resume",
    "**[Focus Area]** - How we will change the resume",
    "**[Focus Area]** - How we will change the resume"
  ],
  "key_keywords_to_inject": ["keyword1", "keyword2"],
  "culture_vibe": "e.g., Highly technical and scale-focused"
}}
===JSON_END===
"""

async def run_strategy_agent(
    company_name: str,
    position: str,
    resume_text: str,
    jd: str
) -> Dict[str, Any]:
    prompt = build_strategy_prompt(company_name, position, resume_text, jd)
    
    fallback_strategy = {
        "strategy_pillars": [
            "Surgically align technical skills with the Job Description's core requirements.",
            "Quantify impact using X-Y-Z metrics to demonstrate ownership and scale.",
            "Optimize keyword density for ATS systems while maintaining natural readability."
        ],
        "key_keywords_to_inject": [],
        "culture_vibe": "Professional and impact-oriented"
    }
    
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    usage_info = {"promptTokenCount": 0, "candidatesTokenCount": 0, "totalTokenCount": 0}
    estimated_cost = 0.0

    for model_name in DEFAULT_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are a senior technical recruiter and talent advisor. Your job is to analyze a candidate resume and job description to devise a bulletproof resume tailoring strategy."
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
                    
                strategy = json.loads(json_str.strip())
                return {
                    "data": strategy,
                    "usage": usage,
                    "estimated_cost": cost,
                    "toolUsed": model_name
                }
        except Exception as e:
            print(f"[STRATEGY] Model fallback failed for {model_name}: {e}")
            continue
            
    print("[STRATEGY] All models failed, returning fallback strategy.")
    return {
        "data": fallback_strategy,
        "usage": usage_info,
        "estimated_cost": estimated_cost,
        "toolUsed": "fallback"
    }
