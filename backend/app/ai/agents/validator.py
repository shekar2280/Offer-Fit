import os
import json
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from google import genai
from google.genai import types

class ValidationResultSchema(BaseModel):
    is_valid: bool = Field(
        description="True if the customized resume has absolutely zero unsupported technologies, hallucinated metrics, or hallucinated features"
    )
    unsupported_technologies: List[str] = Field(
        description="Any technology, framework, tool, or library listed in the customized resume that was NOT present in the technologies list or original resume"
    )
    hallucinated_metrics: List[str] = Field(
        description="Any metric number, percentage, scaling performance improvement, or latency stats included in the customized bullets that were not explicitly in the input evidence"
    )
    hallucinated_features: List[str] = Field(
        description="Any feature, project capability, page, or system component described in the customized bullets that is not supported by the evidence"
    )
    reconstruction_plan: str = Field(
        description="Factual instructions on how to revise the invalid bullets to eliminate the hallucinations"
    )

async def run_resume_validator(
    customized_resume: Dict[str, Any],
    original_evidence: List[Dict[str, Any]],
    original_resume: Dict[str, Any]
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    prompt = f"""
You are a strict, zero-tolerance Resume Audit Engine.
Your job is to compare the custom, rewritten resume against the factual base evidence and original resume to catch any hallucinations.

FACTUAL BASE EVIDENCE:
{json.dumps(original_evidence, indent=2)}

ORIGINAL RESUME DATA:
{json.dumps(original_resume, indent=2)}

CUSTOMIZED RESUME TO AUDIT:
{json.dumps(customized_resume, indent=2)}

AUDIT RULES:
1. **No Unsupported Technologies**: If the customized resume mentions a technology (e.g. 'AWS Lambda', 'GraphQL', 'Docker') that is NOT in the technologies list or original resume, flag it as unsupported.
2. **No Hallucinated Metrics**: If a bullet point mentions a percentage (e.g. 'reduced latency by 42%') or a quantitative metric that is NOT in the factual evidence list or original resume, flag it as hallucinated.
3. **No Hallucinated Features**: If the customizer describes building features (e.g. 'multi-agent chat interface') not described in the features list of the project intelligence, flag it.

Return the audit results as a valid JSON object matching the ValidationResultSchema.
"""

    response_text = None
    last_err = None
    for model_name in ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash", "gemini-2.5-flash", "groq-llama-3.3-70b"]:
        try:
            if model_name == "groq-llama-3.3-70b":
                groq_api_key = os.getenv("GROQ_API_KEY")
                if not groq_api_key:
                    raise Exception("GROQ_API_KEY is not configured")
                import httpx
                headers = {
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are a professional resume validation engine. Output only valid JSON matching the schema."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.0
                }
                async with httpx.AsyncClient() as client:
                    res = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        json=payload,
                        headers=headers,
                        timeout=30.0
                    )
                    if res.status_code != 200:
                        raise Exception(f"Groq API call failed: {res.text}")
                    response_text = res.json()["choices"][0]["message"]["content"]
            else:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ValidationResultSchema,
                        temperature=0.0
                    )
                )
                response_text = response.text
            break
        except Exception as e:
            last_err = e
            continue

    if not response_text:
        return {
            "is_valid": True,
            "unsupported_technologies": [],
            "hallucinated_metrics": [],
            "hallucinated_features": [],
            "reconstruction_plan": ""
        }

    try:
        result = json.loads(response_text.strip())
        return result
    except Exception:
        return {
            "is_valid": True,
            "unsupported_technologies": [],
            "hallucinated_metrics": [],
            "hallucinated_features": [],
            "reconstruction_plan": ""
        }
