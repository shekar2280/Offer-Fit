"use client";

import { useState } from "react";
import { Terminal, Trash2, ChevronDown, RefreshCw } from "lucide-react";
import { DeploymentItem, ProjectIntel } from "@/types";
import { DeploymentForm } from "./deployment-form";

interface ProjectCardProps {
    proj: ProjectIntel;
    isExpanded: boolean;
    onToggle: () => void;
    syncingRepo: string | null;
    onRefetch: (repoPath: string) => void;
    onDelete: (id: string) => void;
    onSaveDeployments: (projectId: string, list: DeploymentItem[]) => void;
}

export function ProjectCard({ proj, isExpanded, onToggle, syncingRepo, onRefetch, onDelete, onSaveDeployments }: ProjectCardProps) {
    const match = proj.context.match(/^\[repo:([^;\]]+)(?:;commit:[^;\]]+)?(?:;pr:[^;\]]+)?\]\s*(.*)/);
    const repoPath = match ? match[1] : null;
    const cleanContext = match ? match[2] : proj.context;

    const [isEditingDeployments, setIsEditingDeployments] = useState(false);
    const [editList, setEditList] = useState<DeploymentItem[]>([]);
    const [editComponent, setEditComponent] = useState("Frontend");
    const [editCustomComponent, setEditCustomComponent] = useState("");
    const [editPlatform, setEditPlatform] = useState("");
    const [editCustomPlatform, setEditCustomPlatform] = useState("");

    const startEditing = () => {
        setIsEditingDeployments(true);
        setEditList(proj.deployments || []);
        setEditComponent("Frontend");
        setEditPlatform("");
        setEditCustomPlatform("");
    };

    const handleAddToEditList = () => {
        const compVal = editComponent === "Other (Custom)" ? editCustomComponent : editComponent;
        const platVal = editPlatform === "Other (Custom)" ? editCustomPlatform : editPlatform;
        if (!platVal.trim() || !compVal.trim()) return;
        setEditList([...editList, { component: compVal, platform: platVal, status: "accepted" }]);
        setEditPlatform("");
        setEditCustomPlatform("");
        setEditComponent("Frontend");
        setEditCustomComponent("");
    };

    const handleSaveAll = () => {
        const compVal = editComponent === "Other (Custom)" ? editCustomComponent : editComponent;
        const platVal = editPlatform === "Other (Custom)" ? editCustomPlatform : editPlatform;
        let final = [...editList];
        if (platVal.trim() && compVal.trim()) final.push({ component: compVal, platform: platVal, status: "accepted" });
        onSaveDeployments(proj.id, final);
        setIsEditingDeployments(false);
    };

    return (
        <div className="bg-zinc-950/60 border border-white/[0.04] rounded-2xl overflow-hidden transition-all duration-300">
            <div
                onClick={onToggle}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-primary shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-white">{proj.project_name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {proj.tech_stack?.slice(0, 3).map((tech, i) => (
                                <span key={i} className="bg-white/[0.03] border border-white/[0.05] text-white/60 px-1.5 py-0.5 rounded text-[9px]">{tech}</span>
                            ))}
                            {proj.tech_stack?.length > 3 && (
                                <span className="text-[9px] text-white/40 self-center">+{proj.tech_stack.length - 3} more</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {repoPath && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRefetch(repoPath); }}
                            disabled={syncingRepo !== null}
                            title={`Re-sync from ${repoPath}`}
                            className="p-1 hover:bg-white/[0.04] rounded text-primary transition-colors disabled:opacity-40"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncingRepo === repoPath ? "animate-spin" : ""}`} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(proj.id); }}
                        className="text-primary hover:text-primary/80 p-1 hover:bg-white/[0.04] rounded transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
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
                                    <span key={i} className="bg-white/[0.03] border border-white/[0.05] text-white/80 px-1.5 py-0.5 rounded text-[10px]">{tech}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1.5">Signals</span>
                            <div className="flex flex-wrap gap-1">
                                {proj.signals?.map((sig, i) => (
                                    <span key={i} className="bg-primary/5 border border-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{sig}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1.5">Deployments</span>
                            {isEditingDeployments ? (
                                <div className="space-y-2 bg-zinc-950/60 border border-white/[0.04] p-2 rounded-xl">
                                    {editList.map((dep, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] rounded-lg px-2 py-1.5 text-[10px]">
                                            <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold uppercase px-1 py-0.5 rounded">{dep.component}</span>
                                            <span className="text-white/80 font-bold">{dep.platform}</span>
                                            <button type="button" onClick={() => setEditList(editList.filter((_, i) => i !== idx))} className="text-white/40 hover:text-red-400 p-0.5">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="pt-1.5 border-t border-white/[0.04]">
                                        <DeploymentForm
                                            component={editComponent} setComponent={setEditComponent}
                                            customComponent={editCustomComponent} setCustomComponent={setEditCustomComponent}
                                            platform={editPlatform} setPlatform={setEditPlatform}
                                            customPlatform={editCustomPlatform} setCustomPlatform={setEditCustomPlatform}
                                            onAdd={handleAddToEditList}
                                            compact
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-1.5">
                                        <button onClick={handleSaveAll} className="flex-1 bg-primary text-black text-[10px] font-extrabold py-1 rounded hover:scale-[1.02] active:scale-[0.98] transition-all">
                                            Save All
                                        </button>
                                        <button onClick={() => setIsEditingDeployments(false)} className="flex-1 bg-white/5 text-white/60 text-[10px] font-bold py-1 rounded hover:bg-white/10 transition-all">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {(!proj.deployments || proj.deployments.length === 0) ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-white/40 italic">None</span>
                                            <button onClick={startEditing} className="text-[9px] text-primary font-bold hover:underline">Add</button>
                                        </div>
                                    ) : (
                                        <>
                                            {proj.deployments.map((dep, idx) => {
                                                const isSuggested = dep.status === "suggested";
                                                return (
                                                    <div key={idx} className={`p-1.5 rounded-lg border text-[10px] ${isSuggested ? "bg-primary/5 border-primary/30 flex flex-col gap-1.5" : "bg-white/[0.02] border-white/[0.04] flex items-center justify-between"}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold uppercase px-1 py-0.5 rounded">{dep.component}</span>
                                                            <span className="text-white/80 font-bold">{dep.platform}</span>
                                                            {isSuggested && (
                                                                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[8px] px-1 py-0.5 rounded font-bold uppercase ml-1 animate-pulse">Suggested</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <button onClick={startEditing} className="text-[9px] text-primary font-bold hover:underline block pt-1">
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
                                {proj.features_built.map((feat, i) => <li key={i}>{feat}</li>)}
                            </ul>
                        </div>
                    )}

                    {proj.evidence && proj.evidence.length > 0 && (
                        <div className="pt-2">
                            <span className="font-bold text-white/50 text-[9px] uppercase tracking-wider block mb-1">Extracted Evidence</span>
                            <ul className="list-disc pl-4 text-xs text-white/70 space-y-1">
                                {proj.evidence.map((ev, i) => <li key={i}>{ev}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
