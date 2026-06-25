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

async def fetch_github_package_dependencies(owner: str, repo: str) -> List[str]:
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
    
    headers = {
        "User-Agent": "resume-analyzer-backend"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            url_master = f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1"
            response = await client.get(url_master, headers=headers)
            
        package_paths = []
        if response.status_code == 200:
            tree_data = response.json()
            for file_entry in tree_data.get("tree", []):
                path = file_entry.get("path", "")
                if path.endswith("package.json"):
                    if "node_modules" not in path and path.count("/") <= 2:
                        package_paths.append(path)
        else:
            package_paths = ["package.json"] 
            
        frameworks = []
        mapping = {
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
            "capacitor": "Capacitor"
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
                            for key, val in mapping.items():
                                if key in dep_lower and val not in frameworks:
                                    frameworks.append(val)
                    except Exception:
                        pass
        return frameworks

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
