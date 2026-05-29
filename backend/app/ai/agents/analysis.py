import os
import json
from google import genai
from google.genai import types
from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata

DEFAULT_MODELS = [m.value["model"] for m in ModelPricing]

def get_dynamic_persona(position: str) -> str:
    pos = (position or "").lower()
    
    if any(keyword in pos for keyword in [
        "engineer", "developer", "architect", "programmer", "devops", 
        "sysadmin", "qa", "tester", "data scientist", "tech"
    ]) or ("analyst" in pos and ("data" in pos or "system" in pos)):
        return "Act as a skeptical FAANG Engineering Manager. Be brutally honest, data-driven, and penalize YOE gaps heavily. Focus on technical stack depth, architectural complexity, system scale (e.g., latency, user counts), and coding proficiency. Use third-person, gender-neutral language only."
    
    if any(keyword in pos for keyword in [
        "product", "project", "scrum", "agile", "designer", "ux", "ui"
    ]):
        return "Act as a seasoned Product Leader or Design Director. Be highly critical of user empathy, product-market fit, delivery metrics, strategic roadmap ownership, and cross-functional leadership. Use third-person, gender-neutral language only."
        
    if any(keyword in pos for keyword in [
        "sales", "marketing", "growth", "seo", "revenue", 
        "business development", "finance", "account"
    ]):
        return "Act as a demanding Chief Revenue Officer or VP of Growth. Focus strictly on commercial outcomes, business metrics, and customer acquisition strategies. Use third-person, gender-neutral language only."
        
    if any(keyword in pos for keyword in [
        "writer", "content", "creative", "copywriter", "art", "video"
    ]):
        return "Act as an elite Creative Director. Focus on content strategy, storytelling strength, campaign effectiveness, brand alignment, and the narrative depth of past portfolios. Use third-person, gender-neutral language only."
        
    return "Act as a highly rigorous Head of Talent Acquisition or Recruitment Director. Focus strictly on core job alignment, clear ownership evidence, career progression, outcome-oriented metrics, and general business impact. Use third-person, gender-neutral language only."

def get_persona_label(position: str) -> str:
    pos = (position or "").lower()
    if any(k in pos for k in ["engineer", "developer", "architect", "programmer", "devops", "sysadmin", "qa", "tester", "data scientist", "tech"]) or ("analyst" in pos and ("data" in pos or "system" in pos)):
        return "FAANG Engineering Manager"
    if any(k in pos for k in ["product", "project", "scrum", "agile", "designer", "ux", "ui"]):
        return "Product Leader / Design Director"
    if any(k in pos for k in ["sales", "marketing", "growth", "seo", "revenue", "business development", "finance", "account"]):
        return "Chief Revenue Officer"
    if any(k in pos for k in ["writer", "content", "creative", "copywriter", "art", "video"]):
        return "Creative Director"
    return "Head of Talent Acquisition"

