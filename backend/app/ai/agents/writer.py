import os
import json
import httpx
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

class RawWorkExperience(BaseModel):
    company: str = Field(description="Name of the company/employer")
    role: str = Field(description="Candidate's job title")
    location: str = Field(description="Location of the job")
    date_range: str = Field(description="Employment dates")
    highlights: List[str] = Field(description="List of raw bullet points/achievements exactly as in the resume")

class RawProject(BaseModel):
    name: str = Field(description="Name of the project")
    highlights: List[str] = Field(description="List of raw project bullet points/achievements")

class RawStructuredResume(BaseModel):
    skills: List[str] = Field(description="Flat list of all technical skills, frameworks, databases, and tools present in the resume")
    experience: List[RawWorkExperience] = Field(description="List of work experiences")
    projects: List[RawProject] = Field(description="List of projects")

class SkillCategory(BaseModel):
    category: str = Field(description="Category name, e.g. 'Languages', 'Frameworks', 'Databases', 'Tools'")
    skills: List[str] = Field(description="List of skills in this category")

class OptimizedSkillsSchema(BaseModel):
    skills: List[SkillCategory] = Field(description="Categorized list of optimized skills")

COMMON_TECH_KEYWORDS = [
    "angular", "svelte", "astro", "vue", "ember", "backbone",
    "spring", "django", "laravel", "rails", "kubernetes", "k8s",
    "aws", "gcp", "azure", "docker", "terraform", "ansible",
    "postgres", "postgresql", "mysql", "mongodb", "redis", "supabase",
    "firebase", "dynamodb", "sqlite", "oracle", "sql server",
    "typescript", "javascript", "python", "java", "golang", "c++",
    "rust", "graphql", "rest api", "next.js", "nextjs", "react",
    "copilot", "codex", "chatgpt", "openai", "gemini", "langchain",
    "apostrophe cms", "drupal", "wordpress"
]

