import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
from fastapi import HTTPException
from app.core.utils import calculate_cost, extract_usage_metadata
from app.core.constants import ModelPricing
class JDPillarsSchema(BaseModel):
    techStack: List[str] = Field(description="List of primary technologies, frameworks, languages, and tools required.")
    seniority: str = Field(description="The inferred seniority level (e.g., 'Junior', 'Mid-level', 'Senior', 'Staff', 'Lead').")
    coreImpact: List[str] = Field(description="3-5 core business impact areas or primary responsibilities of the role.")
    mandatoryRequirements: List[str] = Field(description="Strict mandatory requirements (e.g., '5+ years experience', 'Bachelor Degree in CS', 'Active Top Secret Clearance').")

async def run_extract_pillars(jd: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    prompt = f"""
You are an expert technical recruiter and HR analyst.
Your task is to analyze the following Job Description and extract the core pillars of the role.

JOB DESCRIPTION:
{jd}

Extract the following information:
1. techStack: The main technologies and tools required.
2. seniority: The seniority level implied or stated.
3. coreImpact: The primary responsibilities and the business impact expected.
4. mandatoryRequirements: The non-negotiable requirements (years of experience, degrees, specific domain knowledge).

Output structured JSON matching the provided schema.
"""
    fallback_models = [m.value["model"] for m in ModelPricing]
    
    response = None
    successful_model = None
    
    for model_name in fallback_models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are a JSON-only data extraction bot. Output only valid JSON.",
                    response_mime_type="application/json",
                    response_schema=JDPillarsSchema,
                )
            )
            successful_model = model_name
            break
        except Exception as e:
            continue
            
    if not response:
        return {
            "pillars": {"techStack": [], "seniority": "Unknown", "coreImpact": [], "mandatoryRequirements": []},
            "usage": {"promptTokenCount": 0, "candidatesTokenCount": 0, "totalTokenCount": 0},
            "estimated_cost": 0.0
        }
        
    try:
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        usage = extract_usage_metadata(response)
        cost = calculate_cost(usage.get("promptTokenCount", 0), usage.get("candidatesTokenCount", 0), successful_model)
        
        try:
            data = json.loads(text)
        except json.JSONDecodeError as jde:
            data = {"techStack": [], "seniority": "Unknown", "coreImpact": [], "mandatoryRequirements": []}
            
        return {
            "pillars": data,
            "usage": usage,
            "estimated_cost": cost
        }
    except Exception as e:
        return {
            "pillars": {"techStack": [], "seniority": "Unknown", "coreImpact": [], "mandatoryRequirements": []},
            "usage": {"promptTokenCount": 0, "candidatesTokenCount": 0, "totalTokenCount": 0},
            "estimated_cost": 0.0
        }