def build_analysis_prompt(
    company_name: str,
    position: str,
    context: str,
    jd: str,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    mode: str = "analyze",
    user_name: Optional[str] = None,
    intel: Optional[Dict[str, Any]] = None
) -> str:
    persona = get_dynamic_persona(position)
    is_latex = "\\documentclass" in (context or "") or "\\begin{document}" in (context or "")
    
    intel_section = ""
    if intel:
        intel_section = f"""
COMPANY TECHNICAL & CULTURAL INTELLIGENCE:
- Tech Stack: {json.dumps(intel.get('tech_stack', []))}
- Culture: {intel.get('values_culture', '')}
- Recent News: {intel.get('engineering_blog_summary', '')}
"""
    
    prompt = f"""
You are a dual-mode AI Career Expert.

1. **PERSPECTIVE**: {persona}

---

ROLE CONTEXT:
- Company: {company_name}
- Position: {position}
{f"- Location: {location}" if location else ""}
{f"- Job Type: {job_type}" if job_type else ""}
{f"- Candidate Name: {user_name}" if user_name else ""}
{intel_section}

CANDIDATE RESUME:
{context}

JOB DESCRIPTION:
{jd}
"""
    if mode == "analyze":
        prompt += """
OUTPUT MODE: ANALYSIS REPORT
Evaluate the candidate not just on keyword matches, but on IMPACT, SCALE, and HARD REQUIREMENTS. 

SCORING CRITERIA (MANDATORY):
1. **Years of Experience (YOE)**: This is a HARD filter. If the JD requires 5 years and the candidate has 1, you MUST penalize the score by at least 40 points. If they are a fresher (0 years) for a mid-senior role, the verdict MUST be 'REJECT'.
2. **Technical Depth**: Distinguish between "heard of" and "delivered with".
3. **Scale**: A candidate who "built a feature" is weaker than one who "reduced API latency by 40% for 2M users." Look for evidence of ownership, complexity, and business outcomes.

VERDICT DEFINITIONS:
- **APPLY (80-100)**: Candidate meets or exceeds all mandatory requirements and core tech stack.
- **STRETCH (55-79)**: Candidate is missing 1-2 years of YOE or a secondary skill, but has the core engine to perform.
- **REJECT (0-54)**: Candidate is fundamentally unqualified (missing core YOE, missing mandatory tech stack, or lacking relevant impact).

You MUST produce the report in two distinct phases (but do NOT include "PHASE 1" or "PHASE 2" headers in your output):

### Strategic Alignment
In 2-3 sharp sentences, synthesize how this candidate's specific past achievements — their scale, complexity, and stack — directly address the company's current pain points as described in the JD. Be specific. Name actual projects or metrics from the resume.

### Match Score Breakdown
Provide a quantitative and qualitative breakdown. Compare Required vs. Actual for:
1. Technical Stack depth — do they have the exact tools, or adjacent ones?
2. Domain knowledge — have they worked in a similar industry or problem space?
3. Ownership evidence — did they lead, or just contribute?

### Strategic Bridge
Tailor this section to the candidate's seniority tier (Entry 0-2y, Mid 3-5y, Senior 6y+):
1. **Entry**: Focus on "Execution Proof" (Daily Git activity, public projects, DSA consistency). Advice on standing out in high-volume pools.
2. **Mid**: Focus on "Domain Deep-Dive" (Performance tuning, advanced testing, mastering adjacent stack components). Advice on peer networking.
3. **Senior**: Focus on "Architecture & Impact" (Design docs, system scalability, leadership impact). Advice on peer-to-peer outreach to Engineering Managers or VPs.

### Learning Roadmap
Identify the top 3 high-leverage technical actions to bridge the immediate skill gaps. Present them as a numbered list with bold titles and concise descriptions.

FORBIDDEN IN PHASE 1: Do NOT include Salary, Red Flags, Culture Fit, or Interview Questions here. Do NOT write any curly braces or raw JSON strings. These belong ONLY in Phase 2.
LANGUAGE RULE: Use ONLY gender-neutral, third-person language (they/them, the candidate).

---

### PHASE 2: THE DATA PAYLOAD (JSON)
Output the following JSON block EXACTLY as shown. The JSON block MUST be the absolute end of your response. NEVER output any text or notes after the ===JSON_END=== tag.

===JSON_START===
{
  "match_score": <integer 0-100>,
  "verdict": "<APPLY|STRETCH|REJECT>",
  "ats_score": <integer 0-100>,
  "keyword_density": <integer 0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "red_flags": ["flag1"],
  "interview_questions": {
    "preparation_focus": "<One high-level strategy for this specific role>",
    "questions": [{ "q": "<question>", "intent": "<why they ask this>" }]
  },
  "culture_fit_score": <integer 0-100>
}
===JSON_END===
"""
    elif mode == "customize":
        if is_latex:
            prompt += """
OUTPUT MODE: CUSTOMIZED RESUME (LATEX DOCUMENT)
Your goal is to completely rewrite the candidate's LaTeX resume so that it perfectly aligns with the job description while remaining entirely truthful.

CRITICAL INSTRUCTIONS FOR LATEX MODE:
1. You MUST output the ENTIRE, COMPLETE LaTeX document starting with '\\documentclass' and ending with '\\end{document}'.
2. You MUST preserve all of the original preamble, styling, imported packages, custom defined environments, layout settings, geometry margins, and formatting macros EXACTLY as they are in the original LaTeX resume.
3. You MUST keep the header section (the candidate's name, email, phone, links, and contact info) completely intact and unchanged.
4. Only rewrite the content inside the sections (such as PROFESSIONAL SUMMARY, TECHNICAL SKILLS, PROJECTS/EXPERIENCE) to surgically align them with the job description.
5. For all projects/experiences, enhance the impact of the bullet points using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]) and naturally inject relevant keywords from the job description ONLY IF the candidate already has experience with them.
6. STRICT SKILLS INTEGRITY: You are STRICTLY FORBIDDEN from adding any technical skills, tools, programming languages, or software to the resume that are not explicitly present in the candidate's original resume. Do NOT hallucinate or copy-paste skills from the JD if the candidate doesn't have them. Focus on re-ordering and emphasizing existing skills based on the JD's requirements.
7. DO NOT include ANY commentary, explanation, introductory remarks, perspective analysis, markdown headings, or assessment text outside of the LaTeX document. The output must be 100% valid, compile-ready LaTeX code.
8. Return ONLY the complete LaTeX document.
"""
        else:
            prompt += """
OUTPUT MODE: CUSTOMIZED RESUME (PLAIN TEXT)
Your goal is to completely rewrite the candidate's resume content so that it perfectly aligns with the job description while remaining entirely truthful.

CRITICAL INSTRUCTIONS FOR PLAIN TEXT MODE:
1. Output the ENTIRE rewritten resume.
2. Focus heavily on optimizing the Summary and Experience sections.
3. Retain the original layout and format style exactly (keep it as standard plain text resume layout).
4. For all projects/experiences, enhance the impact of the bullet points using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]) and naturally inject relevant keywords from the job description ONLY IF the candidate already has experience with them.
5. STRICT SKILLS INTEGRITY: You are STRICTLY FORBIDDEN from adding any technical skills, tools, programming languages, or software to the resume that are not explicitly present in the candidate's original resume. Do NOT hallucinate or copy-paste skills from the JD if the candidate doesn't have them. Focus on re-ordering and emphasizing existing skills based on the JD's requirements.
6. DO NOT include ANY commentary, explanation, introductory remarks, perspective analysis, or markdown headers outside of the resume. The output must start directly with the resume text.
7. Do NOT hallucinate experiences that the candidate does not have. Only reframe and emphasize their existing experience.
"""
    return prompt