def sanitize_hallucinated_technologies(text: str, allowed_skills_lower: set) -> str:
    if not text:
        return text
    cleaned = text
    for tech in COMMON_TECH_KEYWORDS:
        if tech not in allowed_skills_lower:
            pattern = re.compile(r'\b' + re.escape(tech) + r'\b', re.IGNORECASE)
            if pattern.search(cleaned):
                cleaned = pattern.sub("", cleaned)
    cleaned = re.sub(r'\s*,\s*,', ',', cleaned)
    cleaned = re.sub(r',\s*$', '', cleaned)
    cleaned = re.sub(r'^\s*,\s*', '', cleaned)
    cleaned = re.sub(r'\(\s*\)', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

async def call_groq_llama(prompt: str, system_message: str = "You are a professional resume rewriter.") -> str:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise Exception("GROQ_API_KEY is not configured in backend .env file")

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
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
        result = res.json()
        return result["choices"][0]["message"]["content"]

async def run_resume_writer(
    original_resume: Dict[str, Any],
    project_rankings: List[Dict[str, Any]],
    style_patterns: List[str],
    jd_intents: Dict[str, Any]
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    gemini_client = genai.Client(api_key=api_key) if api_key else genai.Client()

    raw_resume_payload = {
        "skills": original_resume.get("skills", []),
        "experience": original_resume.get("experience", []),
        "projects": original_resume.get("projects", [])
    }
    struct_prompt = f"""
    Parse and structure the following raw resume chunks into structured fields.
    Extract every skill name, work experience (with original bullets), and project name/bullets exactly as written.

    RAW CHUNKS:
    {json.dumps(raw_resume_payload, indent=2)}
    """
    struct_resp_text = None
    last_err = None
    for model_name in ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash", "gemini-2.5-flash", "groq-llama-3.3-70b"]:
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
                        {"role": "system", "content": "You are a professional resume parser. Output only valid JSON matching the schema."},
                        {"role": "user", "content": struct_prompt}
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
                    struct_resp_text = res.json()["choices"][0]["message"]["content"]
            else:
                struct_resp = gemini_client.models.generate_content(
                    model=model_name,
                    contents=struct_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=RawStructuredResume,
                        temperature=0.0
                    )
                )
                struct_resp_text = struct_resp.text
            break
        except Exception as e:
            last_err = e
            continue

    if not struct_resp_text:
        raise last_err

    structured_resume = RawStructuredResume.parse_raw(struct_resp_text.strip())

    verified_skills = set(structured_resume.skills)
    for rank in project_rankings:
        for tech in rank.get("selected_technologies", []):
            verified_skills.add(tech)
        for tech in rank.get("technologies", []):
            verified_skills.add(tech)
        if rank.get("deployments"):
            for dep in rank["deployments"]:
                if dep.get("platform"):
                    verified_skills.add(dep["platform"])
    
    allowed_skills_lower = {s.lower() for s in verified_skills}

    skills_prompt = f"""
    You are a resume skills organizer. Categorize, filter, and reorder the verified skills list to highlight skills relevant to the target JD.
    
    VERIFIED SKILLS (IMMUTABLE - you are FORBIDDEN from adding any skill not in this list):
    {json.dumps(list(verified_skills), indent=2)}

    JD INTENTS:
    {json.dumps(jd_intents, indent=2)}
    """
    skills_resp_text = None
    last_err = None
    for model_name in ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3-flash", "gemini-2.5-flash", "groq-llama-3.3-70b"]:
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
                        {"role": "system", "content": "You are a professional resume skills organizer. Output only valid JSON matching the schema."},
                        {"role": "user", "content": skills_prompt}
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
                    skills_resp_text = res.json()["choices"][0]["message"]["content"]
            else:
                skills_resp = gemini_client.models.generate_content(
                    model=model_name,
                    contents=skills_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=OptimizedSkillsSchema,
                        temperature=0.0
                    )
                )
                skills_resp_text = skills_resp.text
            break
        except Exception as e:
            last_err = e
            continue

    if not skills_resp_text:
        raise last_err

    optimized_skills_data = json.loads(skills_resp_text.strip())
    final_skills = []
    for cat in optimized_skills_data.get("skills", []):
        cat_name = cat.get("category", "")
        cat_skills = []
        for sk in cat.get("skills", []):
            if sk.lower() in allowed_skills_lower:
                cat_skills.append(sk)
        if cat_skills:
            final_skills.append({"category": cat_name, "skills": cat_skills})

    optimized_experience = []
    style_guide = "\n".join(f"- {pattern}" for pattern in style_patterns)

    for job in structured_resume.experience:
        job_prompt = f"""
        You are a resume writer. Rewrite the phrasing of the following work experience highlights (bullets) to align them with the JD intents. Use the style guide patterns.
        
        COMPANY: {job.company}
        ROLE: {job.role}
        LOCATION: {job.location}
        DATES: {job.date_range}
        
        HIGHLIGHTS TO REWRITE:
        {json.dumps(job.highlights, indent=2)}

        JD INTENTS:
        {json.dumps(jd_intents, indent=2)}

        STYLE GUIDE PATTERNS:
        {style_guide}

        CRITICAL CONSTRAINTS & QUALITY RULES:
        1. Rewrite only the wording of the existing bullets.
        2. Do NOT change the company, role, location, or dates.
        3. Do NOT add new bullets or responsibilities.
        4. Do NOT introduce any technologies not present in this allowed verified skills list: {list(verified_skills)}.
        5. USE CONCRETE, MEASURABLE ENGINEERING ACTION VERBS. Prefer 'Built', 'Designed', 'Implemented', 'Optimized', 'Integrated', 'Reduced', 'Engineered', 'Scaled', 'Automated'. FORBID marketing copy or vague, non-technical adjectives (e.g. 'crafted', 'fostered collaborative relationships', 'superior user experience', 'seamless flow').
        6. Inject high-value target keywords and specific terminology from the target JD (e.g. matching frameworks, architecture patterns, API contracts, browser/server performance, state management, databases) naturally where they are truthful to the candidate's verified skills and experience.
        7. Output exactly the same number of bullet points as the input highlights list. Do not truncate the list.
        8. Return the result as a simple JSON array of strings containing the rewritten bullets.
        """
        job_resp = await call_groq_llama(
            prompt=job_prompt,
            system_message="You are a professional resume rewriter. You always output a raw JSON array of strings containing rewritten bullets."
        )
        try:
            array_match = re.search(r'\[\s*".*?"\s*\]', job_resp.replace('\n', ' '), re.DOTALL)
            if array_match:
                bullets = json.loads(array_match.group(0))
            else:
                bullets = json.loads(job_resp.strip())
        except Exception:
            bullets = job.highlights

        cleaned_bullets = [sanitize_hallucinated_technologies(b, allowed_skills_lower) for b in bullets]
        optimized_experience.append({
            "company": job.company,
            "role": job.role,
            "location": job.location,
            "date_range": job.date_range,
            "highlights": cleaned_bullets
        })

    optimized_projects = []

    for rank in project_rankings[:3]:
        proj_name = rank["project_name"]
        proj_evidence = rank.get("selected_evidence", [])
        proj_tech = rank.get("selected_technologies", [])
        proj_deployments = rank.get("deployments", [])

        proj_prompt = f"""
        You are a technical resume writer. Rewrite the bullets for the project '{proj_name}' using ONLY the verified evidence and technologies provided below.
        
        VERIFIED TECHNOLOGIES:
        {json.dumps(proj_tech, indent=2)}

        VERIFIED DEPLOYMENTS:
        {json.dumps(proj_deployments, indent=2)}

        VERIFIED EVIDENCE:
        {json.dumps(proj_evidence, indent=2)}

        JD INTENTS:
        {json.dumps(jd_intents, indent=2)}

        STYLE GUIDE PATTERNS:
        {style_guide}

        CRITICAL CONSTRAINTS & QUALITY RULES:
        1. Write bullets based strictly on the verified evidence. Do NOT invent metrics or capabilities.
        2. Do NOT mention any technologies not listed in the verified technologies or deployments.
        3. Avoid weak, list-like bullets (e.g. 'Utilized API, HTML, CSS, and JavaScript...'). Write strong, action-oriented, technical achievements explaining what was built and optimized.
        4. USE CONCRETE, MEASURABLE ENGINEERING ACTION VERBS. Prefer 'Built', 'Designed', 'Implemented', 'Optimized', 'Integrated', 'Reduced', 'Engineered', 'Scaled', 'Automated'. Do NOT start multiple bullets with 'Deployed'. FORBID marketing copy or vague, non-technical adjectives (e.g. 'crafted', 'fostered collaborative relationships', 'superior user experience', 'seamless flow').
        5. Inject high-value target keywords and specific terminology from the target JD (e.g. matching frameworks, architecture patterns, API contracts, browser/server performance, state management, databases) naturally where they are truthful to the candidate's verified technologies and project evidence.
        6. Output exactly the same number of bullet points as the input verified evidence list.
        7. Return the result as a simple JSON array of strings containing the rewritten bullets.
        """
        proj_resp = await call_groq_llama(
            prompt=proj_prompt,
            system_message="You are a professional resume rewriter. You always output a raw JSON array of strings containing rewritten bullets."
        )
        try:
            array_match = re.search(r'\[\s*".*?"\s*\]', proj_resp.replace('\n', ' '), re.DOTALL)
            if array_match:
                bullets = json.loads(array_match.group(0))
            else:
                bullets = json.loads(proj_resp.strip())
        except Exception:
            bullets = proj_evidence[:3]

        cleaned_bullets = [sanitize_hallucinated_technologies(b, allowed_skills_lower) for b in bullets]
        generic_tech = {"html", "css", "javascript", "js", "dockerfile", "shell", "pydantic", "tex", "vercel", "render"}
        filtered_tech = [t for t in proj_tech if t.lower() in allowed_skills_lower and t.lower() not in generic_tech]
        optimized_projects.append({
            "name": proj_name,
            "technologies": filtered_tech[:6],
            "highlights": cleaned_bullets
        })

    summary_prompt = f"""
    Write a powerful 3-4 sentence professional summary tailored to the target JD.
    
    CANDIDATE PROFILE HIGHLIGHTS:
    - Verified Skills: {list(verified_skills)}
    - Key Projects: {[p['name'] for p in optimized_projects]}

    JD INTENTS:
    {json.dumps(jd_intents, indent=2)}

    CRITICAL CONSTRAINTS:
    1. Only mention technologies and accomplishments present in the candidate profile highlights above. Do not speculate.
    2. Write a single flat paragraph summary.
    """
    summary_text = await call_groq_llama(
        prompt=summary_prompt,
        system_message="You are a professional resume rewriter. You write clear, factual professional summaries based strictly on candidate profiles."
    )
    summary_cleaned = sanitize_hallucinated_technologies(summary_text.strip(), allowed_skills_lower)

    return {
        "summary": summary_cleaned,
        "skills": final_skills,
        "experience": optimized_experience,
        "projects": optimized_projects
    }
