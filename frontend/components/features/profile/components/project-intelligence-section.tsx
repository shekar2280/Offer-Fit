"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/services/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { CheckCircle2, AlertCircle, Terminal, Plus, Trash2, X, ChevronDown, RefreshCw } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
);

interface DeploymentItem {
    component: string;
    platform: string;
    status?: string;
}

interface ProjectIntel {
    id: string;
    project_name: string;
    context: string;
    features_built: string[];
    tech_stack: string[];
    signals: string[];
    evidence: string[];
    deployments?: DeploymentItem[];
}

interface FeatureInput {
    id: string;
    name: string;
    description: string;
    commits: string;
}

const COMMON_TECH_STACK = [
    "React", "Next.js", "TypeScript", "Node.js", "Python", "FastAPI", "Django",
    "PostgreSQL", "MongoDB", "Redis", "Supabase", "Firebase", "Docker", "Kubernetes",
    "AWS", "GCP", "Vercel", "Tailwind CSS", "GraphQL", "REST API", "Gemini", "OpenAI"
];

const POPULAR_HOSTING_OPTIONS = [
    "Vercel",
    "Render",
    "AWS (Amazon Web Services)",
    "GCP (Google Cloud Platform)",
    "Docker / VPS",
    "Heroku",
    "Netlify",
    "Fly.io",
    "Railway",
    "Supabase",
    "Other (Custom)"
];

