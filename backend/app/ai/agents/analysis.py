import os
import json
from google import genai
from google.genai import types
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import HTTPException


class WorkExperienceItem(BaseModel):
    company: str = Field(description="Name of the company/employer")
    role: str = Field(description="Official job title")
    location: Optional[str] = Field(None, description="Location, e.g., 'San Francisco, CA'")
    date_range: str = Field(description="Employment duration, e.g., 'June 2021 - Present'")
    highlights: List[str] = Field(
        description="3-5 customized, high-impact bullet points using the STAR/XYZ formula (Accomplished [X], measured by [Y], by doing [Z]). Align achievements to the target JD using only existing experience."
    )

class ProjectItem(BaseModel):
    name: str = Field(description="Name of the project")
    technologies: List[str] = Field(description="Key tools, frameworks, and languages used")
    highlights: List[str] = Field(description="1-3 bullet points describing project impact using the XYZ formula")

class EducationItem(BaseModel):
    institution: str = Field(description="University or school name")
    degree: str = Field(description="Degree and major, e.g., 'B.S. in Computer Science'")
    location: Optional[str] = Field(None, description="Location of the school")
    date_range: str = Field(description="Graduation date, e.g., 'May 2023'")
    details: Optional[str] = Field(None, description="GPA, honors, or thesis if notable")

class ContactInfoSchema(BaseModel):
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL, e.g. linkedin.com/in/username")
    github: Optional[str] = Field(None, description="GitHub profile URL, e.g. github.com/username")
    portfolio: Optional[str] = Field(None, description="Portfolio website URL")

class SkillCategory(BaseModel):
    category: str = Field(description="Category name, e.g. 'Languages', 'Frameworks', 'Databases', 'Tools'")
    skills: List[str] = Field(description="List of skills in this category")

class CustomizedResumeSchema(BaseModel):
    name: str = Field(description="Full name of the candidate")
    contact_info: ContactInfoSchema = Field(description="Contact fields")
    summary: str = Field(description="A powerful 3-4 sentence professional summary customized to the role")
    skills: List[SkillCategory] = Field(description="Categorized technical skills")
    experience: List[WorkExperienceItem] = Field(description="Work experience items customized to the target JD")
    projects: List[ProjectItem] = Field(description="Technical projects customized to the target JD")
    education: List[EducationItem] = Field(description="Education history")
import re
from jinja2 import Environment, FileSystemLoader
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata

DEFAULT_MODELS = [m.value["model"] for m in ModelPricing]

def escape_latex(text: str) -> str:
    """Escapes special LaTeX characters in a string."""
    if not isinstance(text, str):
        return text

    latex_special_chars = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
        '\\': r'\textbackslash{}',
    }

    regex = re.compile('|'.join(re.escape(str(key)) for key in sorted(latex_special_chars.keys(), key=len, reverse=True)))
    return regex.sub(lambda match: latex_special_chars[match.group()], text)

def escape_json_data(data: Any) -> Any:
    """Recursively escapes all string values in a JSON-like dictionary/list."""
    if isinstance(data, dict):
        return {key: escape_json_data(val) for key, val in data.items()}
    elif isinstance(data, list):
        return [escape_json_data(item) for item in data]
    elif isinstance(data, str):
        return escape_latex(data)
    return data

