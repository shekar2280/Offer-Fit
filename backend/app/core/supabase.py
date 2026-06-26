import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

if not supabase_url or not supabase_key:
    from dotenv import load_dotenv
    for path in ["../frontend/.env.local", "frontend/.env.local", ".env"]:
        if os.path.exists(path):
            load_dotenv(path)
            supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
            if supabase_url and supabase_key:
                break

if not supabase_url or not supabase_key:
    supabase = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase_client() -> Optional[Client]:
    return supabase

async def get_resume_chunks(user_id: str) -> List[Dict[str, Any]]:
    if not supabase:
        return []
    try:
        response = supabase.table("resume_chunks").select("id, content, embedding").eq("user_id", user_id).execute()
        return response.data or []
    except Exception:
        return []

async def get_project_intelligence(user_id: str) -> List[Dict[str, Any]]:
    if not supabase:
        return []
    try:
        response = supabase.table("project_intelligence").select("*").eq("user_id", user_id).execute()
        return response.data or []
    except Exception:
        return []

async def store_project_intelligence(
    user_id: str,
    project_name: str,
    context: str,
    features_built: List[str],
    tech_stack: List[str],
    evidence: List[str],
    signals: List[str],
    deployments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    if not supabase:
        raise Exception("Supabase client is not initialized")
    try:
        existing = supabase.table("project_intelligence")\
            .select("id")\
            .eq("user_id", user_id)\
            .eq("project_name", project_name)\
            .execute()
        
        payload = {
            "user_id": user_id,
            "project_name": project_name,
            "context": context,
            "features_built": features_built,
            "tech_stack": tech_stack,
            "evidence": evidence,
            "signals": signals,
            "deployments": deployments or [],
            "updated_at": "now()"
        }

        if existing.data and len(existing.data) > 0:
            record_id = existing.data[0]["id"]
            response = supabase.table("project_intelligence")\
                .update(payload)\
                .eq("id", record_id)\
                .execute()
        else:
            response = supabase.table("project_intelligence")\
                .insert(payload)\
                .execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        raise e

async def store_jd_intents(analysis_id: str, intents: Dict[str, Any]) -> None:
    if not supabase:
        return
    try:
        supabase.table("analyses")\
            .update({"jd_intents": intents})\
            .eq("id", analysis_id)\
            .execute()
    except Exception:
        pass

async def store_customized_json(analysis_id: str, customized_json: Dict[str, Any]) -> None:
    if not supabase:
        return
    try:
        supabase.table("analyses")\
            .update({"customized_json": customized_json})\
            .eq("id", analysis_id)\
            .execute()
    except Exception:
        pass