export function ProjectIntelligenceSection({ user }: { user: SupabaseUser }) {
    const [uploading, setUploading] = useState(false);
    const [projects, setProjects] = useState<ProjectIntel[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isGithubLinked, setIsGithubLinked] = useState(false);
    const [repoUrl, setRepoUrl] = useState("");
    const [syncingRepo, setSyncingRepo] = useState<string | null>(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

    const [projectName, setProjectName] = useState("");
    const [context, setContext] = useState("");
    const [techStack, setTechStack] = useState<string[]>([]);
    const [features, setFeatures] = useState<FeatureInput[]>([
        { id: "1", name: "", description: "", commits: "" }
    ]);
    const [techDropdownOpen, setTechDropdownOpen] = useState(false);
    const [customTech, setCustomTech] = useState("");
    const techDropdownRef = useRef<HTMLDivElement>(null);

    const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
    const [newComponent, setNewComponent] = useState("Frontend");
    const [newPlatform, setNewPlatform] = useState("");
    const [customNewPlatform, setCustomNewPlatform] = useState("");
    
    const [isEditingDeployments, setIsEditingDeployments] = useState<string | null>(null);
    const [editingDeploymentsList, setEditingDeploymentsList] = useState<DeploymentItem[]>([]);
    const [editNewComponent, setEditNewComponent] = useState("Frontend");
    const [editNewPlatform, setEditNewPlatform] = useState("");
    const [customEditNewPlatform, setCustomEditNewPlatform] = useState("");

    const supabase = createClient();

    const fetchProjectIntel = async () => {
        try {
            const { data: intelData, error: intelError } = await supabase
                .from("project_intelligence")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (intelError) throw intelError;
            setProjects(intelData || []);
        } catch (e: any) {
        }
    };

    const handleSaveDeployments = async (projectId: string, list: DeploymentItem[]) => {
        try {
            const { error } = await supabase
                .from("project_intelligence")
                .update({ deployments: list })
                .eq("id", projectId);
            if (error) throw error;
            setSuccessMsg("Deployments updated successfully!");
            setIsEditingDeployments(null);
            fetchProjectIntel();
        } catch (e: any) {
            setErrorMsg("Failed to save deployments: " + e.message);
        }
    };

    const handleAcceptSuggestion = async (projectId: string, index: number) => {
        const proj = projects.find(p => p.id === projectId);
        if (!proj || !proj.deployments) return;
        const updated = proj.deployments.map((d, idx) => 
            idx === index ? { ...d, status: "accepted" } : d
        );
        try {
            const { error } = await supabase
                .from("project_intelligence")
                .update({ deployments: updated })
                .eq("id", projectId);
            if (error) throw error;
            fetchProjectIntel();
        } catch (e: any) {
        }
    };

    const handleRejectSuggestion = async (projectId: string, index: number) => {
        const proj = projects.find(p => p.id === projectId);
        if (!proj || !proj.deployments) return;
        const updated = proj.deployments.filter((_, idx) => idx !== index);
        try {
            const { error } = await supabase
                .from("project_intelligence")
                .update({ deployments: updated })
                .eq("id", projectId);
            if (error) throw error;
            fetchProjectIntel();
        } catch (e: any) {
        }
    };

    const checkGithubStatus = () => {
        const providers = user?.app_metadata?.providers || [];
        const identities = user?.identities || [];
        const hasGithub = providers.includes('github') || identities.some((id: any) => id.provider === 'github');
        setIsGithubLinked(hasGithub);
    };

    useEffect(() => {
        fetchProjectIntel();
        checkGithubStatus();
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (techDropdownRef.current && !techDropdownRef.current.contains(event.target as Node)) {
                setTechDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTech = (tech: string) => {
        setTechStack(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
    };

    const addCustomTech = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && customTech.trim()) {
            e.preventDefault();
            if (!techStack.includes(customTech.trim())) {
                setTechStack([...techStack, customTech.trim()]);
            }
            setCustomTech("");
        }
    };

    const addFeature = () => {
        setFeatures([...features, { id: Math.random().toString(), name: "", description: "", commits: "" }]);
    };

    const removeFeature = (id: string) => {
        setFeatures(features.filter(f => f.id !== id));
    };

    const updateFeature = (id: string, field: keyof FeatureInput, value: string) => {
        setFeatures(features.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const handleIngest = async () => {
        if (!projectName.trim() || !context.trim() || features.length === 0) {
            setErrorMsg("Please fill out Project Name, Context, and at least one Feature.");
            return;
        }
        setUploading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch("http://127.0.0.1:8000/project-kb/ingest", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    project_name: projectName,
                    context: context,
                    technologies: techStack,
                    features: features.map(({ name, description, commits }) => ({ name, description, commits })),
                    deployments: deployments
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                setSuccessMsg(`Successfully saved details for ${projectName}!`);
                setProjectName("");
                setContext("");
                setTechStack([]);
                setFeatures([{ id: "1", name: "", description: "", commits: "" }]);
                setDeployments([]);
                setNewComponent("Frontend");
                setNewPlatform("");
                setCustomNewPlatform("");
                setShowManualForm(false);
                fetchProjectIntel();
            } else {
                setErrorMsg(result.detail || "Save failed. Please check the backend connection.");
            }
        } catch (e: any) {
            setErrorMsg("Network error. Make sure backend is running on http://127.0.0.1:8000");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from("project_intelligence").delete().eq("id", id);
            if (error) throw error;
            fetchProjectIntel();
        } catch (e: any) {
        }
    };

    const handleGithubConnect = async () => {
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'github',
                options: {
                    scopes: 'repo read:user',
                    redirectTo: `${window.location.origin}/profile`
                }
            });
            if (error) throw error;
        } catch (e: any) {
            setErrorMsg("Failed to connect GitHub: " + e.message);
        }
    };

    const handleGithubSync = async () => {
        if (!repoUrl.trim()) return;
        setSyncingRepo("global");
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const githubIdentity = user?.identities?.find((id: any) => id.provider === 'github');
            const githubEmail = githubIdentity?.identity_data?.email || user?.email || "";

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch("http://127.0.0.1:8000/project-kb/github/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    repo_url: repoUrl.trim(),
                    github_email: githubEmail
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                setSuccessMsg(`Successfully synced repository!`);
                setRepoUrl("");
                fetchProjectIntel();
            } else {
                setErrorMsg(result.detail || result.message || "Sync failed. Make sure the repository format is correct (owner/repo).");
            }
        } catch (e: any) {
            setErrorMsg("Network error. Backend might be down.");
        } finally {
            setSyncingRepo(null);
        }
    };

    const handleRefetch = async (repoPath: string) => {
        setSyncingRepo(repoPath);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const githubIdentity = user?.identities?.find((id: any) => id.provider === 'github');
            const githubEmail = githubIdentity?.identity_data?.email || user?.email || "";

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch("http://127.0.0.1:8000/project-kb/github/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    repo_url: repoPath,
                    github_email: githubEmail
                })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                setSuccessMsg(`Successfully updated repository details for ${repoPath}!`);
                fetchProjectIntel();
            } else {
                setErrorMsg(result.detail || result.message || "Sync failed.");
            }
        } catch (e: any) {
            setErrorMsg("Network error. Backend might be down.");
        } finally {
            setSyncingRepo(null);
        }
    };

    return (
        <div className="space-y-8 text-white pb-10">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Project Experience</h2>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">
                        Add details about projects you have worked on. The AI will distill features and contribution signals for your resume.
                    </p>
                </div>

                {isGithubLinked ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)] cursor-default">
                        <GithubIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Connected</span>
                    </div>
                ) : (
                    <button
                        onClick={handleGithubConnect}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 shadow-md shadow-black/20 hover:shadow-black/40 hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200"
                    >
                        <GithubIcon className="w-4 h-4 text-white" />
                        Connect GitHub
                    </button>
                )}
            </div>

            {(errorMsg || successMsg) && (
                <div className="space-y-2">
                    {errorMsg && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] animate-in fade-in duration-200">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}
                </div>
            )}

            {isGithubLinked && (
                <div className="bg-zinc-950/40 border border-primary/20 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <GithubIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-white mb-1">Auto-Sync from GitHub</h3>
                            <p className="text-xs text-white/50 leading-relaxed mb-4">
                                Add a public repository of yours to gather information about your project contributions.
                            </p>

                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="owner/repo"
                                    className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                                />
                                <button
                                    onClick={handleGithubSync}
                                    disabled={syncingRepo !== null || !repoUrl.trim()}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center min-w-[120px] transition-colors disabled:opacity-50"
                                >
                                    {syncingRepo === "global" ? (
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    ) : (
                                        "Sync Repo"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showManualForm ? (
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowManualForm(true)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-white/[0.02] hover:bg-white/[0.06] text-white border border-white/10 hover:border-white/20 transition-all hover:translate-y-[-1px] active:translate-y-0"
                    >
                        <Plus className="w-4 h-4 text-primary" />
                        Add Project Manually
                    </button>
                </div>
            ) : (
                <div className="bg-zinc-950/40 border border-white/[0.04] rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Add Project Manually</h3>
                        <button
                            onClick={() => setShowManualForm(false)}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Project Name</label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                                placeholder="e.g. Offer Fit"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Deployments</label>
                            
                            {deployments.length > 0 && (
                                <div className="space-y-2 mb-3 bg-zinc-950/60 border border-white/[0.04] p-3 rounded-xl">
                                    {deployments.map((dep, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                                                    {dep.component}
                                                </span>
                                                <span className="text-white/80 font-bold">{dep.platform}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDeployments(deployments.filter((_, i) => i !== idx))}
                                                className="text-white/40 hover:text-red-400 p-1 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap md:flex-nowrap gap-2 items-start bg-zinc-950/40 border border-white/[0.04] p-3 rounded-xl">
                                <div className="w-full md:w-1/3">
                                    <label className="text-[10px] font-bold text-white/50 block mb-1 uppercase">Component</label>
                                    <select
                                        value={newComponent}
                                        onChange={(e) => setNewComponent(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                    >
                                        <option value="Frontend">Frontend</option>
                                        <option value="Backend">Backend</option>
                                        <option value="Database">Database</option>
                                        <option value="Full Stack">Full Stack</option>
                                    </select>
                                </div>
                                <div className="w-full md:w-2/3">
                                    <label className="text-[10px] font-bold text-white/50 block mb-1 uppercase">Platform</label>
                                    <select
                                        value={newPlatform}
                                        onChange={(e) => {
                                            setNewPlatform(e.target.value);
                                            if (e.target.value !== "Other (Custom)") {
                                                setCustomNewPlatform("");
                                            }
                                        }}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                    >
                                        <option value="">-- Select Platform --</option>
                                        {POPULAR_HOSTING_OPTIONS.filter(opt => opt !== "Other (Custom)").map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="Other (Custom)">Other (Custom)</option>
                                    </select>

                                    {newPlatform === "Other (Custom)" && (
                                        <input
                                            type="text"
                                            value={customNewPlatform}
                                            onChange={(e) => setCustomNewPlatform(e.target.value)}
                                            placeholder="Enter custom platform..."
                                            className="w-full mt-1.5 bg-zinc-900/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                        />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const finalPlat = newPlatform === "Other (Custom)" ? customNewPlatform : newPlatform;
                                        if (!finalPlat.trim()) return;
                                        setDeployments([...deployments, { component: newComponent, platform: finalPlat, status: "accepted" }]);
                                        setNewPlatform("");
                                        setCustomNewPlatform("");
                                    }}
                                    className="self-end bg-primary hover:bg-primary/80 text-black font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase shrink-0 transition-colors mt-4 md:mt-0"
                                >
                                    Add
                                </button>
                            </div>
                            
                            <p className="text-[10px] text-white/40 mt-2.5 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>Add all components of your application (e.g. Next.js on Vercel, FastAPI on Render) to match job requirements.</span>
                            </p>
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Project Description (Context)</label>
                            <textarea
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="w-full h-24 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary/50 focus:outline-none resize-none"
                                placeholder="What does this project do? Who is it for? What problem does it solve?"
                            />
                        </div>

                        <div className="relative" ref={techDropdownRef}>
                            <label className="text-xs font-bold uppercase tracking-wider text-white/70 block mb-2">Technologies Used</label>
                            <div
                                className="w-full min-h-[42px] bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2 flex flex-wrap gap-2 items-center cursor-text"
                                onClick={() => setTechDropdownOpen(true)}
                            >
                                {techStack.map(tech => (
                                    <span key={tech} className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                        {tech}
                                        <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={(e) => { e.stopPropagation(); toggleTech(tech); }} />
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={customTech}
                                    onChange={(e) => setCustomTech(e.target.value)}
                                    onKeyDown={addCustomTech}
                                    className="bg-transparent border-none outline-none text-xs text-white flex-1 min-w-[100px]"
                                    placeholder={techStack.length === 0 ? "Select or type..." : ""}
                                    onFocus={() => setTechDropdownOpen(true)}
                                />
                                <ChevronDown className="w-4 h-4 text-white/30 ml-auto shrink-0" />
                            </div>

                            {techDropdownOpen && (
                                <div className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl p-2 grid grid-cols-2 gap-1">
                                    {COMMON_TECH_STACK.map(tech => {
                                        const isSelected = techStack.includes(tech);
                                        return (
                                            <div
                                                key={tech}
                                                onClick={() => toggleTech(tech)}
                                                className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-white/70'}`}
                                            >
                                                {tech}
                                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/[0.04] space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-white/70">Your Contributions (Features & Evidence)</label>
                            <button onClick={addFeature} className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                                <Plus className="w-3 h-3" /> Add Feature
                            </button>
                        </div>

                        <div className="space-y-4">
                            {features.map((feature, idx) => (
                                <div key={feature.id} className="bg-zinc-950/60 border border-white/[0.04] rounded-xl p-4 relative group">
                                    {features.length > 1 && (
                                        <button onClick={() => removeFeature(feature.id)} className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="space-y-4 mr-6">
                                        <input
                                            type="text"
                                            value={feature.name}
                                            onChange={(e) => updateFeature(feature.id, "name", e.target.value)}
                                            placeholder={`Feature ${idx + 1} Name (e.g. Resume Parser)`}
                                            className="w-full bg-transparent border-b border-white/10 px-2 py-1.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={feature.description}
                                            onChange={(e) => updateFeature(feature.id, "description", e.target.value)}
                                            placeholder="Briefly describe what this feature does..."
                                            className="w-full bg-transparent border-b border-white/10 px-2 py-1.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                                        />
                                        <textarea
                                            value={feature.commits}
                                            onChange={(e) => updateFeature(feature.id, "commits", e.target.value)}
                                            placeholder="Provide additional details or notes about this feature (e.g. tools used, metrics, key accomplishments)"
                                            className="w-full h-20 bg-zinc-900/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:border-primary/50 focus:outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            onClick={handleIngest}
                            disabled={uploading}
                            className="w-full py-3.5 bg-primary text-black font-extrabold text-[11px] uppercase tracking-[0.15em] rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-[0_0_15px_rgba(242,170,76,0.15)]"
                        >
                            {uploading ? "Saving Project Details..." : "Save Project Details"}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Stored Projects ({projects.length})</h3>
                </div>

                {projects.length === 0 ? (
                    <div className="text-xs text-white/30 py-8 border border-dashed border-white/[0.05] rounded-xl text-center">
                        No custom project facts saved yet. Add a project above.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((proj) => {
                            const isExpanded = expandedProjectId === proj.id;
                            const match = proj.context.match(/^\[repo:([^;\]]+)(?:;commit:[^;\]]+)?(?:;pr:[^;\]]+)?\]\s*(.*)/);
                            const repoPath = match ? match[1] : null;
                            const cleanContext = match ? match[2] : proj.context;

                            return (
                                <div key={proj.id} className="bg-zinc-950/60 border border-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300">
                                    <div
                                        onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Terminal className="w-4 h-4 text-primary shrink-0" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-white">{proj.project_name}</h4>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {proj.tech_stack?.slice(0, 3).map((tech, i) => (
                                                        <span key={i} className="bg-white/[0.03] border border-white/[0.05] text-white/60 px-1.5 py-0.5 rounded text-[9px]">
                                                            {tech}
                                                        </span>
                                                    ))}
                                                    {proj.tech_stack?.length > 3 && (
                                                        <span className="text-[9px] text-white/40 self-center">
                                                            +{proj.tech_stack.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {repoPath && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRefetch(repoPath);
                                                    }}
                                                    disabled={syncingRepo !== null}
                                                    title={`Re-sync from ${repoPath}`}
                                                    className="p-1 hover:bg-white/[0.04] rounded text-primary transition-colors disabled:opacity-40"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${syncingRepo === repoPath ? 'animate-spin' : ''}`} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(proj.id);
                                                }}
                                                className="text-primary hover:text-primary/80 p-1 hover:bg-white/[0.04] rounded transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="px-5 pb-5 pt-2 border-t border-white/[0.04] space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div>
                                                <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1">Description</span>
                                                <p className="text-xs text-white/70 leading-relaxed">{cleanContext}</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed pt-2 border-t border-white/[0.04]">
                                                <div>
                                                    <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1.5">Technologies</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {proj.tech_stack?.map((tech, i) => (
                                                            <span key={i} className="bg-white/[0.03] border border-white/[0.05] text-white/80 px-1.5 py-0.5 rounded text-[10px]">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1.5">Signals</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {proj.signals?.map((sig, i) => (
                                                            <span key={i} className="bg-primary/5 border border-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                                                                {sig}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1.5">Deployments</span>
                                                    {isEditingDeployments === proj.id ? (
                                                        <div className="space-y-2 bg-zinc-950/60 border border-white/[0.04] p-2 rounded-xl">
                                                            {editingDeploymentsList.map((dep, idx) => (
                                                                <div key={idx} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5 text-[10px]">
                                                                    <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold uppercase px-1 py-0.5 rounded">
                                                                        {dep.component}
                                                                    </span>
                                                                    <span className="text-white/80 font-bold">{dep.platform}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingDeploymentsList(editingDeploymentsList.filter((_, i) => i !== idx))}
                                                                        className="text-white/40 hover:text-red-400 p-0.5"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            
                                                            <div className="space-y-1 pt-1.5 border-t border-white/[0.04]">
                                                                <select
                                                                    value={editNewComponent}
                                                                    onChange={(e) => setEditNewComponent(e.target.value)}
                                                                    className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white focus:outline-none"
                                                                >
                                                                    <option value="Frontend">Frontend</option>
                                                                    <option value="Backend">Backend</option>
                                                                    <option value="Database">Database</option>
                                                                    <option value="Full Stack">Full Stack</option>
                                                                </select>
                                                                <select
                                                                    value={editNewPlatform}
                                                                    onChange={(e) => {
                                                                        setEditNewPlatform(e.target.value);
                                                                        if (e.target.value !== "Other (Custom)") {
                                                                            setCustomEditNewPlatform("");
                                                                        }
                                                                    }}
                                                                    className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white focus:outline-none"
                                                                >
                                                                    <option value="">-- Platform --</option>
                                                                    {POPULAR_HOSTING_OPTIONS.filter(opt => opt !== "Other (Custom)").map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                    <option value="Other (Custom)">Other (Custom)</option>
                                                                </select>
                                                                {editNewPlatform === "Other (Custom)" && (
                                                                    <input
                                                                        type="text"
                                                                        value={customEditNewPlatform}
                                                                        onChange={(e) => setCustomEditNewPlatform(e.target.value)}
                                                                        placeholder="Custom platform..."
                                                                        className="w-full bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white focus:outline-none"
                                                                    />
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const platVal = editNewPlatform === "Other (Custom)" ? customEditNewPlatform : editNewPlatform;
                                                                        if (!platVal.trim()) return;
                                                                        setEditingDeploymentsList([...editingDeploymentsList, { component: editNewComponent, platform: platVal, status: "accepted" }]);
                                                                        setEditNewPlatform("");
                                                                        setCustomEditNewPlatform("");
                                                                    }}
                                                                    className="w-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold py-1 rounded"
                                                                >
                                                                    + Add to list
                                                                </button>
                                                            </div>
                                                            
                                                            <div className="flex gap-2 pt-1.5">
                                                                <button
                                                                    onClick={() => handleSaveDeployments(proj.id, editingDeploymentsList)}
                                                                    className="flex-1 bg-primary text-black text-[10px] font-extrabold py-1 rounded hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                                >
                                                                    Save All
                                                                </button>
                                                                <button
                                                                    onClick={() => setIsEditingDeployments(null)}
                                                                    className="flex-1 bg-white/5 text-white/60 text-[10px] font-bold py-1 rounded hover:bg-white/10 transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {(!proj.deployments || proj.deployments.length === 0) ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-white/40 italic">None</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            setIsEditingDeployments(proj.id);
                                                                            setEditingDeploymentsList([]);
                                                                            setEditNewComponent("Frontend");
                                                                            setEditNewPlatform("");
                                                                            setCustomEditNewPlatform("");
                                                                        }}
                                                                        className="text-[9px] text-primary font-bold hover:underline"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {proj.deployments.map((dep, idx) => {
                                                                        const isSuggested = dep.status === "suggested";
                                                                        return (
                                                                            <div key={idx} className={`p-1.5 rounded-lg border text-[10px] ${isSuggested ? 'bg-primary/5 border-primary/30 flex flex-col gap-1.5' : 'bg-white/[0.02] border-white/[0.04] flex items-center justify-between'}`}>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold uppercase px-1 py-0.5 rounded">
                                                                                        {dep.component}
                                                                                    </span>
                                                                                    <span className="text-white/80 font-bold">{dep.platform}</span>
                                                                                    {isSuggested && (
                                                                                        <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[8px] px-1 py-0.5 rounded font-bold uppercase ml-1 animate-pulse">
                                                                                            Suggested
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                
                                                                                {isSuggested ? (
                                                                                    <div className="flex gap-1.5">
                                                                                        <button
                                                                                            onClick={() => handleAcceptSuggestion(proj.id, idx)}
                                                                                            className="bg-primary text-black text-[8px] font-extrabold px-2 py-0.5 rounded hover:scale-105 active:scale-95 transition-all"
                                                                                        >
                                                                                            Accept
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleRejectSuggestion(proj.id, idx)}
                                                                                            className="bg-white/10 text-white/80 text-[8px] font-bold px-2 py-0.5 rounded hover:bg-white/20 transition-all"
                                                                                        >
                                                                                            Reject
                                                                                        </button>
                                                                                    </div>
                                                                                ) : null}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    <button
                                                                        onClick={() => {
                                                                            setIsEditingDeployments(proj.id);
                                                                            setEditingDeploymentsList(proj.deployments || []);
                                                                            setEditNewComponent("Frontend");
                                                                            setEditNewPlatform("");
                                                                            setCustomEditNewPlatform("");
                                                                        }}
                                                                        className="text-[9px] text-primary font-bold hover:underline block pt-1"
                                                                    >
                                                                        Edit Deployments
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {proj.features_built && proj.features_built.length > 0 && (
                                                <div className="pt-2">
                                                    <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1">Features Built</span>
                                                    <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                                                        {proj.features_built.map((feat, i) => (
                                                            <li key={i}>{feat}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {proj.evidence && proj.evidence.length > 0 && (
                                                <div className="pt-2">
                                                    <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1">Extracted Evidence</span>
                                                    <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                                                        {proj.evidence.map((ev, i) => (
                                                            <li key={i}>{ev}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
