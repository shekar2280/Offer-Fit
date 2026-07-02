import logging
import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

class ExtractedEvidenceSchema(BaseModel):
    context_summary: str = Field(description="A clean, professional 2-sentence summary of what the project does, extracted and distilled from the raw Project Context (README). Do not include markdown badges or raw image links.")
    features: List[str] = Field(description="Clean, structured list of features the user explicitly built, derived from their input.")
    evidence: List[str] = Field(description="Factual list of verifiable technical actions taken COMBINED with the business purpose, extracted STRICTLY from the raw commits/notes. DO NOT make up metrics or exaggerate.")
    signals: List[str] = Field(description="Engineering signals demonstrated (e.g. ownership, deployment, fullstack, rag, scaling, performance)")

class ProjectIntelOutput(BaseModel):
    context_summary: str
    features: List[str]
    evidence: List[str]
    signals: List[str]

async def run_project_kb_parser(
    project_name: str,
    context: str,
    technologies: List[str],
    features_input: List[Dict[str, str]],
    existing_features: Optional[List[str]] = None,
    existing_evidence: Optional[List[str]] = None
) -> ProjectIntelOutput:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    prompt = f"""
You are an expert technical intelligence parser. 
Given the following project context, existing stored facts, and new user contributions (commits, PR notes, features), distill the user's specific work into structured resume evidence.

PROJECT CONTEXT (What the app does):
Name: {project_name}
Description: {context}
Technologies Used: {', '.join(technologies)}
"""

    if existing_features or existing_evidence:
        prompt += f"""
EXISTING STORED FACTS:
Features Built: {json.dumps(existing_features, indent=2)}
Evidence: {json.dumps(existing_evidence, indent=2)}
"""

    prompt += f"""
NEW USER CONTRIBUTIONS (New commits and PRs since last sync):
{json.dumps(features_input, indent=2)}

Factual Constraints:
1. ONLY extract evidence/features for work explicitly listed in the NEW USER CONTRIBUTIONS.
2. If there are EXISTING STORED FACTS, merge the new features and evidence into them. Do not lose the old facts, but append new distinct features/evidence. Remove duplicates.
3. Under "context_summary", write a clean, professional 2-sentence summary of the overall PROJECT CONTEXT. Make sure to identify the primary platforms, frameworks, or devices of the project (e.g., if it's a mobile app like React Native/Flutter, make sure to explicitly state that in the summary). Strip out any markdown badges, image links, or table syntax.
4. Under "features", provide the cumulative clean description of the features the user built (merged with existing).
5. Under "evidence", list cumulative technical evidence statements (merged with existing, max 6 bullet points).
6. For "signals", categorize the engineering concepts demonstrated strictly by the user's contributions (e.g. 'rag', 'deployment', 'testing', 'fullstack', 'mobile').

You MUST return your output as a valid JSON object matching the following structure:
{{
  "context_summary": "clean 2-sentence summary of what the project does",
  "features": ["cumulative list of features user built"],
  "evidence": ["cumulative technical evidence statements, max 6 items"],
  "signals": ["engineering concept tags"]
}}
"""

    content = None
    last_err = None
    models_to_try = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash", "gemini-2.5-flash", "groq-llama-3.3-70b"]
    
    for model_name in models_to_try:
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
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.0
                }
                async with httpx.AsyncClient() as client_http:
                    response = await client_http.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=30.0)
                if response.status_code != 200:
                    raise Exception(f"Groq API call failed: {response.text}")
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"]
            else:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.0
                    )
                )
                content = response.text
            break
        except Exception as e:
            last_err = e
            continue

    if not content:
        logger.error(f"All models failed for project KB. Last error: {last_err}")
        return ProjectIntelOutput(context_summary=context[:1000], features=existing_features or [], evidence=existing_evidence or [], signals=[])

    try:
        parsed_data = json.loads(content.strip())
        return ProjectIntelOutput(
            context_summary=parsed_data.get("context_summary", context[:1000]),
            features=parsed_data.get("features", []),
            evidence=parsed_data.get("evidence", []),
            signals=parsed_data.get("signals", [])
        )
    except Exception as e:
        logger.error(f"Error parsing project KB JSON: {e}")
        return ProjectIntelOutput(context_summary=context[:1000], features=existing_features or [], evidence=existing_evidence or [], signals=[])
