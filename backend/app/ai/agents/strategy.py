import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata

DEFAULT_MODELS = [m.value["model"] for m in ModelPricing]

class StrategistExecutionPlan(BaseModel):
    missing_skills: List[str] = Field(description="Skills required by the JD Pillars that are completely missing from the Master Resume.")
    weak_points: List[str] = Field(description="Experience areas in the Master Resume that are weak compared to the JD Core Impact areas.")
    execution_plan: List[str] = Field(description="Strict, actionable instructions for the Writer agent (e.g., 'Delete the irrelevant e-commerce project', 'Rewrite the third bullet of role X to emphasize metric Y').")

def build_strategy_prompt(
    company_name: str,
    position: str,
    resume_text: str,
    jd_pillars: Optional[Dict[str, Any]],
    jd: str
) -> str:
    pillars_text = json.dumps(jd_pillars, indent=2) if jd_pillars else "Not available. Infer from JD."
    
    return f"""
You are Agent 2: The Strategist in a multi-agent resume customization pipeline.
Your job is to compare the candidate's Master Resume against the Job Description and the extracted JD Pillars to create a Gap Analysis and a strict Execution Plan.

ROLE CONTEXT:
- Company: {company_name}
- Position: {position}

JD PILLARS:
{pillars_text}

JOB DESCRIPTION:
{jd}

CANDIDATE MASTER RESUME:
{resume_text}

TASK:
1. Perform a Semantic Gap Analysis: Identify missing skills and weak experience areas.
2. Formulate an Execution Plan: Write 3-5 strict, actionable instructions for Agent 3 (The Writer).
   - Tell the Writer exactly which projects/roles to emphasize.
   - Tell the Writer exactly which irrelevant projects to drastically cut or remove to hit a 1-page limit (unless the candidate has 10+ years of experience, then allow a concise 2-page limit).
   - Tell the Writer which specific bullets to rewrite to better align with the Core Impact Areas.

Output structured JSON matching the provided schema.
"""

async def run_strategy_agent(
    company_name: str,
    position: str,
    resume_text: str,
    jd: str,
    jd_pillars: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    prompt = build_strategy_prompt(company_name, position, resume_text, jd_pillars, jd)
    
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
                    system_instruction="You are a senior technical recruiter and talent advisor. Output valid JSON only.",
                    response_mime_type="application/json",
                    response_schema=StrategistExecutionPlan,
                )
            )
            text = response.text.strip()
            usage = extract_usage_metadata(response)
            cost = calculate_cost(usage["promptTokenCount"], usage["candidatesTokenCount"], model_name)
            
            try:
                strategy = json.loads(text)
            except json.JSONDecodeError:
                strategy = {
                    "missing_skills": [],
                    "weak_points": [],
                    "execution_plan": ["Reorganize skills to match JD.", "Use XYZ format for bullets."]
                }
                
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
        "data": {
            "missing_skills": [],
            "weak_points": [],
            "execution_plan": ["Surgically align technical skills.", "Quantify impact.", "Optimize keyword density."]
        },
        "usage": usage_info,
        "estimated_cost": estimated_cost,
        "toolUsed": "fallback"
    }
