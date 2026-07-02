import os
import json
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from app.core.supabase import get_project_intelligence

class DeploymentItemMatch(BaseModel):
    component: str
    platform: str
    status: Optional[str] = None

class ProjectEvidenceMatch(BaseModel):
    project_name: str = Field(description="The exact name of the project")
    score: int = Field(description="Matching score from 0 to 100 based on JD intents alignment")
    selected_evidence: List[str] = Field(description="List of factual evidence bullets from the project intelligence")
    selected_technologies: List[str] = Field(description="Technologies used in this project that are relevant to the JD")
    selected_signals: List[str] = Field(description="Signals demonstrated by this project that map to the JD")
    deployments: Optional[List[DeploymentItemMatch]] = Field(None, description="The array of component deployment objects")

class PipelineScoringSchema(BaseModel):
    project_rankings: List[ProjectEvidenceMatch] = Field(description="Ranked list of projects ordered by highest matching score first")

async def run_project_scorer(user_id: str, jd_intents: Dict[str, Any]) -> List[Dict[str, Any]]:
    projects = await get_project_intelligence(user_id)
    if not projects:
        return []

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    projects_input = []
    for p in projects:
        projects_input.append({
            "project_name": p["project_name"],
            "features": p.get("features_built", []),
            "technologies": p.get("tech_stack", []),
            "signals": p.get("signals", []),
            "evidence": p.get("evidence", []),
            "deployments": p.get("deployments", [])
        })

    prompt = f"""
You are an expert technical resume architect. 
Your task is to:
1. Score and rank the user's projects based on how well they match the extracted Job Description (JD) intents.
2. For each project, select the specific, factual evidence statements (from the provided project facts) that directly demonstrate the skills, signals, and technologies desired in the JD.

SEMANTIC MAPPING & TRANSLATION RULES:
1. DATABASES (POSTGRESQL): Map cloud database providers like 'Neon', 'Supabase', or generic 'SQL'/'DB' directly to 'Postgres'/'PostgreSQL'.
2. CLOUD DEPLOYMENTS: Map platforms like 'Vercel', 'Render', 'AWS', 'GCP', 'Docker' in the 'deployments' list to cloud infrastructure.
3. INTEGRATIONS: Match references to Chrome Extensions, Gemini API, OpenAI API, authentication, or external REST/GraphQL APIs.
4. END-TO-END OWNERSHIP: Recognize keywords like 'designed', 'built', 'deployed', 'implemented', 'shipped', 'setup', and 'configured' as indicators of full-stack ownership.
5. AI WORKFLOWS: Prioritize evidence covering RAG, vector databases, LLM calls, and hallucination checks.

Constraints:
1. ONLY select evidence statements that are explicitly provided in the project data. DO NOT invent, exaggerate, or summarize.
2. Order the resulting rankings from highest score to lowest score.

JD Intents:
{json.dumps(jd_intents, indent=2)}

User's Projects:
{json.dumps(projects_input, indent=2)}
"""

    models = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash", "gemini-2.5-flash", "groq-llama-3.3-70b"]
    response_text = None
    last_err = None

    for model_name in models:
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
                        {"role": "system", "content": "You are a professional resume scorer."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.0
                }
                async with httpx.AsyncClient() as http_client:
                    res = await http_client.post(
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
                        response_schema=PipelineScoringSchema,
                        temperature=0.0
                    )
                )
                response_text = response.text
            break
        except Exception as e:
            last_err = e
            continue

    if not response_text:
        rankings = []
        for p in projects:
            rankings.append({
                "project_name": p["project_name"],
                "score": 50,
                "selected_evidence": p.get("evidence", [])[:2],
                "selected_technologies": p.get("tech_stack", []),
                "selected_signals": p.get("signals", []),
                "deployments": p.get("deployments", [])
            })
        return rankings

    try:
        parsed = json.loads(response_text.strip())
        rankings = parsed.get("project_rankings", [])
        return rankings
    except Exception:
        rankings = []
        for p in projects:
            rankings.append({
                "project_name": p["project_name"],
                "score": 50,
                "selected_evidence": p.get("evidence", [])[:2],
                "selected_technologies": p.get("tech_stack", []),
                "selected_signals": p.get("signals", []),
                "deployments": p.get("deployments", [])
            })
        return rankings
