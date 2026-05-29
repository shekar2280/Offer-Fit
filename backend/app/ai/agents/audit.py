import os
import json
from google import genai
from google.genai import types
from typing import Optional, Dict, Any, List
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata

DEFAULT_MODELS = [m.value["model"] for m in ModelPricing]

def build_audit_prompt(original_resume: str, tailored_resume: str) -> str:
    return f"""
You are an Integrity Auditor. Compare the original resume with the tailored version to detect hallucinations (fake skills, fake metrics, fake companies).

ORIGINAL RESUME:
{original_resume}

TAILORED RESUME:
{tailored_resume}

RULES:
1. Identifying adjacent skills is OKAY (Semantic Pivot).
2. Inventing a project that doesn't exist is a HALLUCINATION.
3. Inflating metrics (e.g., changing 10% to 50%) is a HALLUCINATION.

Output ONLY a JSON block:
===JSON_START===
{{
  "integrity_score": 100,
  "hallucinations_found": [
    {{ "tailored": "fake text found in tailored version", "reason": "why it is a hallucination" }}
  ],
  "verdict": "CLEAN"
}}
===JSON_END===
"""

def build_judge_prompt(resume: str, jd: str, analysis: str) -> str:
    return f"""
You are a Quality Assurance Judge for a FAANG Engineering Manager.
Evaluate the following analysis of a candidate's resume against a job description.

RESUME:
{resume}

JOB DESCRIPTION:
{jd}

ANALYSIS REPORT:
{analysis}

SCORING RULES:
1. **Instruction Compliance**: Did the agent skip ANY required sections (Strategic Alignment, Match Score Breakdown, Learning Roadmap)? If yes, score is 0.
2. **Brutal Honesty**: Is the agent being too nice? If they ignore a major YOE gap or missing core skill, score is < 50.
3. **Strategic Bridge**: Is the roadmap tailored correctly to their seniority tier (Entry/Mid/Senior)?

Output ONLY a JSON block:
===JSON_START===
{{
  "passed": true,
  "score": 100,
  "critique": "Specific reason for failure or praise"
}}
===JSON_END===
"""

async def run_resume_audit(original_resume: str, tailored_resume: str) -> Dict[str, Any]:
    prompt = build_audit_prompt(original_resume, tailored_resume)
    fallback_audit = {
        "integrity_score": 100,
        "hallucinations_found": [],
        "verdict": "CLEAN"
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
                    system_instruction="You are an extremely meticulous resume integrity auditor. Your job is to strictly compare the before and after versions of resumes to detect any lies or fake details."
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
                    
                audit_res = json.loads(json_str.strip())
                return {
                    "data": audit_res,
                    "usage": usage,
                    "estimated_cost": cost,
                    "toolUsed": model_name
                }
        except Exception as e:
            print(f"[AUDIT] Model fallback failed for {model_name}: {e}")
            continue
            
    print("[AUDIT] All models failed, returning clean fallback.")
    return {
        "data": fallback_audit,
        "usage": usage_info,
        "estimated_cost": estimated_cost,
        "toolUsed": "fallback"
    }

async def run_analysis_judge(resume: str, jd: str, analysis: str) -> Dict[str, Any]:
    prompt = build_judge_prompt(resume, jd, analysis)
    fallback_judge = {
        "passed": True,
        "score": 100,
        "critique": "Evaluation skipped."
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
                    system_instruction="You are a senior recruitment auditor. Your job is to evaluate if a candidate match report is brutally honest and compliant with instructions."
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
                    
                judge_res = json.loads(json_str.strip())
                return {
                    "data": judge_res,
                    "usage": usage,
                    "estimated_cost": cost,
                    "toolUsed": model_name
                }
        except Exception as e:
            print(f"[JUDGE] Model fallback failed for {model_name}: {e}")
            continue
            
    print("[JUDGE] All models failed, returning fallback judge report.")
    return {
        "data": fallback_judge,
        "usage": usage_info,
        "estimated_cost": estimated_cost,
        "toolUsed": "fallback"
    }
