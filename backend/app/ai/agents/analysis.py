import os
import json
import httpx
import re
import asyncio
from google import genai
from google.genai import types
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import HTTPException
from jinja2 import Environment, FileSystemLoader
from app.core.constants import ModelPricing
from app.core.utils import calculate_cost, extract_usage_metadata
from app.ai.agents.extractor import run_resume_extractor
from app.ai.agents.intents import run_jd_intent_extractor
from app.ai.agents.scorer import run_project_scorer
from app.ai.agents.writer import run_resume_writer
from app.ai.agents.validator import run_resume_validator

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

DEFAULT_MODELS = [m.value["model"] for m in ModelPricing]

def escape_latex(text: str) -> str:
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
    if isinstance(data, dict):
        return {key: escape_json_data(val) for key, val in data.items()}
    elif isinstance(data, list):
        return [escape_json_data(item) for item in data]
    elif isinstance(data, str):
        return escape_latex(data)
    return data

def render_latex_section(section_name: str, data: dict) -> str:
    env = Environment(
        block_start_string="((*",
        block_end_string="*))",
        variable_start_string="(([",
        variable_end_string="]))"
    )
    
    if section_name == "skills":
        tmpl = env.from_string(
            "\\begin{itemize}[leftmargin=0.5em, label={}, noitemsep, topsep=2pt]\n"
            "    ((* for skill_cat in skills *))\n"
            "    \\item \\textbf{(([ skill_cat.category ])):} ((* for skill in skill_cat.skills *))(([ skill ]))((* if not loop.last *)), ((* endif *))((* endfor *))\n"
            "    ((* endfor *))\n"
            "\\end{itemize}"
        )
    elif section_name == "experience":
        tmpl = env.from_string(
            "((* for exp in experience *))\n"
            "\\textbf{(([ exp.role ]))} \\hfill (([ exp.date_range ])) \\\\\n"
            "\\textit{(([ exp.company ])) ((* if exp.location *)) -- (([ exp.location ]))((* endif *))}\n"
            "\\begin{itemize}[noitemsep,topsep=2pt,leftmargin=1.5em]\n"
            "    ((* for bullet in exp.highlights *))\n"
            "    \\item (([ bullet ]))\n"
            "    ((* endfor *))\n"
            "\\end{itemize}\n"
            "\\vspace{5pt}\n"
            "((* endfor *))"
        )
    elif section_name == "projects":
        tmpl = env.from_string(
            "((* for proj in projects *))\n"
            "\\textbf{(([ proj.name ]))} \\hfill \\textit{((* for tech in proj.technologies *))(([ tech ]))((* if not loop.last *)), ((* endif *))((* endfor *))}\n"
            "\\begin{itemize}[noitemsep,topsep=2pt,leftmargin=1.5em]\n"
            "    ((* for bullet in proj.highlights *))\n"
            "    \\item (([ bullet ]))\n"
            "    ((* endfor *))\n"
            "\\end{itemize}\n"
            "\\vspace{5pt}\n"
            "((* endfor *))"
        )
    elif section_name == "summary":
        tmpl = env.from_string("(([ summary ]))")
    else:
        return ""
        
    safe_data = escape_json_data(data)
    return tmpl.render(**safe_data)

def replace_comment_block(latex_content: str, block_name: str, new_content: str) -> Optional[str]:
    pattern_str = r"(%\s*(?:\[" + block_name + r"\]|BEGIN\s+" + block_name + r").*?\n)(.*?)(%\s*(?:\[/" + block_name + r"\]|END\s+" + block_name + r"))"
    pattern = re.compile(pattern_str, re.IGNORECASE | re.DOTALL)
    if pattern.search(latex_content):
        return pattern.sub(rf"\1{new_content}\n\3", latex_content, count=1)
    return None

