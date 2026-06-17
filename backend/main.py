from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
import logging
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

load_dotenv()

from app.ai.agents.analysis import run_analysis_agent
from app.ai.agents.research import run_research_agent
from app.ai.agents.strategy import run_strategy_agent
from app.ai.agents.audit import run_resume_audit, run_analysis_judge
from app.ai.agents.pillars import run_extract_pillars
from google import genai

async def verify_api_key(request: Request, x_api_key: Optional[str] = Header(None)):
    if request.url.path == "/health":
        return
    expected_key = os.getenv("BACKEND_API_KEY")
    if not expected_key:
        raise HTTPException(status_code=500, detail="BACKEND_API_KEY environment variable is not set on the server")
    if x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

app = FastAPI(title="Offer Fit AI API", dependencies=[Depends(verify_api_key)])

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = list(set([
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://offerfit.vercel.app",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    company_name: str
    position: str
    context: str
    jd: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    mode: str = "analyze"
    user_name: Optional[str] = None
    intel: Optional[Dict[str, Any]] = None
    execution_plan: Optional[Dict[str, Any]] = None
    bypass_judge: bool = False
    jd_pillars: Optional[Dict[str, Any]] = None

class ResearchRequest(BaseModel):
    company_name: str
    position: str
    location: Optional[str] = None
    tavily_api_key: Optional[str] = None

class StrategyRequest(BaseModel):
    company_name: str
    position: str
    resume_text: str
    jd: str
    jd_pillars: Optional[Dict[str, Any]] = None

class AuditRequest(BaseModel):
    original_resume: str
    tailored_resume: str

class JudgeRequest(BaseModel):
    resume: str
    jd: str
    analysis: str

class InsightsRequest(BaseModel):
    resumeText: str
    jobDescription: str

class PillarsRequest(BaseModel):
    jd: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    try:
        result = await run_analysis_agent(
            company_name=req.company_name,
            position=req.position,
            context=req.context,
            jd=req.jd,
            location=req.location,
            job_type=req.job_type,
            mode=req.mode,
            user_name=req.user_name,
            intel=req.intel,
            execution_plan=req.execution_plan,
            jd_pillars=req.jd_pillars
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/research")
async def research(req: ResearchRequest):
    try:
        result = await run_research_agent(
            company_name=req.company_name,
            position=req.position,
            location=req.location,
            tavily_api_key=req.tavily_api_key
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/strategy")
async def strategy(req: StrategyRequest):
    try:
        result = await run_strategy_agent(
            company_name=req.company_name,
            position=req.position,
            resume_text=req.resume_text,
            jd=req.jd,
            jd_pillars=req.jd_pillars
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/audit")
async def audit(req: AuditRequest):
    try:
        result = await run_resume_audit(
            original_resume=req.original_resume,
            tailored_resume=req.tailored_resume
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/judge")
async def judge(req: JudgeRequest):
    try:
        result = await run_analysis_judge(
            resume=req.resume,
            jd=req.jd,
            analysis=req.analysis
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-pillars")
async def extract_pillars(req: PillarsRequest):
    try:
        result = await run_extract_pillars(jd=req.jd)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/insights")
async def insights(req: InsightsRequest):
    try:
        prompt = f"""
You are an ATS (Applicant Tracking System) engine and keyword analyst.

RESUME:
{req.resumeText}

JOB DESCRIPTION:
{req.jobDescription}

TASK: Analyze the resume against the JD. Return ONLY valid JSON — no markdown, no code fences, no commentary.

Extract:
1. atsScore: integer 0-100. How many of the JD's critical keywords/skills appear verbatim or with strong semantic equivalence in the resume.
2. matchedSkills: array of up to 12 specific skills/technologies/tools that appear in BOTH the JD and resume. Short labels only (e.g. "React", "TypeScript", "REST APIs").
3. missingSkills: array of up to 12 critical skills/technologies/tools mentioned in the JD that are ABSENT from the resume. Short labels only.
4. keywordDensity: integer 0-100. How well the resume's language mirrors the JD's terminology and phrasing.

Return exactly this shape:
{{
  "atsScore": 72,
  "keywordDensity": 65,
  "matchedSkills": ["React", "TypeScript", "Node.js"],
  "missingSkills": ["GraphQL", "AWS Lambda", "Kubernetes"]
}}
"""
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        client = genai.Client(api_key=api_key) if api_key else genai.Client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        import json
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        data = json.loads(text.strip())
        return data
    except Exception as e:
        logger.error("ATS insights generation failed: %s", e)
        return { "atsScore": 0, "keywordDensity": 0, "matchedSkills": [], "missingSkills": [] }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