async def run_analysis_agent(
    company_name: str,
    position: str,
    context: str,
    jd: str,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    mode: str = "analyze",
    user_name: Optional[str] = None,
    intel: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    prompt = build_analysis_prompt(
        company_name, position, context, jd, location, job_type, mode, user_name, intel
    )
    
    last_error = None
    for model_name in DEFAULT_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction="You are an elite career strategist and ATS optimization expert. Maintain strict boundaries for JSON output."
                )
            )
            text = response.text
            
            usage = extract_usage_metadata(response)
            cost = calculate_cost(usage["promptTokenCount"], usage["candidatesTokenCount"], model_name)
            
            markdown = text
            data = {}
            
            json_start_marker = "===JSON_START==="
            json_end_marker = "===JSON_END==="
            
            if json_start_marker in text and json_end_marker in text:
                start_idx = text.find(json_start_marker)
                end_idx = text.find(json_end_marker)
                
                markdown = text[:start_idx].strip()
                json_str = text[start_idx + len(json_start_marker):end_idx].strip()
                
                if json_str.startswith("```json"):
                    json_str = json_str[7:]
                if json_str.startswith("```"):
                    json_str = json_str[3:]
                if json_str.endswith("```"):
                    json_str = json_str[:-3]
                    
                try:
                    data = json.loads(json_str.strip())
                except json.JSONDecodeError:
                    pass
                    
            return {
                "markdown": markdown,
                "data": data,
                "personaLabel": get_persona_label(position),
                "toolUsed": model_name,
                "usage": usage,
                "estimated_cost": cost
            }
        except Exception as e:
            last_error = e
            print(f"[AGENT_AI] Fallback attempt on {model_name} failed: {e}")
            continue
            
    raise HTTPException(status_code=500, detail=f"All generative models failed. Last error: {str(last_error)}")