def replace_section_by_header(latex_content: str, keywords: list, new_content: str) -> Optional[str]:
    pattern_str = r"(\\section\*?\{[^{}]*(?:" + "|".join(keywords) + r")[^{}]*\})(.*?)(?=(?:\\section\*?\{|\\end\{document\}))"
    pattern = re.compile(pattern_str, re.IGNORECASE | re.DOTALL)
    
    match = pattern.search(latex_content)
    if match:
        start_idx = match.start(2)
        end_idx = match.end(2)
        return latex_content[:start_idx] + f"\n{new_content}\n" + latex_content[end_idx:]
    return None

def escape_for_latex_matching(text: str) -> str:
    escaped = re.escape(text)
    return re.sub(r'\\([&%$#_{}~^\\])', r'\\?\1', escaped)

def merge_customized_sections_into_latex(original_latex: str, customized_resume: dict) -> str:
    result = original_latex
    
    rendered_skills = render_latex_section("skills", {"skills": customized_resume.get("skills", [])})
    
    skills_replaced = replace_comment_block(result, "SKILLS", rendered_skills) or replace_comment_block(result, "TECHNICAL SKILLS", rendered_skills)
    if skills_replaced:
        result = skills_replaced
    else:
        skills_header_replaced = replace_section_by_header(result, ["skills", "technical skills"], rendered_skills)
        if skills_header_replaced:
            result = skills_header_replaced

    for exp in customized_resume.get("experience", []):
        company = exp.get("company", "")
        safe_company = escape_for_latex_matching(company)
        pattern = re.compile(r'(\\textbf\{.*?' + safe_company + r'.*?\}|\\textit\{.*?' + safe_company + r'.*?\}|' + safe_company + r')', re.IGNORECASE)
        match = pattern.search(result)
        if match:
            start_pos = match.end()
            item_pos = result.find(r"\item", start_pos)
            if item_pos != -1 and item_pos - start_pos < 600:
                begin_idx = result.rfind(r"\begin{", start_pos, item_pos)
                if begin_idx != -1:
                    env_match = re.match(r'\\begin\{([a-zA-Z0-9\*]+)\}', result[begin_idx:])
                    if env_match:
                        env_name = env_match.group(1)
                        content_start = begin_idx + len(env_match.group(0))
                        itemize_end = result.find(rf"\end{{{env_name}}}", item_pos)
                        if itemize_end != -1:
                            item_match = re.search(r'(\\[a-zA-Z0-9\*]+(?:\s*\[.*?\])?)', result[content_start:itemize_end])
                            item_cmd = item_match.group(1) if item_match else "\\item"
                            
                            new_bullets_str = "\n"
                            for b in exp.get("highlights", []):
                                new_bullets_str += f"    {item_cmd} {b}\n"
                            result = result[:content_start] + new_bullets_str + result[itemize_end:]

    for proj in customized_resume.get("projects", []):
        name = proj.get("name", "")
        safe_name = escape_for_latex_matching(name)
        pattern = re.compile(r'(\\textbf\{.*?' + safe_name + r'.*?\}|' + safe_name + r')', re.IGNORECASE)
        match = pattern.search(result)
        if match:
            start_pos = match.end()
            textit_start = result.find(r"\textit{", start_pos)
            
            item_pos = result.find(r"\item", start_pos)
            itemize_start = -1
            env_name = None
            content_start = -1
            itemize_end = -1
            if item_pos != -1 and item_pos - start_pos < 600:
                begin_idx = result.rfind(r"\begin{", start_pos, item_pos)
                if begin_idx != -1:
                    env_match = re.match(r'\\begin\{([a-zA-Z0-9\*]+)\}', result[begin_idx:])
                    if env_match:
                        env_name = env_match.group(1)
                        itemize_start = begin_idx
                        content_start = begin_idx + len(env_match.group(0))
                        itemize_end = result.find(rf"\end{{{env_name}}}", item_pos)

            if textit_start != -1 and (itemize_start == -1 or textit_start < itemize_start):
                brace_count = 1
                pos = textit_start + len(r"\textit{")
                while brace_count > 0 and pos < len(result):
                    if result[pos] == "{":
                        brace_count += 1
                    elif result[pos] == "}":
                        brace_count -= 1
                    pos += 1
                if brace_count == 0:
                    new_tech_str = ", ".join(proj.get("technologies", []))
                    result = result[:textit_start] + "\\textit{" + new_tech_str + "}" + result[pos:]
                    
                    item_pos = result.find(r"\item", start_pos)
                    itemize_start = -1
                    env_name = None
                    content_start = -1
                    itemize_end = -1
                    if item_pos != -1 and item_pos - start_pos < 600:
                        begin_idx = result.rfind(r"\begin{", start_pos, item_pos)
                        if begin_idx != -1:
                            env_match = re.match(r'\\begin\{([a-zA-Z0-9\*]+)\}', result[begin_idx:])
                            if env_match:
                                env_name = env_match.group(1)
                                itemize_start = begin_idx
                                content_start = begin_idx + len(env_match.group(0))
                                itemize_end = result.find(rf"\end{{{env_name}}}", item_pos)

            if itemize_start != -1 and itemize_end != -1 and content_start != -1:
                item_match = re.search(r'(\\[a-zA-Z0-9\*]+(?:\s*\[.*?\])?)', result[content_start:itemize_end])
                item_cmd = item_match.group(1) if item_match else "\\item"
                
                new_bullets_str = "\n"
                for b in proj.get("highlights", []):
                    new_bullets_str += f"    {item_cmd} {b}\n"
                result = result[:content_start] + new_bullets_str + result[itemize_end:]

    if customized_resume.get("summary"):
        rendered_summary = escape_latex(customized_resume.get("summary", ""))
        summary_replaced = replace_comment_block(result, "SUMMARY", rendered_summary) or replace_comment_block(result, "PROFESSIONAL SUMMARY", rendered_summary)
        if summary_replaced:
            result = summary_replaced
        else:
            summary_header_replaced = replace_section_by_header(result, ["summary", "professional summary"], rendered_summary)
            if summary_header_replaced:
                result = summary_header_replaced

    return result

