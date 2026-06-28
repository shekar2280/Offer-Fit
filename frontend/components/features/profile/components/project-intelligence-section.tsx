"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/services/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { UnlinkGithubButton } from "../../auth/unlink-github-button";
import { DeploymentItem, ProjectIntel, FeatureInput } from "@/types";
import { GithubSyncPanel } from "./project-intelligence/github-sync-panel";
import { AddProjectForm } from "./project-intelligence/add-project-form";
import { ProjectCard } from "./project-intelligence/project-card";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
);

export function ProjectIntelligenceSection({ user }: { user: SupabaseUser }) {
    const supabase = createClient();

    const [projects, setProjects] = useState<ProjectIntel[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [isGithubLinked, setIsGithubLinked] = useState(false);
    const [repoUrl, setRepoUrl] = useState("");
    const [syncingRepo, setSyncingRepo] = useState<string | null>(null);
    const [showManualForm, setShowManualForm] = useState(false);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [projectName, setProjectName] = useState("");
    const [context, setContext] = useState("");
    const [techStack, setTechStack] = useState<string[]>([]);
    const [features, setFeatures] = useState<FeatureInput[]>([{ id: "1", name: "", description: "", commits: "" }]);
    const [deployments, setDeployments] = useState<DeploymentItem[]>([]);

    const fetchProjectIntel = async () => {
        try {
            const { data, error } = await supabase
                .from("project_intelligence")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            setProjects(data || []);
        } catch {}
    };

    const checkGithubStatus = () => {
        const providers = user?.app_metadata?.providers || [];
        const identities = user?.identities || [];
        setIsGithubLinked(providers.includes("github") || identities.some((id: any) => id.provider === "github"));
    };

    useEffect(() => {
        fetchProjectIntel();
        checkGithubStatus();
    }, [user]);

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
            const response = await fetch("http://127.0.0.1:8000/project-kb/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                body: JSON.stringify({
                    user_id: user.id,
                    project_name: projectName,
                    context,
                    technologies: techStack,
                    features: features.map(({ name, description, commits }) => ({ name, description, commits })),
                    deployments,
                }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setSuccessMsg(`Successfully saved details for ${projectName}!`);
                setProjectName(""); setContext(""); setTechStack([]);
                setFeatures([{ id: "1", name: "", description: "", commits: "" }]);
                setDeployments([]);
                setShowManualForm(false);
                fetchProjectIntel();
            } else {
                setErrorMsg(result.detail || "Save failed. Please check the backend connection.");
            }
        } catch {
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
        } catch {}
    };

    const handleGithubConnect = async () => {
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: "github",
                options: { scopes: "repo read:user", redirectTo: `${window.location.origin}/profile?tab=projects` },
            });
            if (error) throw error;
        } catch (e: any) {
            setErrorMsg("Failed to connect GitHub: " + e.message);
        }
    };

    const handleGithubSync = async () => {
        if (!repoUrl.trim()) return;
        setSyncingRepo("global");
        setErrorMsg(""); setSuccessMsg("");
        try {
            const githubIdentity = user?.identities?.find((id: any) => id.provider === "github");
            const githubEmail = githubIdentity?.identity_data?.email || user?.email || "";
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("http://127.0.0.1:8000/project-kb/github/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                body: JSON.stringify({ user_id: user.id, repo_url: repoUrl.trim(), github_email: githubEmail }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setSuccessMsg("Successfully synced repository!");
                setRepoUrl("");
                fetchProjectIntel();
            } else {
                setErrorMsg(result.detail || result.message || "Sync failed. Make sure the repository format is correct (owner/repo).");
            }
        } catch {
            setErrorMsg("Network error. Backend might be down.");
        } finally {
            setSyncingRepo(null);
        }
    };

    const handleRefetch = async (repoPath: string) => {
        setSyncingRepo(repoPath);
        setErrorMsg(""); setSuccessMsg("");
        try {
            const githubIdentity = user?.identities?.find((id: any) => id.provider === "github");
            const githubEmail = githubIdentity?.identity_data?.email || user?.email || "";
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("http://127.0.0.1:8000/project-kb/github/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                body: JSON.stringify({ user_id: user.id, repo_url: repoPath, github_email: githubEmail }),
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setSuccessMsg(`Successfully updated repository details for ${repoPath}!`);
                fetchProjectIntel();
            } else {
                setErrorMsg(result.detail || result.message || "Sync failed.");
            }
        } catch {
            setErrorMsg("Network error. Backend might be down.");
        } finally {
            setSyncingRepo(null);
        }
    };

    const handleSaveDeployments = async (projectId: string, list: DeploymentItem[]) => {
        try {
            const { error } = await supabase.from("project_intelligence").update({ deployments: list }).eq("id", projectId);
            if (error) throw error;
            setSuccessMsg("Deployments updated successfully!");
            fetchProjectIntel();
        } catch (e: any) {
            setErrorMsg("Failed to save deployments: " + e.message);
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
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)] cursor-default">
                            <GithubIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Connected</span>
                        </div>
                        <UnlinkGithubButton />
                    </div>
                ) : (
                    <button
                        onClick={handleGithubConnect}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 shadow-md shadow-black/20 hover:shadow-black/40 hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200 whitespace-nowrap"
                    >
                        <GithubIcon className="w-4 h-4 text-white shrink-0" />
                        <span>Connect GitHub</span>
                    </button>
                )}
            </div>

            {(errorMsg || successMsg) && (
                <div className="space-y-2">
                    {errorMsg && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] animate-in fade-in duration-200">
                            <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] animate-in fade-in duration-200">
                            <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span>
                        </div>
                    )}
                </div>
            )}

            {isGithubLinked && (
                <GithubSyncPanel repoUrl={repoUrl} setRepoUrl={setRepoUrl} syncingRepo={syncingRepo} onSync={handleGithubSync} />
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
                <AddProjectForm
                    projectName={projectName} setProjectName={setProjectName}
                    context={context} setContext={setContext}
                    techStack={techStack} setTechStack={setTechStack}
                    features={features} setFeatures={setFeatures}
                    deployments={deployments} setDeployments={setDeployments}
                    uploading={uploading}
                    onSubmit={handleIngest}
                    onClose={() => setShowManualForm(false)}
                />
            )}

            <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Stored Projects ({projects.length})</h3>
                {projects.length === 0 ? (
                    <div className="text-xs text-white/30 py-8 border border-dashed border-white/[0.05] rounded-xl text-center">
                        No custom project facts saved yet. Add a project above.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((proj) => (
                            <ProjectCard
                                key={proj.id}
                                proj={proj}
                                isExpanded={expandedProjectId === proj.id}
                                onToggle={() => setExpandedProjectId(expandedProjectId === proj.id ? null : proj.id)}
                                syncingRepo={syncingRepo}
                                onRefetch={handleRefetch}
                                onDelete={handleDelete}
                                onSaveDeployments={handleSaveDeployments}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
