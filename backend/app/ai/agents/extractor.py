from typing import Dict, Any, List
from app.core.supabase import get_resume_chunks, get_supabase_client

async def run_resume_extractor(user_id: str) -> Dict[str, Any]:
    supabase = get_supabase_client()
    profile_info: Dict[str, Any] = {}
    education_info: Dict[str, Any] = {}

    if supabase:
        try:
            try:
                profile_resp = supabase.table("profiles").select(
                    "full_name, email, resume_text"
                ).eq("id", user_id).execute()
            except Exception:
                profile_resp = supabase.table("profiles").select(
                    "full_name, email, latex_source"
                ).eq("id", user_id).execute()

            if profile_resp.data:
                p = profile_resp.data[0]
                resume_content = p.get("resume_text") or p.get("latex_source") or ""
                profile_info = {
                    "name": p.get("full_name") or "Full Name",
                    "contact_info": {
                        "email": p.get("email") or "",
                        "phone": "",
                        "linkedin": "",
                        "github": "",
                        "portfolio": "",
                        "location": ""
                    },
                    "latex_source": resume_content
                }
        except Exception:
            pass

    chunks = await get_resume_chunks(user_id)

    skills = []
    experience = []
    projects = []

    for chunk in chunks:
        content = chunk.get("content", "")
        content_lower = content.lower()

        if "[skills]" in content_lower or "skills:" in content_lower:
            skills.append(content)
        elif "[experience]" in content_lower or "work experience:" in content_lower or "employment:" in content_lower:
            experience.append(content)
        elif "[projects]" in content_lower or "projects:" in content_lower:
            projects.append(content)
        else:
            if any(k in content_lower for k in ["react", "python", "sql", "aws", "docker", "kubernetes", "c++", "java"]):
                skills.append(content)
            elif any(k in content_lower for k in ["project", "developed", "built", "implemented"]):
                projects.append(content)
            else:
                experience.append(content)

    return {
        "profile": profile_info,
        "education": [education_info] if education_info.get("institution") else [],
        "latex_source": profile_info.get("latex_source") if profile_info else "",
        "skills": skills,
        "experience": experience,
        "projects": projects,
    }