def render_latex_resume(resume_data: dict) -> str:
    safe_data = escape_json_data(resume_data)
    
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
    execution_plan: Optional[Dict[str, Any]] = None,
    jd_pillars: Optional[Dict[str, Any]] = None
) -> str:
    persona = get_dynamic_persona(position)
    
    intel_section = ""
    if intel:
        intel_section = f"""
COMPANY TECHNICAL & CULTURAL INTELLIGENCE:
- Tech Stack: {json.dumps(intel.get('tech_stack', []))}
- Culture: {intel.get('values_culture', '')}
- Recent News: {intel.get('engineering_blog_summary', '')}
"""
    
    jd_section = f"JOB DESCRIPTION:\n{jd}"
    if jd_pillars:
        tech_list = jd_pillars.get('techStack', []) or []
        impact_list = jd_pillars.get('coreImpact', []) or []
        req_list = jd_pillars.get('mandatoryRequirements', []) or []
        jd_section = f"""JOB DESCRIPTION CORE REQUIREMENTS (PILLARS):
- Tech Stack: {', '.join(tech_list) if isinstance(tech_list, list) else tech_list}
- Seniority: {jd_pillars.get('seniority', 'Unknown')}
- Core Impact Area / Responsibilities: {', '.join(impact_list) if isinstance(impact_list, list) else impact_list}
- Mandatory Requirements: {', '.join(req_list) if isinstance(req_list, list) else req_list}
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

{jd_section}
"""
    if mode == "analyze":
        prompt += """
OUTPUT MODE: ANALYSIS REPORT
Evaluate the candidate not just on keyword matches, but on IMPACT, SCALE, and HARD REQUIREMENTS. 

SCORING CRITERIA (MANDATORY — apply in order):
1. **Years of Experience (YOE) — Hard Gate**: This is the first filter. If the JD requires N years and the candidate has fewer than (N - 2) years, you MUST penalize the score by at least 40 points and the verdict MUST be 'REJECT' or 'STRETCH'. If they are a fresher (0 years of post-graduation work) for a mid-senior role, the verdict MUST be 'REJECT'.
2. **Tech Ecosystem vs. Exact Match (Critical Distinction)**:
   - If the JD mandates a SPECIFIC framework (e.g., Angular, Go, Swift, Django) and the candidate ONLY has a DIFFERENT framework in the same category (e.g., only React, only Node.js, only FastAPI), treat this as a HARD MISMATCH on that axis.
   - For Senior roles: A hard mismatch on a mandatory primary technology is a REJECT factor.
   - For Mid roles: A hard mismatch on a mandatory primary technology caps the verdict at STRETCH.
   - EXCEPTION: Semantically equivalent technologies (e.g., React ≈ React Native, Next.js ≈ React, PostgreSQL ≈ MySQL) are NOT mismatches. Apply engineering judgment.
3. **Seniority & System Design (Weighted Heavier Than Buzzwords)**: For Senior+ roles, weight evidence of architectural ownership, scale (user counts, latency metrics, system complexity), and team leadership 2x higher than framework keyword matches. A candidate who built and owns a production system at scale outscores a keyword-stuffed resume.
4. **Technical Depth**: Distinguish between "heard of" and "delivered with". Look for quantifiable outcomes (latency %, user scale, uptime SLAs).
5. **Generalist Bonus**: A strong full-stack candidate with proven delivery across multiple JD-relevant areas should NOT be penalized for missing one niche secondary tool. Score their aggregate delivery, not individual checkbox compliance.
6. **Monetization / Course Platform Fraud Check**: Analyze if the company is actually a course selling platform, unpaid training funnel, or pay-for-experience program rather than a real software engineering role. If there are signs (e.g. course selling, whatsapp-only onboarding, "open collaboration" bootcamps requiring payment/enrolling), you MUST flag this under the `red_flags` JSON property (e.g., "monetized internship funnel / course-selling platform") and write a clear warning in the candidate report.

VERDICT DEFINITIONS:
- **APPLY (80-100)**: Candidate meets or exceeds ALL mandatory requirements and core tech stack. Minor gaps in secondary skills only.
- **STRETCH (55-79)**: Candidate is missing 1-2 years of YOE OR one secondary tech gap, but has the core competency and delivery track record to succeed with reasonable ramp-up.
- **REJECT (0-54)**: Candidate is fundamentally unqualified — missing core YOE by 3+ years, missing mandatory primary tech with no adjacent equivalent, OR lacking any evidence of relevant impact.

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
  }
}
===JSON_END===
"""
    elif mode == "customize":
        plan_text = json.dumps(execution_plan, indent=2) if execution_plan else "No execution plan provided. Infer the best strategy."
        prompt += f"""
OUTPUT MODE: RAW LATEX
Your goal is to act as the Writer Agent and rewrite the candidate's resume content to perfectly align with the job description — WITHOUT fabricating new experience.

STRATEGIST EXECUTION PLAN:
{plan_text}

CRITICAL INSTRUCTIONS:
1. You MUST output RAW LaTeX code only. Do not wrap in markdown code blocks.
2. STRICTLY follow the instructions in the STRATEGIST EXECUTION PLAN.
3. XYZ FORMULA RELAXATION: If a metric exists in the original bullet, preserve it. If a metric does NOT exist, do NOT invent or hallucinate numbers. Instead, focus on architecture, ownership, and technical complexity.
4. SKILL EVIDENCE RULE: A skill can only appear if it is present in the original resume OR directly inferable from project code (e.g., if a project uses FastAPI, the skill can contain FastAPI). Do NOT hallucinate skills that aren't evidenced.
5. Do NOT hallucinate experiences that the candidate does not have. Only reframe and emphasize their existing experience.
6. STRICT TEMPLATE PRESERVATION: You MUST preserve the EXACT LaTeX layout of the original resume. This means:
   - DO NOT remove or alter ANY `\vspace` commands.
   - DO NOT remove or alter ANY `\href` links (e.g., GitHub URLs).
   - DO NOT remove the empty blank lines between sections or items.
   - DO NOT change how the Skills section is formatted (keep the exact spacing and newlines).
   - ONLY change the actual English text inside the bullet points, the professional summary, and the skill lists. Leave all surrounding LaTeX syntax and spacing exactly as it was.
7. LENGTH HEURISTIC: Maintain a one-page constraint. Prefer 2-4 bullets per project. Do not add bullets solely to satisfy count requirements.
8. STRICT KEYWORD PRESERVATION — CRITICAL: Before finalizing any bullet point, cross-reference the original resume against the JD. If a word or phrase already exists in the original resume AND is also a keyword in the JD (e.g., "stakeholders", "offline-first", "optimistic updates", "Socket.io", "Docker"), you MUST include that exact word or phrase in the rewritten bullet point. You are FORBIDDEN from paraphrasing or deleting JD-matching keywords that already exist in the original resume. Losing an existing matched keyword is a critical failure.
9. SUMMARY POLICY: Remove the Objective section by default. Only create a Summary if explicitly requested. If created, it must be maximum 2 lines, evidence-based, and contain no generic career statements.
10. NO BULLETS UNDER CONTACT HEADER: Under NO circumstances should any bullet points (`\\begin{{highlights}}`, `\\item`, etc.) or list items be added inside or directly below the contact information header (the email, phone, links section) or within the OBJECTIVE/SUMMARY section. The OBJECTIVE/SUMMARY section must remain a single, clean paragraph inside a `\\begin{{onecolentry}} ... \\end{{onecolentry}}` block, without any lists, bullets, or itemizations.
11. PROJECT PRIORITIZATION & SKILLS REORDERING: Rank and reorder projects by JD relevance (e.g., place strongest AI project first for an AI JD). Also reorganize skill categories and individual skills inside each category, placing the skills most relevant/requested by the target job description at the beginning of the list.
12. STRONG VERBS MATCHING COMPLEXITY: Rewrite experience and project highlights using a professional tone. The verb MUST match the actual project complexity. For a CRUD app use: Built, Developed, Implemented. For Medium complexity use: Designed, Engineered. For Large scale use: Architected, Scaled. Avoid inflation where not warranted.
13. TECHNOLOGY MAPPING: Allowed mapping: generalize upward (e.g., Gemini API -> LLM Integration, Semantic Search -> Retrieval). FORBIDDEN: Lateral replacement (e.g., React -> Angular, FastAPI -> Django). Never replace technologies.
14. ATS SAFETY: A keyword may appear at most: once in the Skills section, once in a project bullet, and once in an experience bullet. Avoid repetition. Keyword stuffing lowers quality.
15. INTERVIEW SURVIVABILITY TEST: Before outputting any modified bullet, ask yourself: "Can the candidate confidently explain this statement in a technical interview?" If NO, reject the modification. Every bullet must be defensible under detailed technical questioning.
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
    execution_plan: Optional[Dict[str, Any]] = None,
    jd_pillars: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()

    if mode == "customize":
        if not user_id:
            user_id = "default_user"

        original_resume = await run_resume_extractor(user_id)

        if not any(original_resume.values()):
            raise Exception("No resume chunks found. Please re-upload your resume from the Profile page before customizing.")

        jd_intents = await run_jd_intent_extractor(jd)
        project_rankings = await run_project_scorer(user_id, jd_intents)

        style_patterns = []
        try:
            supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
            if supabase_url and supabase_key:
                search_text = ", ".join(jd_intents.get("technical", {}).keys()) if jd_intents.get("technical") else jd
                embedding_payload_text = f"Role: {position}. Target Skills: {search_text}"

                embed_resp = await client.aio.models.embed_content(
                    model="gemini-embedding-2",
                    contents=embedding_payload_text,
                    config=types.EmbedContentConfig(output_dimensionality=768)
                )
                query_vector = embed_resp.embeddings[0].values

                headers = {
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "query_embedding": query_vector,
                    "match_threshold": 0.50,
                    "match_count": 5
                }
                async with httpx.AsyncClient() as http_client:
                    res = await http_client.post(
                        f"{supabase_url}/rest/v1/rpc/match_style_patterns",
                        json=payload,
                        headers=headers,
                        timeout=10.0
                    )
                    if res.status_code == 200:
                        data_list = res.json()
                        style_patterns = [row["style_pattern"] for row in data_list if row.get("style_pattern")]
        except Exception:
            pass

        if not style_patterns:
            style_patterns = [
                "Built and shipped X independently...",
                "Deployed and maintained scalable systems...",
                "Developed retrieval-augmented generation pipelines..."
            ]

        customized_resume = await run_resume_writer(
            original_resume=original_resume,
            project_rankings=project_rankings,
            style_patterns=style_patterns,
            jd_intents=jd_intents,
            position=position,
            company_name=company_name
        )

        validation_result = await run_resume_validator(
            customized_resume=customized_resume,
            original_evidence=project_rankings,
            original_resume=original_resume
        )
        is_valid = validation_result.get("is_valid", True)

        MAX_VALIDATION_ATTEMPTS = 2
        attempts = 0
        while not validation_result.get("is_valid", True) and attempts < MAX_VALIDATION_ATTEMPTS:
            attempts += 1
            correction_instructions = (
                f"CORRECTION REQUIRED — previous output failed validation.\n"
                f"Remove these unsupported technologies: {validation_result.get('unsupported_technologies', [])}.\n"
                f"Remove these hallucinated metrics: {validation_result.get('hallucinated_metrics', [])}.\n"
                f"Apply these fixes: {validation_result.get('reconstruction_plan', '')}."
            )
            customized_resume = await run_resume_writer(
                original_resume=original_resume,
                project_rankings=project_rankings,
                style_patterns=style_patterns + [correction_instructions],
                jd_intents=jd_intents,
                position=position,
                company_name=company_name
            )
            validation_result = await run_resume_validator(
                customized_resume=customized_resume,
                original_evidence=project_rankings,
                original_resume=original_resume
            )

        customized_resume["name"] = original_resume.get("profile", {}).get("name", "Full Name")
        customized_resume["contact_info"] = original_resume.get("profile", {}).get("contact_info", {})
        customized_resume["education"] = original_resume.get("education", [])

        original_latex = original_resume.get("latex_source", "")
        merge_error = None
        if original_latex:
            try:
                rendered_latex = merge_customized_sections_into_latex(original_latex, customized_resume)
            except Exception as e:
                merge_error = str(e)
                rendered_latex = render_latex_resume(customized_resume)
        else:
            rendered_latex = render_latex_resume(customized_resume)

        return {
            "markdown": rendered_latex,
            "data": {
                "customized_json": customized_resume,
                "jd_intents": jd_intents,
                "validation": validation_result,
                "merge_warning": merge_error
            },
            "personaLabel": get_persona_label(position),
            "toolUsed": "groq-llama-3.3-70b-specdec",
            "usage": {
                "promptTokenCount": 0,
                "candidatesTokenCount": 0,
                "totalTokenCount": 0
            },
            "estimated_cost": 0.0
        }
    prompt = build_analysis_prompt(
        company_name, position, context, jd, location, job_type, mode, user_name, intel, execution_plan, jd_pillars
    )

    last_error = None
    models_to_try = DEFAULT_MODELS + ["groq-llama-3.3-70b"]
    for model_name in models_to_try:
        try:
            if model_name == "groq-llama-3.3-70b":
                groq_api_key = os.getenv("GROQ_API_KEY")
                if not groq_api_key:
                    raise Exception("GROQ_API_KEY is not configured")
                headers = {
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are an elite career strategist and ATS optimization expert. Maintain strict boundaries for JSON output."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.0
                }
                with httpx.Client() as client_http:
                    res = client_http.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        json=payload,
                        headers=headers,
                        timeout=45.0
                    )
                    if res.status_code != 200:
                        raise Exception(f"Groq API call failed: {res.text}")
                    text = res.json()["choices"][0]["message"]["content"]
                    usage = {
                        "promptTokenCount": 0,
                        "candidatesTokenCount": 0,
                        "totalTokenCount": 0
                    }
                    cost = 0.0
            else:
                response = await client.aio.models.generate_content(
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
            continue
            
    raise HTTPException(status_code=500, detail=f"All generative models failed. Last error: {str(last_error)}")
