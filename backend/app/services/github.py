import httpx
import base64
import re
import json
from typing import Optional, List, Dict, Any

async def fetch_github_repo_readme(owner: str, repo: str) -> str:
    url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            data = response.json()
            if "content" in data:
                content_b64 = data["content"]
                try:
                    return base64.b64decode(content_b64).decode("utf-8")
                except Exception:
                    return ""
        return ""

async def fetch_github_commits(
    owner: str, 
    repo: str, 
    author_email: Optional[str] = None, 
    max_commits: int = 100,
    since_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page={max_commits}"
    if author_email:
        url += f"&author={author_email}"
    if since_date:
        url += f"&since={since_date}"
        
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            return response.json()
        return []

async def fetch_github_languages(owner: str, repo: str) -> List[str]:
    url = f"https://api.github.com/repos/{owner}/{repo}/languages"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            return list(response.json().keys())
        return []

async def fetch_github_package_dependencies(owner: str, repo: str) -> tuple[List[str], List[Dict[str, str]]]:
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
    headers = {"User-Agent": "resume-analyzer-backend"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            url_master = f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1"
            response = await client.get(url_master, headers=headers)
            
        package_paths = []
        requirements_paths = []
        frameworks = []
        deployments = []
        
        def add_suggest(component: str, platform: str):
            if not any(d["component"] == component and d["platform"] == platform for d in deployments):
                deployments.append({"component": component, "platform": platform, "status": "suggested"})
        
        if response.status_code == 200:
            tree_data = response.json()
            for file_entry in tree_data.get("tree", []):
                path = file_entry.get("path", "")
                path_lower = path.lower()
                
                if path.endswith("package.json"):
                    if "node_modules" not in path and path.count("/") <= 2:
                        package_paths.append(path)
                        
                if path.endswith("requirements.txt") or path.endswith("pyproject.toml") or path.endswith("Pipfile"):
                    if "venv" not in path and ".venv" not in path and path.count("/") <= 2:
                        requirements_paths.append(path)
                        
                if "vercel.json" in path_lower:
                    if "Vercel" not in frameworks:
                        frameworks.append("Vercel")
                    add_suggest("Frontend", "Vercel")
                if "render.yaml" in path_lower or "render.json" in path_lower:
                    if "Render" not in frameworks:
                        frameworks.append("Render")
                    add_suggest("Backend", "Render")
                if "dockerfile" in path_lower or "docker-compose" in path_lower:
                    if "Docker" not in frameworks:
                        frameworks.append("Docker")
                    add_suggest("Full Stack", "Docker")
                if "serverless.yml" in path_lower or "sst.config" in path_lower:
                    for val in ["AWS", "Serverless"]:
                        if val not in frameworks:
                            frameworks.append(val)
                    add_suggest("Backend", "AWS")
                if "supabase" in path_lower and ("config.toml" in path_lower or "migrations" in path_lower):
                    for val in ["Supabase", "PostgreSQL"]:
                        if val not in frameworks:
                            frameworks.append(val)
                    add_suggest("Database", "Supabase")
                if "fly.toml" in path_lower:
                    if "Fly.io" not in frameworks:
                        frameworks.append("Fly.io")
                    add_suggest("Full Stack", "Fly.io")
                if "railway.toml" in path_lower:
                    if "Railway" not in frameworks:
                        frameworks.append("Railway")
                    add_suggest("Full Stack", "Railway")
                if "wrangler.toml" in path_lower:
                    if "Cloudflare" not in frameworks:
                        frameworks.append("Cloudflare")
                    add_suggest("Full Stack", "Cloudflare Workers")
                if "amplify.yml" in path_lower or "amplify.json" in path_lower:
                    if "AWS" not in frameworks:
                        frameworks.append("AWS")
                    add_suggest("Frontend", "AWS Amplify")
                if ".github/workflows" in path_lower:
                    for val in ["GitHub Actions", "CI/CD"]:
                        if val not in frameworks:
                            frameworks.append(val)
        else:
            package_paths = ["package.json"]
            
        node_mapping = {
            "react-native": "React Native",
            "expo": "Expo",
            "react": "React",
            "next": "Next.js",
            "vue": "Vue.js",
            "nuxt": "Nuxt.js",
            "angular": "Angular",
            "svelte": "Svelte",
            "tailwindcss": "Tailwind CSS",
            "typescript": "TypeScript",
            "vite": "Vite",
            "express": "Express",
            "nest": "NestJS",
            "fastify": "Fastify",
            "electron": "Electron",
            "flutter": "Flutter",
            "cordova": "Cordova",
            "ionic": "Ionic",
            "capacitor": "Capacitor",
            "pg": "PostgreSQL",
            "postgres": "PostgreSQL",
            "supabase": "Supabase",
            "neon": "Neon",
            "redis": "Redis",
            "socket.io": "Socket.io",
            "openai": "OpenAI API",
            "google/generative-ai": "Gemini API",
            "aws-sdk": "AWS"
        }
        
        for pkg_path in package_paths:
            content_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{pkg_path}"
            content_res = await client.get(content_url, headers=headers)
            if content_res.status_code == 200:
                data = content_res.json()
                if "content" in data:
                    try:
                        content_str = base64.b64decode(data["content"]).decode("utf-8")
                        pkg = json.loads(content_str)
                        deps = pkg.get("dependencies", {})
                        dev_deps = pkg.get("devDependencies", {})
                        all_deps = list(deps.keys()) + list(dev_deps.keys())
                        
                        for dep in all_deps:
                            dep_lower = dep.lower()
                            for key, val in node_mapping.items():
                                if key in dep_lower and val not in frameworks:
                                    frameworks.append(val)
                    except Exception:
                        pass
                        
        python_mapping = {
            "fastapi": "FastAPI",
            "django": "Django",
            "flask": "Flask",
            "sqlalchemy": "SQLAlchemy",
            "psycopg": "PostgreSQL",
            "asyncpg": "PostgreSQL",
            "pg8000": "PostgreSQL",
            "neon": "Neon",
            "supabase": "Supabase",
            "redis": "Redis",
            "celery": "Celery",
            "pydantic": "Pydantic",
            "numpy": "NumPy",
            "pandas": "Pandas",
            "scikit-learn": "scikit-learn",
            "tensorflow": "TensorFlow",
            "torch": "PyTorch",
            "openai": "OpenAI API",
            "google-genai": "Gemini API",
            "langchain": "LangChain",
            "chromadb": "ChromaDB",
            "pinecone": "Pinecone",
            "boto3": "AWS",
            "google-cloud": "GCP"
        }
        
        for req_path in requirements_paths:
            content_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{req_path}"
            content_res = await client.get(content_url, headers=headers)
            if content_res.status_code == 200:
                data = content_res.json()
                if "content" in data:
                    try:
                        content_str = base64.b64decode(data["content"]).decode("utf-8")
                        lines = content_str.split("\n")
                        for line in lines:
                            line_lower = line.strip().lower()
                            pkg_name = re.split(r"[=<>~]", line_lower)[0].strip()
                            for key, val in python_mapping.items():
                                if key == pkg_name and val not in frameworks:
                                    frameworks.append(val)
                    except Exception:
                        pass
                        
        return frameworks, deployments

async def fetch_github_prs(owner: str, repo: str, author_username: Optional[str] = None, max_prs: int = 50) -> List[Dict[str, Any]]:
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls?state=closed&per_page={max_prs}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            prs = response.json()
            if author_username:
                username_lower = author_username.lower()
                prs = [p for p in prs if p.get("user", {}).get("login", "").lower() == username_lower]
            return prs
        return []

def is_meaningful_commit(message: str) -> bool:
    msg_lower = message.lower()
    ignore_patterns = [
        r"^wip\b",
        r"\btypo\b",
        r"\blint\b",
        r"\bformat\b",
        r"^merge\b",
        r"\bbump version\b",
        r"\bupdate dependency\b",
        r"\bupdate dependencies\b",
        r"\bcleanup\b",
        r"^style\b"
    ]
    for pattern in ignore_patterns:
        if re.search(pattern, msg_lower):
            return False
    return True