def render_latex_resume(resume_data: dict) -> str:
    """Configures Jinja2 with custom delimiters and renders the resume template."""
    safe_data = escape_json_data(resume_data)
    
    # Format the contact info list in Python for cleaner LaTeX rendering
    contact_list = []
    if "contact_info" in safe_data and isinstance(safe_data["contact_info"], dict):
        info = safe_data["contact_info"]
        if info.get("email"):
            contact_list.append(rf"\href{{mailto:{info['email']}}}{{\texttt{{{info['email']}}}}}")
        if info.get("phone"):
            contact_list.append(info["phone"])
        if info.get("linkedin"):
            contact_list.append(rf"\href{{https://{info['linkedin']}}}{{\texttt{{{info['linkedin']}}}}}")
        if info.get("github"):
            contact_list.append(rf"\href{{https://{info['github']}}}{{\texttt{{{info['github']}}}}}")
        if info.get("portfolio"):
            contact_list.append(rf"\href{{https://{info['portfolio']}}}{{\texttt{{{info['portfolio']}}}}}")
    
    safe_data["contact_list"] = contact_list
    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    templates_dir = os.path.join(base_dir, "templates")
    if not os.path.exists(templates_dir):
        templates_dir = "templates"
        
    env = Environment(
        loader=FileSystemLoader(templates_dir),
        block_start_string="((*",
        block_end_string="*))",
        variable_start_string="(([",
        variable_end_string="]))",
        comment_start_string="((=",
        comment_end_string="=))"
    )
    
    template = env.get_template("resume_template.tex")
    return template.render(**safe_data)

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
    intel: Optional[Dict[str, Any]] = None,
    execution_plan: Optional[Dict[str, Any]] = None
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
        plan_text = json.dumps(execution_plan, indent=2) if execution_plan else "No execution plan provided. Infer the best strategy."
        prompt += f"""
OUTPUT MODE: RAW LATEX
Your goal is to act as the Writer Agent and completely rewrite the candidate's resume content to perfectly align with the job description.

STRATEGIST EXECUTION PLAN:
{plan_text}

CRITICAL INSTRUCTIONS:
1. You MUST output RAW LaTeX code only. Do not wrap in markdown code blocks.
2. STRICTLY follow the instructions in the STRATEGIST EXECUTION PLAN.
3. For all experiences and projects, enhance the impact of the bullet points using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).
4. STRICT SKILLS INTEGRITY: You are STRICTLY FORBIDDEN from adding any technical skills, tools, programming languages, or software to the resume that are not explicitly present in the candidate's original resume. Do NOT hallucinate. Focus on re-ordering and emphasizing existing skills based on the JD.
5. Do NOT hallucinate experiences that the candidate does not have. Only reframe and emphasize their existing experience.
6. STRICT TEMPLATE PRESERVATION: You MUST preserve the EXACT LaTeX layout of the original resume. This means:
   - DO NOT remove or alter ANY `\vspace` commands.
   - DO NOT remove or alter ANY `\href` links (e.g., GitHub URLs).
   - DO NOT remove the empty blank lines between sections or items.
   - DO NOT change how the Skills section is formatted (keep the exact spacing and newlines).
   - ONLY change the actual English text inside the bullet points, the professional summary, and the skill lists. Leave all surrounding LaTeX syntax and spacing exactly as it was.
7. 🛑 MATHEMATICAL LENGTH HEURISTIC: To ensure the LaTeX compiles to exactly one full page, the final output MUST contain exactly 12 project bullet points in total. Distribute these 12 bullets across the projects based on the Execution Plan (e.g., 4 projects with 3 bullets each, or 3 projects with 4 bullets each), but the grand total of project bullet points MUST equal exactly 12.
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
    intel: Optional[Dict[str, Any]] = None,
    execution_plan: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    style_guide_text = ""
    if mode == "customize":
        try:
            supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

            if not supabase_url or not supabase_key:
                from dotenv import load_dotenv
                for path in ["../frontend/.env.local", "frontend/.env.local"]:
                    if os.path.exists(path):
                        load_dotenv(path)
                        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
                        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
                        if supabase_url and supabase_key:
                            break
            
            if supabase_url and supabase_key:
                target_skills = []
                if execution_plan and "missing_skills" in execution_plan:
                    target_skills = execution_plan["missing_skills"]

                search_text = ", ".join(target_skills) if target_skills else jd
                embedding_payload_text = f"Role: {position}. Target Skills: {search_text}"

                embed_resp = client.models.embed_content(
                    model="gemini-embedding-2",
                    contents=embedding_payload_text,
                    config=types.EmbedContentConfig(
                        output_dimensionality=768
                    )
                )
                query_vector = embed_resp.embeddings[0].values

                import httpx
                headers = {
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "query_embedding": query_vector,
                    "match_threshold": 0.65,
                    "match_count": 5
                }
                async with httpx.AsyncClient() as http_client:
                    res = await http_client.post(
                        f"{supabase_url}/rest/v1/rpc/match_synthetic_bullets",
                        json=payload,
                        headers=headers,
                        timeout=10.0
                    )
                    if res.status_code == 200:
                        data_list = res.json()
                        if data_list:
                            bullets_list = [row["bullet_point"] for row in data_list]
                            style_guide_text = "\n".join(f"- {b}" for b in bullets_list)
                            print(f"[RAG_SUCCESS] Successfully matched {len(bullets_list)} style-guide bullets from Supabase for '{position}':")
                            for idx, b in enumerate(bullets_list, 1):
                                print(f"  {idx}. {b}")
                        else:
                            print(f"[RAG_INFO] No matching bullets found in DB (threshold: 0.3) for '{position}'.")
                    else:
                        print(f"[RAG_ERROR] Supabase REST API returned {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[RAG_ERROR] Vector similarity retrieval failed: {e}")

    prompt = build_analysis_prompt(
        company_name, position, context, jd, location, job_type, mode, user_name, intel, execution_plan
    )
    
    if mode == "customize" and style_guide_text:
        prompt += f"\n=== STYLE GUIDE / FEW-SHOT EXAMPLES ===\nUse the exact tone, quantification depth, and structure of these successful action bullets to rewrite the candidate's achievements. DO NOT copy the bullets literally or fabricate experiences:\n{style_guide_text}\n======================================\n"
    
    last_error = None
    for model_name in DEFAULT_MODELS:
        try:
            if mode == "customize":
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction="You are a professional resume architect. Output raw LaTeX matching the execution plan exactly.",
                        response_mime_type="text/plain",
                    )
                )
                text = response.text
                usage = extract_usage_metadata(response)
                cost = calculate_cost(usage["promptTokenCount"], usage["candidatesTokenCount"], model_name)

                clean_text = text.strip()
                if clean_text.startswith("```latex"):
                    clean_text = clean_text[8:]
                elif clean_text.startswith("```"):
                    clean_text = clean_text[3:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                clean_text = clean_text.strip()
                
                rendered_latex = clean_text
                data = {}
                
                return {
                    "markdown": rendered_latex,
                    "data": data,
                    "personaLabel": get_persona_label(position),
                    "toolUsed": model_name,
                    "usage": usage,
                    "estimated_cost": cost
                }
            else:
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
