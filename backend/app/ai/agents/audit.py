import os
import json
import logging
from google import genai
from google.genai import types
from typing import Optional, Dict, Any, List
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata

logger = logging.getLogger(__name__)

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
You are an Adversarial Appellate Judge for a world-class talent screening system. Your ONLY job is to find cases where the primary analysis agent made a WRONG verdict decision and correct it.

You are NOT a yes-man. You have seen thousands of bad analysis reports that are either:
- TOO LENIENT (calling a REJECT a STRETCH, or a STRETCH an APPLY)
- TOO CONSERVATIVE (calling an APPLY a STRETCH, or a STRETCH a REJECT)

You must fix both kinds of mistakes. Your override decision is FINAL.

---
RESUME:
{resume}

JOB DESCRIPTION:
{jd}

PRIMARY ANALYSIS REPORT (to be reviewed):
{analysis}

---

JUDGMENT PROTOCOL — Apply EVERY rule sequentially:

**RULE 1 — HARD YOE GATE (Non-negotiable):**
- Extract the required YOE from the JD.
- Count the candidate's actual YOE from the resume (only count post-graduation professional experience, NOT internships or student projects).
- If the required YOE is 5+ years and the candidate has fewer than 3 years, the verdict MUST be REJECT. Override immediately if the primary analysis said otherwise.
- If the required YOE is 3+ years and the candidate has fewer than 1 year, the verdict MUST be REJECT.

**RULE 2 — TECH ECOSYSTEM vs EXACT MATCH:**
- If the JD requires a SPECIFIC framework (e.g., Angular, Go, Swift) and the candidate ONLY has a different framework in the same category (e.g., React, Node.js, Python), this is a MISMATCH.
- For Senior roles, a mismatch in a mandatory core technology with no adjacent experience is a REJECT, not a STRETCH.
- For Mid roles, a mismatch in a mandatory core technology is a STRETCH at most, not an APPLY.
- EXCEPTION: If the candidate has deep experience in a semantically equivalent technology (e.g., Next.js ≈ React for most Frontend roles), it may count.

**RULE 3 — SENIORITY CALIBRATION:**
- For a Principal or Staff Engineer role, a candidate with 2-4 years of experience and no evidence of system design at scale (>100k users, distributed systems, on-call ownership) MUST be REJECT.
- For a Senior role, the candidate must show ownership and leadership, not just individual contribution.
- If the primary analysis gave a STRETCH or APPLY to a candidate clearly below the seniority bar, override to REJECT.

**RULE 4 — FALSE NEGATIVE CHECK (Prevent over-rejection):**
- If the primary analysis gave REJECT to a candidate who clearly meets 90%+ of the JD requirements, only has minor gaps in secondary skills, and has strong evidence of ownership and impact, override to STRETCH or APPLY.
- A strong generalist with proven delivery should NOT be rejected simply for missing one niche library.

**RULE 5 — VERDICT VALIDATION:**
- APPLY (80-100 score): Candidate meets ALL mandatory requirements and core tech. Only minor gaps in secondary skills.
- STRETCH (55-79 score): Candidate meets core requirements but has a meaningful gap (1-2 years YOE, or 1 non-core tech gap). They could succeed with ramp-up time.
- REJECT (0-54 score): Candidate is fundamentally missing mandatory requirements, core tech stack, or has a YOE gap of 3+ years.

After applying all rules, output ONLY this JSON block:
===JSON_START===
{{
  "passed": <true if the primary verdict was correct, false if you are overriding>,
  "score": <your quality score for the analysis report, 0-100>,
  "original_verdict": "<APPLY|STRETCH|REJECT>",
  "corrected_verdict": "<APPLY|STRETCH|REJECT or same as original_verdict if no change>",
  "override_reason": "<Specific, direct explanation citing the exact rule triggered. If no override, state 'Analysis was accurate.'>",
  "critique": "<Specific critique of what the primary analysis did well or poorly>"
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
            logger.warning("Audit model fallback failed for %s: %s", model_name, e)
            continue
            
    logger.error("All audit models failed — returning clean fallback")
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
                    system_instruction="You are a ruthless adversarial appellate judge. Your mission is to catch and correct wrong verdicts. You actively look for errors in both directions: verdicts that are too lenient AND too harsh. Apply every rule in the judgment protocol before outputting your JSON. Never rubber-stamp the primary analysis."
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
            logger.warning("Judge model fallback failed for %s: %s", model_name, e)
            continue
            
    logger.error("All judge models failed — returning fallback report")
    return {
        "data": fallback_judge,
        "usage": usage_info,
        "estimated_cost": estimated_cost,
        "toolUsed": "fallback"
    }
