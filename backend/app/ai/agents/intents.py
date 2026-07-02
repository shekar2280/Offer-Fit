import os
import json
from pydantic import BaseModel, Field
from typing import Dict, Any

class JDIntentsSchema(BaseModel):
    technical: Dict[str, int] = Field(
        description="Map of hard skills, technologies, and frameworks required (e.g., 'python', 'rag', 'typescript') to weight (1-10)"
    )
    ownership: Dict[str, int] = Field(
        description="Map of ownership signals, post-deployment, initiatives (e.g., 'ownership', 'monitoring', 'incident response') to weight (1-10)"
    )
    engineering: Dict[str, int] = Field(
        description="Map of engineering concepts/craftsmanship (e.g., 'testing', 'ci/cd', 'maintainability', 'security') to weight (1-10)"
    )

async def run_jd_intent_extractor(jd: str) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    prompt = f"""
You are an expert technical recruiter. Analyze the following Job Description (JD) and extract the critical signals, competencies, and technologies desired.
Do not perform generic keyword matching. Instead, extract the true *intents* of the hiring team.

Categorize them into:
1. **technical**: Key technologies, frameworks, and tools (e.g. RAG, Python, FastAPI, Postgres).
2. **ownership**: Soft and leadership signals representing independent execution, post-deployment support, and high-agency.
3. **engineering**: Software craftsmanship signals (e.g. integration testing, CI/CD, maintainability, performance tradeoffs).

Assign an importance weight between 1 (low) and 10 (critical) for each signal based on how prominent it is in the JD.

Return a JSON object in exactly this format (keys should be strings and values integers from 1-10):
{{
  "technical": {{"python": 8, "fastapi": 7}},
  "ownership": {{"mentoring": 6, "architecture": 9}},
  "engineering": {{"ci/cd": 5, "testing": 8}}
}}

Job Description:
{jd}
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
                        {"role": "system", "content": "You are a professional recruiting assistant. Output only valid JSON matching the schema."},
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
                        temperature=0.0
                    )
                )
                response_text = response.text
            break
        except Exception as e:
            last_err = e
            continue

    if not response_text:
        raise last_err

    try:
        result = json.loads(response_text.strip())
        return result
    except Exception as e:
        return {
            "technical": {},
            "ownership": {},
            "engineering": {}
        }
