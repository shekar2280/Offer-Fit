import re
from typing import Dict, Any, List
from app.core.supabase import get_resume_chunks, get_supabase_client

def strip_latex_markup(text: str) -> str:
    """Removes comments, common commands, and braces to extract clean text from LaTeX."""
    if not text:
        return ""
    # Remove LaTeX comments
    text = re.sub(r'(?<!\\)%.*$', '', text, flags=re.MULTILINE)
    # Format list items nicely
    text = re.sub(r'\\item\s*', '- ', text)
    # Remove basic formatting commands like \textbf{...}, \textit{...}, \href{...}{...}
    text = re.sub(r'\\[a-zA-Z]+\*?(?:\[[^\]]*\])?\{([^}]*)\}', r'\1', text)
    # Remove standalone backslash commands
    text = re.sub(r'\\[a-zA-Z]+', ' ', text)
    # Remove curly braces
    text = re.sub(r'[{}]', ' ', text)
    # Normalize spacing
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_and_chunk_latex(latex_text: str) -> List[Dict[str, str]]:
    """Regex-parses sections from a LaTeX document and chunks them for structural analysis."""
    chunks = []
    section_pattern = re.compile(r'\\section\*?\{([^}]+)\}')
    matches = list(section_pattern.finditer(latex_text))
    
    if not matches:
        cleaned = strip_latex_markup(latex_text)
        if cleaned:
            chunks.append({"content": cleaned})
        return chunks
        
    for i, match in enumerate(matches):
        section_name = match.group(1).strip()
        start = match.end()
        end = matches[i+1].start() if i+1 < len(matches) else len(latex_text)
        section_body = latex_text[start:end].strip()

        blocks = re.split(r'\\item|\\begin\{onecolentry\}|\\end\{onecolentry\}|\n\n', section_body)
        for block in blocks:
            cleaned_block = strip_latex_markup(block)
            if len(cleaned_block) > 15:
                chunks.append({
                    "content": f"[{section_name}] {cleaned_block}"
                })
                
    return chunks

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

    if not chunks and profile_info.get("latex_source"):
        chunks = parse_and_chunk_latex(profile_info["latex_source"])

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
